---
tags: [architecture, stable]
updated: 2026-10-30
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
| `RESEND_API_KEY` | server | no | Coupon emails (`lib/email/send-coupon.ts`, Resend HTTP API, no SDK). Without it "Pažymėti apmokėtu" still issues the code and the admin is told the email was not sent |
| `COUPON_FROM_EMAIL` | server | no | Sender for coupon emails, e.g. `Vanduo Marse <kuponai@vanduomarse.lt>`; must be on a Resend-verified domain. Needs `RESEND_API_KEY` too |
| `EMBED_ALLOWED_ORIGINS` | server | only for the WordPress widgets | Comma-separated origins allowed to frame `/embed/*` (CSP `frame-ancestors`, set in `proxy.ts` via `frameAncestors()` in `lib/embed.ts`). Non-origin entries are dropped; empty = same-origin only. Production: `https://vanduomarse.lt,https://www.vanduomarse.lt`; Vercel needs a redeploy after a change (ADR-0014) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | only for staff management | Read by `lib/supabase/admin.ts` and used **only** by the owner-only actions in `app/admin/staff-actions.ts` to create, reset and delete logins. Never touches data tables. Without it the Darbuotojai screen shows a clear message and everything else works |

Values: Supabase dashboard → Project Settings → API.

## Access

`lib/supabase/env.ts` (`supabaseEnv()`) is the only reader; it throws a clear
error when either variable is missing. Every client (`lib/supabase/server.ts`,
`lib/supabase/public.ts`, `proxy.ts`) goes through it.

## Related

[[api-architecture]] · [[tech-stack]]
