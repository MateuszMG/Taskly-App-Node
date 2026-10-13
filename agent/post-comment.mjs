import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const marker = "<!-- unit-test-agent -->";
const repository = process.env.GITHUB_REPOSITORY;
const prNumber = process.env.PR_NUMBER;
const runUrl = `${process.env.GITHUB_SERVER_URL}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;

function loadReport() {
  try {
    return JSON.parse(readFileSync(new URL("./report.json", import.meta.url), "utf8"));
  } catch {
    return {
      status: "failed",
      summary: "The runner did not produce a report.",
      decisions: [],
      skills: [],
      commitSha: null,
      commands: [],
      coverage: [],
    };
  }
}

function lines(items, render, empty) {
  return items?.length ? items.map(render).join("\n") : empty;
}

const report = loadReport();
const commit = report.commitSha
  ? `[${report.commitSha.slice(0, 7)}](https://github.com/${repository}/commit/${report.commitSha})`
  : "Nothing was committed.";

const body = [
  marker,
  `## Unit test agent`,
  "",
  `**Result:** ${report.status}`,
  "",
  report.summary || "No summary was returned.",
  "",
  "### Decisions",
  "",
  lines(
    report.decisions,
    (decision) => `- \`${decision.file}\`: **${decision.action}** — ${decision.reason}`,
    "_No file decisions._",
  ),
  "",
  "### Skills",
  "",
  report.skills?.length ? report.skills.map((skill) => `- ${skill}`).join("\n") : "_No skills recorded._",
  "",
  "### Tests",
  "",
  `Commit: ${commit}`,
  "",
  lines(
    report.commands,
    (command) => `- \`${command.command}\`: ${command.status}`,
    "_No commands recorded._",
  ),
  "",
  "### Coverage",
  "",
  lines(
    report.coverage,
    (entry) => `- \`${entry.file}\`: ${entry.summary}`,
    "_No coverage notes._",
  ),
  "",
  `[Actions run](${runUrl})`,
].join("\n");

const comments = JSON.parse(
  execFileSync("gh", ["api", "--paginate", `repos/${repository}/issues/${prNumber}/comments`], {
    encoding: "utf8",
  }),
);
const existing = comments.find((comment) => comment.body?.includes(marker));
const payload = "comment-payload.json";
writeFileSync(payload, JSON.stringify({ body }));
if (existing) {
  execFileSync("gh", ["api", "--method", "PATCH", `repos/${repository}/issues/comments/${existing.id}`, "--input", payload], {
    stdio: "inherit",
  });
} else {
  execFileSync("gh", ["api", "--method", "POST", `repos/${repository}/issues/${prNumber}/comments`, "--input", payload], {
    stdio: "inherit",
  });
}
