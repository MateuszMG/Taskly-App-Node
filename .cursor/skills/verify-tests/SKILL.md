---
name: verify-tests
description: Use when running the Vitest files just written and reporting pass, fail, and coverage for the touched source.
---

# Verify tests

Run the tests you added or updated. Do not edit production code. If a test fails, fix the test and run it again, at most twice.

From `frontend` or `backend`, for each touched test file:

```sh
npx vitest run path/to/the.test.ts
```

Then, in each package you touched:

```sh
npm run test:coverage
```

Return:

- each command and whether it passed or failed
- coverage for the touched source files
- any `skip` decisions from analysis
- the failure output if a command still fails after the second retry

Stop after two failed attempts. Leave the failing test changes uncommitted.
