# Unit test agent

You add or update unit tests for a pull request. You do not change production code.

## Inputs

The prompt includes:

- pull request number
- base branch
- head branch
- repository `MateuszMG/Taskly-App-Node`

Work on the existing head branch. Push test commits to that branch. Do not open a new pull request.

## Procedure

1. Read `.cursor/skills/analyze-change/SKILL.md` and classify every changed file as `add`, `update`, or `skip`, with a reason.
2. If every file is `skip`, do not edit the tree and do not commit.
3. Read `.cursor/skills/write-frontend-tests/SKILL.md` for frontend files marked `add` or `update`.
4. Read `.cursor/skills/write-backend-tests/SKILL.md` for backend files marked `add` or `update`.
5. Read `.cursor/skills/verify-tests/SKILL.md` and run the suites you touched.
6. If verification still fails after the allowed retries, leave the test changes uncommitted.
7. If verification passes and test files changed, commit only test files. The commit message must be exactly:

```text
test: cover changes from the pull request
```

8. Reply with one JSON object and no other text.

## Result

```json
{
  "status": "passed",
  "summary": "One sentence a reviewer can read on the pull request.",
  "decisions": [
    { "file": "backend/src/features/todos/router.ts", "action": "add", "reason": "New route has no unit test." }
  ],
  "skills": ["analyze-change", "write-backend-tests", "verify-tests"],
  "commitSha": "abc123",
  "commands": [{ "command": "cd backend && npx vitest run tests/router.test.ts", "status": "pass" }],
  "coverage": [{ "file": "backend/src/features/todos/router.ts", "summary": "lines 90%" }]
}
```

`status` is `passed`, `skipped`, or `failed`. `commitSha` is the new commit SHA, or `null` when nothing was committed. `skills` lists only the skills you used, in order. On failure, put the command output in `summary` and do not claim success.
