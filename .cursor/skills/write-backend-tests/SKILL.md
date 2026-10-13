---
name: write-backend-tests
description: Use when adding or updating Vitest and Supertest tests for backend source that was marked add or update.
---

# Write backend tests

Write tests only for backend files marked `add` or `update`. Leave production code unchanged.

- Put tests in `backend/tests/`, named after the module, for example `backend/tests/router.test.ts`.
- Use Vitest and Supertest. Import source with a `.ts` extension, matching the existing tests.
- Mock Prisma. Do not require a running PostgreSQL instance. Follow `backend/tests/repository.test.ts`: construct `createDatabase` with a fake URL, or pass a fake database object, and spy on the delegate methods.
- Keep `src/features/todos/validators.ts` and `src/features/todos/mappers.ts` at 100% statement, branch, function, and line coverage per file.
- Assert HTTP status, response body, and that the repository was called with the parsed input. Do not assert private implementation details that the route does not expose.

Patterns for health, config, and the app factory are in `reference.md`.
