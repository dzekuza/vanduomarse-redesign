## 2026-11-05 — PR #12 merged
- **Changed:** PR #12 (email notifications, confirmed-email lookup, marketing copy, review fixes) merged into `main` as 9699683; Vercel preview build had passed.
- **Status:** migration `20261105120000` already applied; production redeploys from `main`.
- **Next:** check the production deploy picked up the Stripe and email env vars; one test booking and checkout.

## 2026-11-05 — Marketing copy of booking emails
- **Changed:** `STAFF_BOOKING_COPY` (marketingas@vanduomarse.lt) in `lib/contacts.ts`, added once to every new-request and paid staff email in `lib/email/notify.ts` (not double-charge). Needed because `STAFF_NOTIFY_EMAIL` is only the fallback for services without an inbox.
- **Status:** `tsc`/eslint clean; not sent for real.
- **Next:** redeploy production; one test booking.

## 2026-11-05 — Stripe configured
- **Checked:** Vercel now has `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`; status note rewritten so no paragraph still asks to register the webhook (it is registered).
- **Next:** redeploy production; checkout test (live charge + refund, or sandbox).

## 2026-11-05 — Stripe recheck
- **Checked:** `.env.local` key (clean `sk_live_`, API 200), webhook secret format, Vercel env names.
- **Status:** local config OK; Vercel has `STRIPE_SECRET_KEY` only (no `STRIPE_WEBHOOK_SECRET`, `SITE_URL`). No checkout run.
- **Next:** add the two Vercel vars (webhook secret from the vercel.app endpoint in Stripe) and redeploy; decide sandbox vs live test.

## 2026-11-05 — Stripe configuration check
- **Checked:** `.env.local` Stripe vars (names/prefixes only), a read-only Stripe API call, webhook endpoints, Vercel env names.
- **Status:** key value malformed (`secret - ` prefix) and live mode; Vercel lacks all Stripe vars; webhook endpoint registered with the right five events. No checkout run.
- **Next:** fix the key line (sandbox key recommended for testing), add Stripe vars + `SITE_URL` in Vercel and redeploy, then run a checkout.

## 2026-11-05 — PR #12 second review
- **Changed:** `accountEmailFor` logs lookup failures; `notify` comments in requests/quads say email goes only to an account-confirmed address; vault: migration consistently named as required (ADR, changelog, status), webhook RPC named correctly, database row narrowed, frontmatter dates bumped.
- **Status:** `tsc`/eslint clean; pushed to PR #12.
- **Next:** signed-in test bookings with `EMAIL_IN_DEV=1`; env vars in Vercel.

## 2026-11-05 — Confirmed-email lookup for notifications
- **Changed:** migration `20261105120000_notify_account_email` (`account_notify_email`, `payment_notify_email`, service role only); webhook and admin outcome email only that address; types hand-added; `lib/supabase/admin.ts` doc.
- **Status:** `tsc`/eslint clean; migration applied to `mwngljhcvqkvncwbmgeo` via MCP (ref checked against `.env.local`, ledger aligned, grants and null-for-unconfirmed verified); pushed to PR #12. Regenerated types not adopted (unrelated drift: `graphql_public`, `create_inquiry.p_date`).
- **Next:** test bookings through `/rezervacija` signed in, with `EMAIL_IN_DEV=1`; look at the `create_inquiry.p_date` type drift.

## 2026-11-05 — PR #12 review fixes
- **Changed:** `Requester.notifyEmail` (account email only) for customer emails; admin outcome emails need a `user_id`; webhook used `payment_state` (later replaced by `payment_notify_email`, next entry up); 8 s fetch timeouts (Resend, Twilio); dev email skip returns false; `formatEuro` in emails; no relative `/admin` link; vault notes corrected (audiences, signatures, routing).
- **Status:** `tsc` and eslint clean; pushed to PR #12.
- **Next:** one sauna and one stay booking through `/rezervacija` (signed in) with `EMAIL_IN_DEV=1`; env vars in Vercel.

