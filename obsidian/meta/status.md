---
tags: [meta, status]
updated: 2026-11-05
---

# Current status — vanduomarse-redesign

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-05

## Current focus

**Coming-soon gate (2026-11-05): built, uncommitted, off until env is set.** `/apie-marsa` removed. `SITE_GATE=1` makes every public page show `/netrukus` (503); `/admin`, `/api` and assets stay open; `SITE_GATE_CODE` adds a preview-code field (cookie for 30 days) (ADR-0037). Tested locally with the gate on: public paths 503, admin 200, wrong code error, right code opens `/rezervacija`, httpOnly cookie, bad cookie still gated; gate off: site normal, `/netrukus` → `/`. Gate page checked at 375 / 768 / 1024 (code field only at 1024). To switch on: add `SITE_GATE=1` and a long `SITE_GATE_CODE` in Vercel, commit, redeploy.

**Custom domain (2026-11-05): live.** `vanduomarse.lt` 308-redirects to `https://www.vanduomarse.lt` (Vercel), which serves the app. `SITE_URL` is the www host (owner updated `.env.local` and Vercel); the Stripe webhook is now `https://www.vanduomarse.lt/api/stripe/webhook` (five events, enabled; the vercel.app endpoint is gone) with its `whsec_` set. Added `lib/site.ts`, `metadataBase`, `app/robots.ts` and `app/sitemap.ts` (uncommitted). Still to do: Supabase Auth → URL Configuration (Site URL + redirect URLs to the www host); submit the sitemap in Search Console after deploy; `EMBED_ALLOWED_ORIGINS` only if a WordPress site still frames the widgets. `vanduomarse-redesign.vercel.app` still serves 200 (duplicate content, but the WordPress plugin updater depends on it, ADR-0014).

