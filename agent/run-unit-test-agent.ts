import { readFileSync, writeFileSync } from "node:fs";
import { Agent, CursorAgentError } from "@cursor/sdk";

interface Decision {
  file: string;
  action: "add" | "update" | "skip";
  reason: string;
}

interface CommandResult {
  command: string;
  status: "pass" | "fail";
}

interface CoverageNote {
  file: string;
  summary: string;
}

interface AgentReport {
  status: "passed" | "skipped" | "failed";
  summary: string;
  decisions: Decision[];
  skills: string[];
  commitSha: string | null;
  commands: CommandResult[];
  coverage: CoverageNote[];
}

const reportPath = process.env.REPORT_PATH ?? new URL("./report.json", import.meta.url);

function writeReport(report: AgentReport): void {
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}

function failed(summary: string): AgentReport {
  return {
    status: "failed",
    summary,
    decisions: [],
    skills: [],
    commitSha: null,
    commands: [],
    coverage: [],
  };
}

function closedPullRequest(summary: string): boolean {
  return summary.includes("pr_resolution_failed") || summary.includes("no longer exists");
}

function finish(report: AgentReport): void {
  if (report.status === "failed" && closedPullRequest(report.summary)) {
    writeReport({ ...report, status: "skipped" });
    return;
  }
  writeReport(report);
  if (report.status === "failed") process.exitCode = 1;
}

function parseReport(text: string | undefined): AgentReport | undefined {
  if (!text) return undefined;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const source = fenced?.[1] ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return undefined;
  const parsed = JSON.parse(source.slice(start, end + 1)) as Partial<AgentReport>;
  if (parsed.status !== "passed" && parsed.status !== "skipped" && parsed.status !== "failed") {
    return undefined;
  }
  return {
    status: parsed.status,
    summary: parsed.summary ?? "",
    decisions: parsed.decisions ?? [],
    skills: parsed.skills ?? [],
    commitSha: parsed.commitSha ?? null,
    commands: parsed.commands ?? [],
    coverage: parsed.coverage ?? [],
  };
}

const apiKey = process.env.CURSOR_API_KEY;
const prNumber = process.env.PR_NUMBER;
const baseBranch = process.env.PR_BASE;
const headBranch = process.env.PR_HEAD;
const repository = process.env.GITHUB_REPOSITORY ?? "MateuszMG/Taskly-App-Node";

if (!apiKey || !prNumber || !baseBranch || !headBranch) {
  finish(failed("PR_NUMBER, PR_BASE, PR_HEAD, and CURSOR_API_KEY are required."));
} else {
  const instructions = readFileSync(
    new URL("../.cursor/agents/unit-test-agent.md", import.meta.url),
    "utf8",
  );
  const prompt = [
    instructions,
    "",
    `Pull request: ${prNumber}`,
    `Repository: ${repository}`,
    `Base branch: ${baseBranch}`,
    `Head branch: ${headBranch}`,
    "Push any test commit to the head branch. Do not open another pull request.",
  ].join("\n");

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2.5" },
      name: `unit-test-agent-pr-${prNumber}`,
      cloud: {
        repos: [
          {
            url: `https://github.com/${repository}`,
            startingRef: headBranch,
            prUrl: `https://github.com/${repository}/pull/${prNumber}`,
          },
        ],
        workOnCurrentBranch: true,
        autoCreatePR: false,
        skipReviewerRequest: true,
      },
    });

    const report = parseReport(result.result);
    if (result.status === "error") {
      finish(
        report ??
          failed(result.error?.message ?? "The cloud agent run failed before it returned a report."),
      );
    } else if (!report) {
      finish(failed("The cloud agent finished without a JSON report."));
    } else {
      finish(report);
    }
  } catch (error) {
    const message =
      error instanceof CursorAgentError
        ? error.message
        : error instanceof Error
          ? error.message
          : "The cloud agent could not be started.";
    finish(failed(message));
  }
}