## 2026-11-05 — Security review: inquiry email
- **Changed:** `createInquiry` passes no customer email or phone to `notify` (the phone part was a pre-existing SMS-abuse path) (unverified form; would let anyone mail arbitrary addresses from our domain).
- **Status:** committed on `feat/email-notifications` with the email work, new PR into `main` (PR #10 was already merged); `tsc` clean.
- **Next:** test one sauna and one stay booking with `EMAIL_IN_DEV=1`; add the email env vars in Vercel.

## 2026-11-05 — Staff email per service
- **Changed:** `STAFF_INBOX` + `serviceOfReference` in `lib/contacts.ts`; `notifyRequestFiled` takes a service; staff paid/duplicate emails routed by reference prefix.
- **Status:** `tsc` and eslint clean; Resend keys added to `.env.local`, one direct test email accepted by Resend (HTTP 200). Booking emails through the app not tried yet.
- **Next:** set `RESEND_API_KEY` + `NOTIFY_FROM_EMAIL`, test one sauna and one stay booking with `EMAIL_IN_DEV=1`.

## 2026-11-05 — Email notifications (Resend)
- **Changed:** `lib/email/resend.ts` (shared sender, dev skip), `lib/email/notify.ts` (customer + staff email texts), `lib/notify.ts` (SMS + email per event); request, quad and admin status actions and the Stripe webhook call it (webhook reads `payments.customer_email` by `payment_id`); coupon email reuses the sender; `.env.example`, env note, utils catalog, api-architecture and ADR-0028 updated.
- **Status:** `tsc` clean, eslint clean on changed files. Not sent for real: no booking filed in the browser (it would write to the live project), dev logs emails instead of sending.
- **Next:** add `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `STAFF_NOTIFY_EMAIL`, `SITE_URL` (local + Vercel), verify the sender domain in Resend, then one test booking with `EMAIL_IN_DEV=1`.

## 2026-11-04 — PR #10 and payment hardening
- **Changed:** branch `feat/accounts-and-payments`, two commits and PR #10. After a security review: `checkoutUrl` only replaces a session Stripe reports expired (lookup errors fail instead of opening a second session), conditional `attach_payment_session` (loser's session is expired), webhook passes `p_payment_id` from metadata, `duplicate` payments are texted to staff; migration `20261104180000_payment_session_guards`.
- **Status:** migration tested in a rolled-back transaction (stale attach refused, old session paid is found by id, repeat event not a duplicate, double charge flagged); `tsc`/eslint clean. Applied afterwards through the Supabase MCP on your instruction: ledger repaired, signatures and privileges verified live, regenerated types identical.
- **Next:** restart dev with the Stripe keys, register the webhook, Stripe sandbox end-to-end test.

## 2026-11-04 — Mano rezervacijos rename and code-step buttons
- **Changed:** `/paskyra` is titled and linked "Mano rezervacijos" (nav label, metadata, H1, reservations left and account right); code-step buttons restructured (confirm on its own row, secondary buttons wrap, `h-auto whitespace-normal`).
- **Status:** `tsc`/eslint clean; signed-in page checked at 1024 px (shows PM-1068 and the profile); header nav wraps three labels at 1024 px (fits at 1280); button fix not yet seen live.
- **Next:** restart the dev server for Stripe, cancel the PM-1068 test booking, verify the code-step buttons next time a code is sent.

## 2026-11-04 — Account page /paskyra and sign-in tests
- **Changed:** `/paskyra` (`app/paskyra/page.tsx`, `components/account/*`, `lib/account*.ts`), `LoginForm` extracted from `AccountStep`, nav link, proxy matcher, migration `20261104170000_customer_own_requests` (applied via MCP, ledger repaired); added keys to the login views (fixes the uncontrolled-input warning on sign-out).
- **Status:** new-account sign-in through checkout worked (Supabase `user_signedup`, one account for the phone, not staff); returning sign-in failed only because no code reached the phone (test-OTP override inactive, Twilio `30003`); policies tested in a rolled-back transaction; `tsc`/eslint clean; signed-out `/paskyra` checked at 1280 px; signed-in view not seen.
- **Next:** make the test-OTP override take effect (check it is saved, format `37067312315=000000`), then sign in and check `/paskyra` and the checkout review/pay step; fix delivery (upgrade Twilio, alphanumeric or EU sender).

## 2026-11-04 — Applied the account and payment migrations
- **Changed:** security review fix: `private.account_owns_contact` now needs every contact on the row (phone and email) to be the account's own. Applied `20261104150000_customer_accounts` and `20261104160000_stripe_payments` to project `mwngljhcvqkvncwbmgeo` through the Supabase MCP (verified the project ref first), repaired the migration ledger to the local file versions, regenerated `lib/supabase/database.types.ts` (kept `create_inquiry.p_date` nullable).
- **Status:** objects verified live (payments table, 11 functions, `user_id`/`payment_id` columns, cron job, anon cannot call `start_payment`); `supabase db push --dry-run` says up to date; `tsc`/eslint clean.
- **Next:** Supabase Auth setup (phone provider, email code template, custom SMTP), register the Stripe webhook, then test a real code and a real payment end to end.

## 2026-11-04 — Account login at checkout instead of the phone gate
- **Changed:** ADR-0027. Removed `ReservationGate`; new `AccountStep` (phone or email one-time code via Supabase Auth, new account or sign-in), `app/actions/customer.ts`, `lib/customer.ts`, `lib/request-identity.ts` (`viaAccount` for the six booking actions); migration `20261104150000_customer_accounts` (`user_id`, trigger accepts the caller's confirmed phone or email); payments now matched by account; `proxy.ts` refreshes the session on `/rezervacija`.
- **Status:** database rules verified in a rolled-back transaction (own phone/email allowed, foreign phone, unconfirmed account and anon blocked; payment lifecycle by account); `tsc`/eslint clean; browser: no gate, account step renders, unsupported prefix rejected. No real code sent yet (needs your phone/email and the Supabase dashboard settings); migrations not applied.
- **Next:** apply both migrations in order, set up Supabase Auth (phone provider, email code template, custom SMTP), regenerate types, test real codes end to end.

## 2026-11-04 — Stripe payments on /rezervacija
- **Changed:** pay-at-submit (full total, hosted Checkout) per ADR-0026: migration `20261104160000_stripe_payments` (payments table, `payment_id` links, service-role payment functions, cron, paid requests exempt from the 48 h expiry and the pending cap); server action `startReservationCheckout` + `resumeCheckout`; webhook route; return page `/rezervacija/mokejimas`; `awaitingPayment` flag holds back request SMS; admin Payment badge and refund note; review step copy and "Mokėti N €" button; vault notes, `.env.example`.
- **Status:** `tsc` and eslint clean; migration logic verified in a rolled-back transaction (all cases pass); migration NOT applied (production push was refused in-session); no Stripe keys, so no Checkout round trip yet.
- **Also:** removed the manual Checkout idempotency key (clashes with the changing expiry on retry; the SDK adds its own); confirmed with payments off `/rezervacija` still reaches the old review step and "Rezervuoti" button.
- **Next:** apply the migration, regenerate types, add Stripe sandbox keys, register the webhook (`stripe listen` locally), run a test payment through paid / abandoned / refunded; consider an admin refund button.

## 2026-11-04 — Live database brought up to date with main
- **Changed:** `supabase migration repair` for three already-applied migrations, then `db push --include-all` for `20261103213000_program_sessions_only_via_program_ticket`, `20261104130000_stay_booking_units`, `20261104140000_mixed_quad_rentals` on project `mwngljhcvqkvncwbmgeo`. Verified `bookings.stay_units`, `quad_rental_items`, `create_stay_booking_with_units`, `create_mixed_quad_rental` and the program guard exist. All feature branches were already in main and were deleted locally.
- **Status:** `tsc` and eslint (app, components, lib, hooks) clean; `/rezervacija` checked at 1280 and 375 px (Pirtis, Nakvynė with live "Liko" counts, Keturračiai), no console errors, no overflow. Admin code on main already reads `stayUnits` and `quad_rental_items`; admin screens not seen logged in; no real submit tested.
- **Next:** staff login to check admin Nakvynė/Keturračiai views with a mixed rental; test a real booking with a verified phone.

## 2026-11-04 — Page-by-page consistency sweep
- **Changed:** ui Button/titles/tabs/table heads to font-bold; day-picker min-w so "Uždaryta" fits.
- **Status:** `/`, `/renginiai`, `/kuponai`, `/skaiciuokle`, all 5 `/embed/*`, `/admin/prisijungti` measured in the browser (Termina only, 400/700, no overflow); logged-in admin screens not seen (needs staff login).
- **Next:** log in and check admin pages; desktop width pass.

## 2026-11-04 — UI consistency audit and fixes
- **Changed:** Termina for body (Work Sans dropped); new type roles `text-item/figure/heading/total` mapped across ~50 files; weights 400/700 only; hairlines on `border-line` tokens; ui Title bases use `text-item`.
- **Status:** `tsc` + eslint clean; browser-checked /rezervacija (Pirtis flow through review, Nakvynė and Keturračiai tabs, extras popup) at phone width, no console errors; submit not exercised.
- **Next:** eyeball reservation, calculator, booking at 375 / 1024 px.

---
tags: [meta, session-log]
updated: 2026-11-05
---

# Session log

Append-only record of **what each working session changed and where it left the
project**. Newest first. Keep entries short (3–6 lines). Notable user-facing or
architectural changes also go in [[changelog]] / [[decisions-log]]; the live
snapshot lives in [[status]].

Entry format:

```
## 2026-11-04 — Unslop audit and polish
- **Changed:** removed negative tracking on small bold labels, put half-step paddings on the 4 px grid, fixed `text-micro` size in design-system.md.
- **Status:** `tsc` clean; not checked in the browser.
- **Next:** eyeball the reservation option cards, calculator pickers and the landing ticker at 375 / 1024 px.

## YYYY-MM-DD HH:MM — one-line summary
- **Changed:** files / areas touched and why
- **Status:** what works now, what is half-done
- **Next:** the first thing to do next session
```

## 2026-11-04 06:20 — Calculator chapters, date, token cleanup
- **Changed:** `calculator-groups.tsx` (new), `event-calculator.tsx`, `calculator-sections.tsx` (date picker, labels), `use-event-calculator.ts` (`chooseDate`, preset keeps date), `lib/event-pricing.ts` (`date`, `dayTypeOf`), `inquiry-form.tsx` (no own date), `step-label.tsx`, `stepper.tsx`, `choice-tile.tsx`, `booking-header.tsx`, `globals.css` (hack removed), border tokens across reservation and calculator components.
- **Status:** verified on `/skaiciuokle`: three chapters with the first open, Saturday sets the evening/weekend tile, Monday the workday tile, preset keeps date, 24 px labels, hairline borders from the token; tsc and eslint clean. Other booking pages (/pirtis, /miegas, /keturraciai) and the home drawer not re-checked after the shared Stepper / ChoiceTile change.
- **Next:** look at those pages; commit.

## 2026-11-04 05:40 — "Pasiliekem Marse" accordion in the calculator
- **Changed:** `components/calculator/stay-section.tsx` (new), `calculator-sections.tsx` (section registered, controls moved out of extras).
- **Status:** verified on `/skaiciuokle` at 1440 px (rows closed at start, chips and estimate update, no overflow at 375 px); tsc and eslint clean. The home drawer step was not opened.
- **Next:** open the home drawer to check both new states; commit.

## 2026-11-04 05:10 — Calculator starts empty
- **Changed:** `lib/event-pricing.ts` (nullable space/day/catering, guarded `estimate`), `use-event-calculator.ts`, `space-picker.tsx`, `estimate-summary.tsx` (empty state, gated inquiry), `event-calculator.tsx`, `calculator-drawer.tsx`, `calculator-sections.tsx`.
- **Status:** verified on `/skaiciuokle`: nothing pressed at start, 0 €, no CTA until venue + day, presets still fill; tsc and eslint clean. The home calculator drawer was not opened in the browser.
- **Next:** open the home drawer to check it; commit.

## 2026-11-04 04:40 — /skaiciuokle restyled
- **Changed:** `components/booking/booking-header.tsx` (new, shared), `app/skaiciuokle/page.tsx`, `app/rezervacija/page.tsx` (uses the header), `components/calculator/*` (layout and styling), docs.
- **Status:** checked at 1440 and 375 px: sticky estimate pins at 128 px, no overflow, reservation page unaffected; tsc and eslint clean. The home calculator drawer was not re-checked after the shared component restyle.
- **Next:** check the home drawer; commit.

## 2026-11-04 04:10 — /rezervacija restyled to the reference design
- **Changed:** `app/globals.css` (`.theme-reservation`), `app/rezervacija/page.tsx` (header, scope wrapper; rewritten after an empty-file mishap), option/session/tab/day/calendar/panel components, `data-slot` on `ChoiceTile` and `Stepper`, `design-system.md`.
- **Status:** checked at 1440 px next to the reference (palette tokens resolve to the reference values; layout, borders, type match); tsc and eslint clean. Dev server needed a content change to globals.css before it recompiled.
- **Next:** unchanged (commit, real test bookings, menu link).

## 2026-11-04 03:30 — No sauna/quads overlap in the plan
- **Changed:** `lib/reservation.ts` (`planHours`, `busy` through the plan functions, two-pass `planAll`, `SessionRow.blocked`), `quad-time-pickers.tsx`, `quad-options.tsx`, `sauna-options.tsx`, `session-list.tsx`, `activities-step.tsx`.
- **Status:** verified: sauna 12:00–15:00 → quad tiles 12/13/14 disabled "Jūsų plane", 11:00 limited to 1 h; quads at 11:00 → 6 sauna rows blocked, selected row stays. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 03:00 — Plan timeline and date picker with calendar view
- **Changed:** `plan-panel.tsx` (timeline), `lib/reservation.ts` (`startMin`, sorted `describePlans`), new `day-cell.tsx`, `month-calendar.tsx`, `date-picker.tsx`; `when-step.tsx` uses `DatePicker`.
- **Status:** verified at 1280 and 375 px: timeline order quads 11:00 → sauna 15:00 → stay; calendar toggle keeps the selected day, month arrows disabled inside a single-month window, no overflow. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 02:20 — Upsell popup: once per activity, quad-aware sauna offer
- **Changed:** `reservation-flow.tsx` (offers tracked per day and activity), `lib/reservation.ts` (`extraOfferText` takes what is in the plan).
- **Status:** verified: quads only → popup offers Pirtis ("prieš keturračius ar po jų") and Nakvynė; declining once means no repeat on the same day. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 02:00 — Upsell popup before the contact step
- **Changed:** `components/reservation/extras-offer-dialog.tsx` (new), `reservation-flow.tsx` (`next()` opens it once per day), `lib/reservation.ts` (`extraOfferText`); also removed the step bar, the "Seansai" label, the selection heading, the "įtraukta į planą" line and the icon legend.
- **Status:** verified in the browser (offers Nakvynė + Keturračiai after picking a private program; "Peržiūrėti" opens the quads tab; second Toliau goes to contacts); tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 01:10 — Pirtis tab: one seansai timetable
- **Changed:** `lib/reservation.ts` (`SessionRow`, `sessionRows`, `rowSelected`, `pickForRow`), `lib/sauna-programs.ts` (`programRateLine`), `components/reservation/session-list.tsx` (new), `sauna-options.tsx`, `sauna-hourly-options.tsx` (duration + extras only), `program-options.tsx` deleted.
- **Status:** checked at 1280 and 375 px (31 rows for a normal day, 8 shown first; hourly row opens duration); tsc and eslint clean.
- **Next:** unchanged; staff still need to create program sessions in Renginiai for them to appear.

## 2026-11-04 00:40 — /rezervacija: two-column layout, plan overview sticky from the top
- **Changed:** `app/rezervacija/page.tsx` (header node), `reservation-flow.tsx` (one grid, header inside the left column), `reservation-gate.tsx` (header + narrow card), `when-step.tsx` (stacked), `plan-panel.tsx` (`self-start` so sticky works).
- **Status:** checked at 1280 px (panel starts at the title and pins at 128 px while scrolling) and 375 px (no overflow); tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 00:20 — /rezervacija: no "add" step, choices always visible
- **Changed:** `activities-step.tsx` (previews the tab from `defaultPick`, remove link, notice only when included), `sauna-options`, `quad-options`, `stay-options` (`included` prop gates follow-up options), step heading copy.
- **Status:** verified in the browser: Pirtis, Nakvynė and Keturračiai choices show before any click; cabin size appears only after picking a type; Toliau stays disabled until something is picked. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-03 23:59 — /rezervacija: tabs and date above a 3-step form
- **Changed:** `reservation-flow.tsx` (tabs, `WhenStep`, 3 steps), `activities-step.tsx` (takes `tab`), `when-step.tsx` (two-column section), `step-nav.tsx` (any number of steps), `day-picker.tsx` (`relative` buttons, fixes mobile overflow), `lib/reservation.ts` (`ACTIVITY_TAB_ORDER`).
- **Status:** works at 1280 and 375 px (no overflow), reaches the review step; tsc and eslint clean. Real submits still untested.
- **Next:** unchanged: staff create program sessions, real test bookings, menu link, embed route, sitemap.

## 2026-11-03 23:30 — Sauna programs: admin editor and /rezervacija cards
- **Changed:** `lib/sauna-programs.ts`, admin types/mapper/repository/store/actions (`programs`, `saveProgram`, `deleteProgram`, `programId` on events), `components/admin/sauna/program-*.tsx`, event dialog picker, public data (`programs`, `programId` on sessions), `createProgramTicket` / `createProgramBooking` actions and schemas, `lib/reservation.ts` program modes, Pirtis tab components. `tsc` and eslint clean.
- **Status:** program cards and the private-program start grid checked in the browser (200 € for 15:00). Not verified: admin screens (login), session path (no sessions yet), real submits.
- **Next:** staff create a session per program in Renginiai; test real bookings (session adults/children, private, hourly) with a verified phone; menu link, embed route, sitemap.

## 2026-11-03 22:00 — Sauna programs migration applied via the Supabase MCP
- **Changed:** applied `sauna_programs` to the live Vanduo project after the user authenticated the official Supabase plugin (it lists `mwngljhcvqkvncwbmgeo`); renamed the local file to `20261103180450_sauna_programs.sql`; regenerated `lib/supabase/database.types.ts` (kept `create_inquiry.p_date: string | null`).
- **Status:** table, columns, RLS, both RPCs and the six seed programs verified live; `tsc` clean. No app code uses them yet.
- **Next:** admin programs editor, program cards in `/rezervacija`, real test bookings. Repair the 30 Oct ledger entries before any `supabase db push`.

## 2026-11-03 21:30 — Sauna programs: migration written, apply blocked
- **Changed:** `supabase/migrations/20261103190000_sauna_programs.sql`; vault (changelog, ADR-0022, database note). No app code yet.
- **Status:** NOT applied. MCP slots point at other projects; CLI is linked to Vanduo but its history lacks the two 30 Oct migrations (objects exist), and the `migration repair` command was denied by the permission classifier.
- **Next:** user runs `supabase migration repair --status applied 20261030100000 20261030120000` then `supabase db push` (or says how to proceed); then regenerate `database.types.ts`, build the admin programs editor and the program cards in `/rezervacija`.

## 2026-11-03 20:45 — Availability icons on the day strip
- **Changed:** `DayPicker` optional `icons`; `dayAvailability` in `lib/reservation.ts`; `activity-icons.ts` shared with the tabs; `WhenStep`, `ReservationFlow`.
- **Status:** verified at 1280 px (today shows quads dimmed after closing); tsc and eslint clean.
- **Next:** unchanged: real test bookings, menu link, embed route.

## 2026-11-03 20:15 — /rezervacija: step 1 is date and guests only
- **Changed:** `lib/reservation.ts` (start hour per pick, `When` = day + people, `openHours` removed), `when-step`, `sauna-options`, `quad-options`, `activities-step`, `reservation-flow`, `activity-tabs` (equal width).
- **Status:** works at 1280 px (sauna start grid, duration, extras, total); tsc and eslint clean; real submit still untested.
- **Next:** same as before: real test bookings, menu link, embed route.

## 2026-11-03 19:30 — /rezervacija restyled to the live-site layout
- **Changed:** `components/reservation/` (new `StepNav`, `StepHeading`, `OptionCard`, `ActivityTabs`, `PlanPanel`, `ReviewStep`, `ReservationGate`; options rewritten with cards; flow has its own 4-step state), `app/rezervacija/page.tsx` (big title, no hero/gallery).
- **Status:** checked at 375 and 1280 px, no overflow, no console errors; real submit still untested.
- **Next:** real test bookings with a verified phone; menu/header link, embed route, sitemap.

## 2026-11-03 18:00 — Combined booking page /rezervacija
- **Changed:** new `app/rezervacija/page.tsx`, `components/reservation/*`, `lib/reservation.ts`; vault: changelog, ADR-0021, routing, components catalog. No DB changes.
- **Status:** works in the browser at 375 and 1280 px (steps 1-3, all three activities, totals, plan summary). Checked with a placeholder phone verification, so the real submit (SMS-verified phone, RPCs, partial-failure retry) is NOT yet exercised end to end.
- **Next:** submit a real test booking for each combination with a verified phone; add menu/header link, `/embed/rezervacija` and sitemap entry; decide on coupons and a shared group id.


## 2026-11-03 — vault initialised

- **Changed:** project brain scaffolded (vault, shims, hooks).
- **Status:** skeleton only — architecture notes and catalogs still empty.
- **Next:** fill [[status]] and the architecture notes from the real codebase.
