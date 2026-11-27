---
tags: [architecture, stable]
updated: 2026-11-16
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
| `RESEND_API_KEY` | server | no | All email, through `sendEmail` in `lib/email/resend.ts` (Resend HTTP API, no SDK): coupon emails (`lib/email/send-coupon.ts`) and booking notifications (`lib/email/notify.ts`, dispatched with SMS by `lib/notify.ts`). Without it "Pažymėti apmokėtu" still issues the code (admin told the email was not sent) and bookings are texted only |
| `NOTIFY_FROM_EMAIL` | server | no | Sender for booking emails, e.g. `Vanduo Marse <rezervacijos@vanduomarse.lt>`, on a Resend-verified domain; falls back to `COUPON_FROM_EMAIL`. Replies go to `MAIN_CONTACT.email` |
| `STAFF_NOTIFY_EMAIL` | server | no | Fallback staff inbox(es), comma-separated, for services without a fixed inbox (event tickets and registrations, calculator inquiries). Sauna and quads go to `renginiai@vanduomarse.lt`, stays to `miegas@vanduomarse.lt` (`STAFF_INBOX` in `lib/contacts.ts`), whatever this is set to. Empty = no email for the other services |
| `COUPON_FROM_EMAIL` | server | no | Sender for coupon emails, e.g. `Vanduo Marse <kuponai@vanduomarse.lt>`; must be on a Resend-verified domain. Needs `RESEND_API_KEY` too |
| `EMBED_ALLOWED_ORIGINS` | server | only for the WordPress widgets | Comma-separated origins allowed to frame `/embed/*` (CSP `frame-ancestors`, set in `proxy.ts` via `frameAncestors()` in `lib/embed.ts`). Non-origin entries are dropped; empty = same-origin only. Production: `https://vanduomarse.lt,https://www.vanduomarse.lt`; Vercel needs a redeploy after a change (ADR-0014) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | **yes** (staff management + phone gate) | Read by `lib/supabase/admin.ts`. Used by the owner-only actions in `app/admin/staff-actions.ts` (create, reset, delete logins) and by `app/actions/phone.ts` to call `request_phone_code` / `verify_phone_code`, the only functions it touches (ADR-0018). Without it the phone gate says SMS checks are down, so nobody can book online |
| `PHONE_VERIFICATION_SECRET` | server | **yes** | 32+ random chars. `lib/phone-verification.ts` derives three keys from it: SMS code HMAC, client IP HMAC, verification token signature. Rotating it invalidates every verified phone (visitors re-verify) |
| `STRIPE_SECRET_KEY` | server | for online payment | Restricted key (`rk_…`, Checkout Sessions write, Payment Intents read) or secret key. Read by `lib/stripe.ts`. Online payment on `/rezervacija` is on only when this **and** `STRIPE_WEBHOOK_SECRET` are set |
| `CRON_SECRET` | server | for the Sirvoy sync | Bearer token Vercel Cron sends to `/api/cron/sirvoy-sync`; without it the route answers 503 and nothing syncs. 32+ random characters. Every-15-minutes cron needs a Vercel Pro plan (Hobby: once a day). Set in Vercel and, to try it locally, `.env.local` (ADR-0102) |
| `STRIPE_WEBHOOK_SECRET` | server | for online payment | Signing secret (`whsec_…`) of the endpoint `https://<site>/api/stripe/webhook`; verified in `app/api/stripe/webhook/route.ts` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | client + server | no | GA4 measurement id (`G-…`). Public (it is in the page). Google Analytics loads only after analytics consent (ADR-0085) |
| `NEXT_PUBLIC_META_PIXEL_ID` | client + server | no | Meta Pixel id (digits). Public. The Pixel loads only after marketing consent (ADR-0085, ADR-0105); also the dataset the Conversions API posts to |
| `NEXT_PUBLIC_GTM_ID` | client | no | Google Tag Manager container (`GTM-…`), e.g. `GTM-5KK2VHQS`. Public. Loads only after analytics or marketing consent, with Google Consent Mode v2 set from the choice (ADR-0138). Do not add a GA4 tag in the container while `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set |
| `META_CAPI_ACCESS_TOKEN` | server, **secret** | for the Meta Conversions API | Events Manager access token for Pixel `NEXT_PUBLIC_META_PIXEL_ID`; read only by `lib/meta-capi.ts`. Never `NEXT_PUBLIC_`. Without it nothing is sent server-side (ADR-0107) |
| `META_CAPI_TEST_EVENT_CODE` | server | no, **leave unset in production** | Events Manager → Test events code, for local development: events from `localhost` go to Test events only, and `localhost` sends nothing without it. Ignored for events from the live site |
| `SITE_URL` | server | no | Public origin for the Stripe return URLs (e.g. `https://vanduomarse.lt`); defaults to the request's own origin. Also the `/paskyra` and `/admin` links in emails, which are left out (customer) or relative (staff) without it |

Values: Supabase dashboard → Project Settings → API. Stripe: Developers → API keys and Webhooks (use a sandbox for development).

## Access

`lib/supabase/env.ts` (`supabaseEnv()`) is the only reader; it throws a clear
error when either variable is missing. Every client (`lib/supabase/server.ts`,
`lib/supabase/public.ts`, `proxy.ts`) goes through it.

## Related

[[api-architecture]] · [[tech-stack]]


## SMS and email in local development

`EMAIL_IN_DEV` (optional, `1`): by default `next dev` logs booking emails to the server console instead of sending them; set it to send real ones. Coupon emails (a deliberate staff action) always send. Ignored in production builds.

`SMS_IN_DEV` (optional, `1`): by default `next dev` sends no SMS and the phone gate auto-confirms the typed number; set it to send real SMS locally. Ignored in production builds.

`PHONE_VERIFICATION_SKIP` (optional, `1`, **test only**): shows the "Praleisti telefono patvirtinimą" button on the phone gate in production and lets the server accept a number without an SMS code (records the verification through `record_skipped_phone`). Off by default; remove it to close the gate. Needs migration `20261104100000`. ADR-0023.
