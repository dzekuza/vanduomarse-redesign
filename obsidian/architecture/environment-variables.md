---
tags: [architecture, stable]
updated: 2026-10-22
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

| Name | Scope | Required | Purpose |
|------|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | **yes** | Supabase project URL (project "Vanduo") |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | **yes** | Public anon key; RLS decides what it can see |
| `SUPABASE_SERVICE_ROLE_KEY` | server | no | Not read by the app. Reserved for future public-booking writes or scripts |

Values: Supabase dashboard → Project Settings → API.

## Access

`lib/supabase/env.ts` (`supabaseEnv()`) is the only reader; it throws a clear
error when either variable is missing. Every client (`lib/supabase/server.ts`,
`lib/supabase/public.ts`, `proxy.ts`) goes through it.

## Related

[[api-architecture]] · [[tech-stack]]
