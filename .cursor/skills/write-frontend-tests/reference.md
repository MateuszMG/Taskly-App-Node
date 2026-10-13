# Frontend test conventions

Match the existing tests: single quotes, no semicolons, Testing Library queries by role.

React Query hooks:

- `useTodosQuery` calls `todosApi.list` with an `AbortSignal`.
- `useCreateTodoMutation` prepends the saved task and removes an older copy with the same id. An empty cache becomes a one-item list.
- `useUpdateTodoMutation` replaces the matching id. A missing list cache stays missing.
- `useDeleteTodoMutation` removes the id. A missing list cache stays missing.
- `useTodosBusy` is true only while a mutation whose key starts with `['todos']` is in flight.
- `useTodoFilters` starts at filter `all`, search `''`, and sort `newest`, then narrows `visible` through `selectTodos`.

Run a single file from `frontend` with:

```sh
npx vitest run src/path/to/file.test.ts
```
