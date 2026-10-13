---
name: write-frontend-tests
description: Use when adding or updating Vitest and React Testing Library tests for frontend source that was marked add or update.
---

# Write frontend tests

Write tests only for frontend files marked `add` or `update`. Leave production code unchanged.

- Colocate `*.test.ts` or `*.test.tsx` next to the source. Use `.tsx` when the test contains JSX.
- Reuse `frontend/src/test/setup.ts` and `frontend/src/test/todoFixture.ts`.
- Mock `fetch` in tests for `src/lib/http.ts`. Assert the path, status handling, and the error messages the user sees.
- Test hooks with `renderHook` from React Testing Library. Wrap React Query hooks in a fresh `QueryClientProvider`.
- Mock `src/design-system` with `vi.mock('...', () => import('.../design-system/mocks'))` when rendering components.
- Assert behavior: what the user sees, what callback fires, and how the cache changes. Do not snapshot large trees of markup.

Style and the hook cache rules are in `reference.md`.