**Discount codes (2026-11-05): merged into `main` (PR #13).** "Nuolaidos kodas" in the /rezervacija checkout and `/admin/nuolaidos` (ADR-0036). Migrations `20261104190000`, `20261104191000` and `20261105150000_discount_codes` are applied to the live project. Not yet checked: `/admin/nuolaidos` in the browser at 375 / 768 / 1024 px (needs a staff sign-in), and one checkout with a real code.

**SMS sender name (2026-11-05): set up, delivery not yet confirmed.** Twilio account is Full/active. Two Messaging Services: `Vanduo Marse - pranešimai` (notifications, `MG8775…`) and `Vanduo Marse - prisijungimo kodai` (verification, `MGd815…`), both with alpha sender `VanduoMarse` and no phone number in the pool. `TWILIO_FROM_NUMBER=VanduoMarse` locally; the Vercel Twilio vars were updated and production redeployed afterwards. The last Twilio message (16:24) failed with error 21212 because its From was the alpha sender's own SID (`AI…`), not the name or a service SID. Supabase → Auth → Phone → Twilio must use the codes service SID `MGd815…` (not checkable from here). No test SMS sent since.

**Stripe (2026-11-05): configured, not yet exercised.** `.env.local` has a clean live key (`sk_live_`, Stripe API answers 200) and a `whsec_` secret; Vercel now has `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `SITE_URL` (redeploy so production picks them up). The webhook endpoint `https://www.vanduomarse.lt/api/stripe/webhook` is registered in Stripe with the five events and enabled. It is the park's **live** account (also used by Wakesys), so a checkout test charges a real card (refund it in Stripe) unless a sandbox key is used. Locally, webhooks need `stripe listen --forward-to localhost:3000/api/stripe/webhook` and its `whsec_`. No checkout has been run.

**Booking email notifications (Resend) are merged into `main` (PR #12, 2026-11-05); Resend sending works.** Migration `20261105120000_notify_account_email` (confirmed account email for confirm/cancel and payment emails) is applied to the live project. Note: a fresh type generation drops `graphql_public` and makes `create_inquiry.p_date` required, which breaks `createInquiry`; the committed types file was kept. A test email from `rezervacijos@vanduomarse.lt` was accepted (HTTP 200) on 2026-11-05 with the keys in `.env.local`; booking emails through the app are not tried yet. Every SMS event now also emails: the customer on request received, confirmed/cancelled and payment received, but only to an account-confirmed address (anonymous phone-code forms get SMS only; calculator inquiries notify staff only); staff on new request, paid and double charge at the service's inbox (sauna + quads → renginiai@, stays → miegas@, other → `STAFF_NOTIFY_EMAIL`; new and paid also copied to marketingas@) (ADR-0028: `lib/notify.ts` → `lib/email/notify.ts` + `lib/sms/notify.ts`). `tsc` and eslint are clean; deploy needs migration `20261105120000` (already applied). To switch on: add `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` (verified Resend domain), `STAFF_NOTIFY_EMAIL` and `SITE_URL` to `.env.local` and Vercel, then file one test booking with `EMAIL_IN_DEV=1` (dev logs emails otherwise). The same Resend domain can be the custom SMTP for Supabase Auth email codes.

**PR #10 (accounts, payments, Mano rezervacijos) was merged into `main` on 2026-11-04; all four migrations are applied to the live project.** The email notifications followed in PR #12 (`feat/email-notifications`), merged 2026-11-05. The payment-hardening migration `20261104180000_payment_session_guards` was applied through the Supabase MCP (ledger aligned, functions and privileges verified, generated types unchanged). Stripe is configured and the webhook registered (see the Stripe paragraph above); what remains is a checkout test (paid, abandoned, refunded, double-session).

**Account page renamed "Mano rezervacijos"; the full account path works.** Sign-in, name and a real reservation (PM-1068, 6 Nov 10:00–13:00, 200 €, pending, linked to the account, no payment because the running dev server started before the Stripe keys were added) were done in the browser and the reservation shows on the page through RLS. Restart `pnpm dev` (and redeploy Vercel) so `STRIPE_*` takes effect and the button becomes "Mokėti". PM-1068 is a test booking: cancel it in `/admin` or let the 48 h expiry take it. The code-step button fix is reasoned and linted but not yet seen in the browser (needs a sent code).

**Account page `/paskyra` added; sign-in works for a new account, test-OTP override and Twilio delivery still need attention.** `/paskyra` (signed out: code sign-in; signed in: profile, name, own reservations with payment status, sign out) is built, migration `20261104170000_customer_own_requests` is applied (ledger aligned) and `tsc`/eslint are clean. A new account was created for `+37067312315` through the checkout step (Supabase log: `user_signedup`), but: Supabase's test-number override (`37067312315=000000`) was not active at 16:29 (a real SMS was attempted both times), and the US sender `+1 74…521` delivered once and failed twice with `30003` to that number (Trial account too). So the returning-account sign-in and the signed-in view of `/paskyra` are not exercised yet.

**Account login at checkout (ADR-0027) replaces the phone gate on `/rezervacija`; migrations applied 2026-11-04, Supabase Auth setup and real-code test still open.** The page has no gate; after the plan a "Prisijungimas" step signs in or creates an account with a phone or email code (Supabase Auth), then review and payment. Code is in and `tsc`/eslint are clean; the new step renders and rejects bad input locally. Both migrations (`20261104150000_customer_accounts`, `20261104160000_stripe_payments`) are **applied to the live project** and `lib/supabase/database.types.ts` is regenerated from it. Not tested end to end: in Supabase → Authentication set up the Phone provider (working Twilio sender; trial/US-sender limits still apply), edit the Magic Link and Confirm signup email templates to include `{{ .Token }}`, and add custom SMTP (Resend). Then test one real email code and one phone code, a new account and a returning one, through payment.

**Stripe payment on `/rezervacija` (ADR-0026) is built but off.** Code is in (`lib/stripe.ts`, `lib/payments.ts`, `lib/file-request.ts`, `app/actions/payments.ts`, `app/api/stripe/webhook/route.ts`, `lib/stripe-events.ts`, `/rezervacija/mokejimas`, admin payment badge) and typechecks and lints clean. Migration `20261104160000_stripe_payments` was tested in a rolled-back transaction on the live project (grouping, retry, idempotent completion, expiry, late payment, refund, cap and 48 h exemptions, privileges) but is **not applied**: run `supabase db push --linked`, then regenerate `lib/supabase/database.types.ts` (the payments types in it are hand-written until then). Keys, `SITE_URL` and the webhook endpoint are now set up (Stripe paragraph above); only the test remains. Not yet exercised: a real Checkout round trip, the webhook against Stripe, the admin badge with real payments.

Sauna programs for `/rezervacija` (Bendra, Moterų, Vyrų, Visa šeima, Pirtis tik jūsų kompanijai, Privati su programa), ADR-0022. The migration (`20261103180450_sauna_programs`) is **applied to the live database**, types are regenerated, and the admin editor (`/admin/pirtis` "Programos", program picker on Renginiai) and the `/rezervacija` Pirtis-tab cards are built. Not yet exercised: admin screens (needs staff login), the session path (no program sessions exist yet) and real submits.

`/skaiciuokle` was restyled to the same design (shared `BookingHeader`, two-column with sticky estimate) is three chapters (Proga ir vieta, Skoniai ir veiksmas, Pasiliekam Marse with sauna / quads / stay choices feeding the estimate), has an event date that sets the day type, and now starts with nothing preselected (venue, day and catering are null until chosen; the estimate is empty and the inquiry button waits for a venue and a day); the home calculator drawer shares its restyled components and still needs a visual check.

`/rezervacija` itself (ADR-0021) is built, styled to the client's booking-design reference (`.theme-reservation`: shared brand coral and slate teal, hairline borders, white-wash panels) and browser-checked at 375, 1280 and 1440 px: a two-column layout (title, tabs, date, steps on the left; sticky plan overview on the right from the top): activity tabs (Pirtis / Nakvynė / Keturračiai) on top (Toliau on the selection step opens a "we also have quads / sauna..." popup (each activity offered once per day) when other activities are free; no step bar or icon legend; the selection step has no heading, status line or "Seansai" label of its own; the Pirtis tab is one timetable of the day's seansai, merging program types and start times; each tab shows its choices without any "add" click and without help copy above them; "Pašalinti iš plano" sits below the options), then the date picker (strip or month calendar via a switch, cells with availability icons) and the guests stepper, the side panel listing the plan as an ordered timeline (sauna and quad times can't overlap: hours the other holds show as busy), then a 3-step form (Pasirinkimas with per-activity start times, Kontaktai, Peržiūra) beside a sticky plan panel. A real submit (SMS-verified phone) is not yet tested.

## Done recently

- `/rezervacija` restyled to the live-site layout, start time per activity, availability icons on days (2026-11-03).
- Migration `20261103180450_sauna_programs.sql` applied to the live project (table, RLS, RPCs, seed); "we also have..." popup after the seansas selection.
- Dev server allowed from the Tailscale host (`allowedDevOrigins`).

## In progress

- Account login at checkout (ADR-0027), uncommitted: `app/actions/customer.ts`, `lib/customer*.ts`, `lib/request-identity.ts`, `components/reservation/account-step.tsx`, `reservation-flow.tsx`/`review-step.tsx` changes, `proxy.ts`, migration `20261104150000`. The `ReservationGate` component was deleted. Waiting on: Supabase Auth phone provider + email code template + custom SMTP, the Stripe webhook endpoint, then a real code test.
- Stripe payments (ADR-0026): code done and uncommitted (`lib/stripe.ts`, `lib/payments.ts`, `lib/file-request.ts`, `lib/stripe-events.ts`, `app/actions/payments.ts`, `app/api/stripe/webhook/`, `app/rezervacija/mokejimas/`, admin payment badge/note, migration `20261104160000`). Waiting on: migration push, regenerated types, Stripe sandbox keys + webhook. Checkout sessions use the SDK's own retry idempotency (no hand-made key, which would clash with the changing expiry on a retry).
- Nothing half-done. Uncommitted: `app/rezervacija/`, `components/reservation/`, `lib/reservation.ts`, `components/booking/day-picker.tsx`, the migration, `lib/supabase/database.types.ts`, vault notes.
- Migration ledger is in sync with the live project (2026-11-04): `20261030100000`, `20261030120000`, `20261104100000` were repaired as applied (objects already existed); `20261103213000`, `20261104130000` (stay units) and `20261104140000` (mixed quad rentals) were pushed.

## Next up

- Gate (ADR-0037): owner adds `SITE_GATE=1` and a long `SITE_GATE_CODE` in Vercel; commit and deploy; check `https://www.vanduomarse.lt` shows `/netrukus` and the code lets a browser in. Open the site later by removing `SITE_GATE` and redeploying.
- Domain: Supabase Auth Site URL and redirect URLs to `https://www.vanduomarse.lt`; submit the sitemap in Search Console once the site is open.

00. Set up Supabase Auth (see Current focus), and test a real email code and phone code (new and returning account) through payment. Also pending: the "projects page" request (tab overflow, remove the personal block with its switch), which is not in this repo; ask which app.
0. Apply `20261104160000_stripe_payments` (`supabase db push --linked`), regenerate `lib/supabase/database.types.ts`, set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`, run test payments (paid, abandoned, refunded); then consider an admin refund button.
1. Staff: open `/admin/pirtis` to check the programs and prices, then create sessions in Renginiai (category Pirtis, pick the program, date, time, seats).
2. Test real bookings with a verified phone; menu/header link, `/embed/rezervacija`; submit `https://www.vanduomarse.lt/sitemap.xml` in Search Console.

## Blockers & open questions

- The new RPCs are applied but not yet exercised with a real booking (Docker not running, so no local test); the first real call will be a live test booking.
- The six seeded prices are the client design's figures; the client should confirm them.
- Coupons are not accepted on `/rezervacija` (single-service codes); needs a decision.
- A failure after the first request leaves a partial result with retry; staff see separate requests.

## Environment

- **Run:** `pnpm dev` (http://localhost:3000)
- **Deploy:** Vercel
- **Known issues:** `pnpm lint` over the whole repo is flooded by `.claude/worktrees/`; lint specific paths.

> UI consistency pass (2026-11-04): Termina body + role text steps applied; /rezervacija browser-checked at phone width; booking, coupons, events and admin still unchecked.
