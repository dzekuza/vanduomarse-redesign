---
tags: [backend, stable]
updated: 2026-10-19
---

# API Architecture

## The contract

- External / third-party calls run **server-side** — in `app/api/**/route.ts` or a
  server action. The browser only ever calls same-origin `/api/*`.
- Secret keys are server-only env vars, read through the typed accessor. Never
  `NEXT_PUBLIC_`. See [[environment-variables]].
- Validate every input with `zod` at the boundary.
- Return a consistent envelope:

```ts
type ApiResponse<T> = { data: T } | { error: { message: string; code?: string } };
```

- Map errors to real status codes (400 validation, 401/403 auth, 404, 429, 5xx).
  Never leak an upstream error body to the client.

## Routes

| Route | Method | Input | Output | Auth |
|-------|--------|-------|--------|------|
| — | — | No API routes yet | — | — |

## Server actions

| Action | File | Purpose | Validation |
|--------|------|---------|------------|
| — | — | None yet. Planned: create booking / inquiry (public), and one per admin store action (ADR-0005) | Zod, reusing the admin form schemas |

## Related

[[data-flow]] · [[database]] · [[environment-variables]]
