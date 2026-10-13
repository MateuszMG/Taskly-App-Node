# Verification report

Use this shape inside the agent result:

```json
{
  "commands": [{ "command": "npm test", "status": "pass" }],
  "coverage": [{ "file": "frontend/src/lib/http.ts", "summary": "lines 100%" }]
}
```

`status` is `pass` or `fail`. Include the package directory in the command, for example `cd frontend && npx vitest run src/lib/http.test.ts`.

Coverage HTML stays local. Do not commit `frontend/coverage` or `backend/coverage`.
