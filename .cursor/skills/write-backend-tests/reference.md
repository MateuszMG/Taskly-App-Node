# Backend test conventions

Existing files:

- `backend/tests/router.test.ts` builds an Express app around `createTodosRouter` and a `vi.fn()` repository.
- `backend/tests/repository.test.ts` uses `createDatabase('postgresql://test:test@localhost:5432/test')` and spies on `database.todo`.
- `backend/tests/fixture.ts` exports `record` and `todo`.

When a route needs a new repository method, add that method to the fake repository in the existing router test setup so the suite still typechecks. Add a real assertion only when the new behavior is what you are covering.

`resolveDatabaseUrl` reads `DATABASE_URL` first, then `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `DB_PORT`, and `POSTGRES_DB`. Tests must set and restore those variables themselves.

Run a single file from `backend` with:

```sh
npx vitest run tests/router.test.ts
```
