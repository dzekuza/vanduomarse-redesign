---
tags: [architecture, stable]
updated: 2026-10-19
---

# Environment Variables

## Rules

- Secrets are **server-only** — never `NEXT_PUBLIC_`.
- Never hardcode URLs or keys in source.
- `.env.example` must exist and stay in sync with the table below.
- Never log or print an env var value.
- The `.env*` files are edited by the project owner, not by agents — an agent
  states what to add; the owner adds it.

## Variables

None are read by the code yet. Planned with Supabase (listed, commented
out, in `.env.example`):

| Name | Scope | Required | Purpose |
|------|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | with backend | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | with backend | Public anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | with backend | Admin operations in server actions only |

## Access

No typed accessor yet. When the first variable is read, add `lib/env.ts`
that parses `process.env` with Zod and import from it everywhere.

## Related

[[api-architecture]] · [[tech-stack]]
