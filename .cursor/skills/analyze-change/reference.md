# Coverage scope

## Frontend

Config: `frontend/vite.config.ts`.

- Include: `src/**/*.{ts,tsx}`
- Exclude: `src/main.tsx`, `src/test/**`, `src/**/*.test.{ts,tsx}`, `src/design-system/**`, type files, barrels (`index.ts`), constants, `src/features/todos/api/queryKeys.ts`, and `src/lib/queryClient.ts`

Tests live next to the source as `*.test.ts` or `*.test.tsx`.

## Backend

Config: `backend/vitest.config.ts`.

- Include: `src/**/*.ts`
- Exclude: `src/**/types.ts` and `src/generated/**`
- Tests live in `backend/tests/**/*.test.ts`, not next to the source.
- `src/features/todos/validators.ts` and `src/features/todos/mappers.ts` must stay at 100% per file.

## Skip even when the file is in scope

- Markdown, workflow YAML, skill files, and the agent runner
- Lockfiles, `.env` files, and coverage output
- Edits that only change types, comments, or formatting
