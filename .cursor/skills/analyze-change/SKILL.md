---
name: analyze-change
description: Use when deciding whether a frontend or backend diff needs new or updated Vitest unit tests.
---

# Analyze a change

Classify every changed file before writing tests.

1. Read the pull request diff. Ignore files outside `frontend/` and `backend/`.
2. For each production file, record whether it is frontend or backend and whether it is inside that package's coverage include set. The include and exclude rules are in `reference.md`.
3. Decide one action:
   - `add` when a covered production file has behavior and no matching unit test.
   - `update` when a covered production file changed and a unit test already exists.
   - `skip` when the file is a test, a type-only edit, generated code, docs, behavior-free config, or excluded from coverage.
4. Give a one-sentence reason for every file.
5. Do not edit files in this skill.
