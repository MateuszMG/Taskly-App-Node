# Solution

## Decisions

GitHub Actions starts one Cursor cloud agent per pull request (`@cursor/sdk`). The agent reads the diff, writes tests, runs them, and pushes to the same branch.

Four skills do one job each: decide, write frontend tests, write backend tests, verify. The agent commits test files only. Forks are skipped, so they never see `CURSOR_API_KEY`. A commit message of `test: cover changes from the pull request` stops the next run, so the agent's own commit does not loop.

## How to run it

You need Node.js `>= 22.13`, Actions set to read and write, and a `CURSOR_API_KEY` repository secret from the Cursor dashboard, with GitHub connected. Do not commit the key.

`.github/workflows/unit-test-agent.yml` runs on pull request opened, synchronize, and reopened. Look for one comment that starts with `<!-- unit-test-agent -->`.

## Agent and skills

Procedure: `.cursor/agents/unit-test-agent.md`. Runner: `agent/run-unit-test-agent.ts`. Comment: `agent/post-comment.mjs`.

Order: `analyze-change`, then `write-frontend-tests` or `write-backend-tests`, then `verify-tests` (Vitest, then coverage, at most two retries).

## Example run

Demo: [pull request 2](https://github.com/MateuszMG/Taskly-App-Node/pull/2). The feature adds task duplication and no tests for it.

[Run 38401494953](https://github.com/MateuszMG/Taskly-App-Node/actions/runs/38401494953) used all four skills. It skipped OpenAPI, types, query keys, and existing test files. It updated the repository, router, API client, task row, and page tests, and added `useDuplicateTodoMutation.test.tsx`.

Result: **passed**. Test-only commit [7ba0e7e](https://github.com/MateuszMG/Taskly-App-Node/commit/7ba0e7e). Repository, the new hook, and `TodoItem` were reported at 100% lines. All four commands passed: the two targeted Vitest runs, then `npm run test:coverage` in backend and frontend.

[Run 38402385011](https://github.com/MateuszMG/Taskly-App-Node/actions/runs/38402385011) saw that commit message and skipped in 11 seconds. Locally, `npm test` passed: 42 frontend tests, 68 backend tests.

[Pull request 1](https://github.com/MateuszMG/Taskly-App-Node/pull/1) only added tests and tooling. The agent used `analyze-change` and skipped every file.

A later docs push, [run 38403386142](https://github.com/MateuszMG/Taskly-App-Node/actions/runs/38403386142), passed again and committed nothing. The pull request keeps a single comment, so that later run replaces the text. The run that wrote the tests is 38401494953.

## Assumptions

Tests mock Prisma and do not need PostgreSQL. Design-system files, types, barrels, constants, `queryClient.ts`, and `queryKeys.ts` stay out of frontend coverage. A person reviews the test commit before merge.

## Limitations

The agent reads the whole diff, so a large pull request is slower and easier to miss. The loop guard is the commit message, so anyone using that message also skips the workflow. Passing tests can still leave gaps: `TodosPage.tsx` was reported at 45% lines.

## Production

I would add coverage thresholds on the touched files, a `tests-reviewed` label before merge, a cap on diff size and runtime, a cheaper model for the analyze step, and a GitHub App author so the loop guard is not only a commit message.
