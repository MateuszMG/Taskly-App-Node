# Solution

## Decisions

The pull request workflow starts a Cursor cloud agent from GitHub Actions through `@cursor/sdk`. The agent runs on Cursor's infrastructure, can read this repository, and can push to the pull request branch through the connected GitHub account.

Skills are split into analyze, write, and verify. Each skill is small enough to load for one decision, and the same skills cover the frontend and the backend.

The agent may commit test files only. Production changes stay in the pull request that a person opened.

The workflow runs only for pull requests whose head repository is `MateuszMG/Taskly-App-Node`. Forks never receive `CURSOR_API_KEY`.

A follow-up run is skipped when the head commit message is exactly `test: cover changes from the pull request`. Cloud commits are authored by Cursor Agent on the connected GitHub account, so the message is the loop guard.

## How to run it

Prerequisites: Node.js `>= 22.13` for the runner (`>= 22.12` for the app), Actions enabled with read and write permissions, and a `CURSOR_API_KEY` repository secret. The key is created in the Cursor dashboard and the GitHub account is connected there. Do not commit the key.

Workflow: `.github/workflows/unit-test-agent.yml`.

It starts on `pull_request` `opened`, `synchronize`, and `reopened`. The comment on the pull request begins with `<!-- unit-test-agent -->` and is updated in place. The comment states the result, the decision for each file, the skills used, the test commit, the commands, and the Actions run.

## Where the agent and skills live

The procedure is `.cursor/agents/unit-test-agent.md`. The runner is `agent/run-unit-test-agent.ts`. It sends that procedure to one cloud agent targeted at the pull request head branch (`workOnCurrentBranch`, no new pull request).

Skills, in the order the agent uses them:

1. `.cursor/skills/analyze-change/` decides `add`, `update`, or `skip`.
2. `.cursor/skills/write-frontend-tests/` or `.cursor/skills/write-backend-tests/` writes tests for files that need them.
3. `.cursor/skills/verify-tests/` runs Vitest and coverage, then retries a failing test at most twice.

`agent/post-comment.mjs` turns the agent's JSON into the pull request comment.

## Example run

Demo pull request: https://github.com/MateuszMG/Taskly-App-Node/pull/2

The feature commit adds task duplication and does not add tests for it. Actions run [38401494953](https://github.com/MateuszMG/Taskly-App-Node/actions/runs/38401494953) analyzed that diff.

The agent used `analyze-change`, `write-backend-tests`, `write-frontend-tests`, and `verify-tests`. It skipped OpenAPI, type-only edits, query-key constants, and existing test files. It updated tests for the repository, router, API client, task row, and page, and added `useDuplicateTodoMutation.test.tsx`.

It committed only those tests as [7ba0e7e](https://github.com/MateuszMG/Taskly-App-Node/commit/7ba0e7e) with the message `test: cover changes from the pull request`. Backend repository lines were reported at 100%. The duplicate hook and `TodoItem` were reported at 100% lines. Commands:

- `cd backend && npx vitest run tests/repository.test.ts tests/router.test.ts`: pass
- `cd frontend && npx vitest run src/features/todos/api/todos.test.ts src/features/todos/hooks/useDuplicateTodoMutation.test.tsx src/features/todos/components/TodoItem.test.tsx src/features/todos/TodosPage.test.tsx`: pass
- `cd backend && npm run test:coverage`: pass
- `cd frontend && npm run test:coverage`: pass

That comment result was **passed**. The next run, [38402385011](https://github.com/MateuszMG/Taskly-App-Node/actions/runs/38402385011), saw that commit message and skipped the agent in about 11 seconds.

Pushing this file replaced the comment. Run [38403386142](https://github.com/MateuszMG/Taskly-App-Node/actions/runs/38403386142) also finished **passed**, skipped `SOLUTION.md` as documentation, and committed nothing because the duplication tests were already on the branch. It used the same four skills and the same four commands, all pass. A later documentation push can refresh that single comment again. The run that created the tests remains [38401494953](https://github.com/MateuszMG/Taskly-App-Node/actions/runs/38401494953).

Checked out locally, `npm test` passed: 42 frontend tests and 68 backend tests.

Pull request [#1](https://github.com/MateuszMG/Taskly-App-Node/pull/1) is the coverage and tooling change. Its run skipped every file because the diff contained tests, skills, and the workflow, not new production behavior. That run used only `analyze-change`.

## Assumptions

Unit tests do not need PostgreSQL. Prisma is mocked.

Design-system files, type files, barrels, constants, `queryClient.ts`, and `queryKeys.ts` stay outside frontend coverage.

The agent does not edit production code. A person reviews the test commit before merge.

## Limitations

Fork pull requests are ignored.

The agent sees the whole pull request diff. A very large diff costs more and is more likely to miss a file.

The loop guard is the commit message. A person using that same message would also skip the workflow.

Generated tests can miss behavior even when the commands pass. `TodosPage.tsx` was still reported at 45% lines after the demo run.

There is one comment per pull request. A later push replaces that comment with the latest analysis.

## Production changes

Add numeric coverage thresholds for the files the agent touches, and require them in the workflow.

Require a label such as `tests-reviewed` before a test commit can merge.

Cap retries, diff size, and runtime, and use a cheaper model for `analyze-change` than for writing tests.

Run the agent as a GitHub App identity so the loop guard can key off the author as well as the commit message.
