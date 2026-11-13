---
tags: [meta, decision]
updated: 2026-11-12
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0085 — Cookie consent gates Google Analytics and Meta Pixel

- **Status:** Accepted
- **Date:** 2026-11-13

**Context.** The site set only strictly necessary cookies (login session, admin theme, preview gate), so it needed no banner. The owner will add Google Analytics 4 and Meta Pixel, which set cookies and send data to Google and Meta, so the ePrivacy rules and GDPR require prior opt-in.

**Decision.** `ConsentManager` (root layout) shows a first-visit bar with equal-weight "Tik būtini" and "Priimti visus" plus "Nustatymai" (a dialog with per-category switches, also opened from the footer's "Slapukų nustatymai"). The choice is stored in this browser's `localStorage` (`vm_consent`, versioned, asked again after a year). The tracker scripts (`GoogleAnalytics`, `MetaPixel`) are mounted only for what was allowed; their IDs come from `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_META_PIXEL_ID`, and with neither set there is no banner, no footer link and nothing loads. A category without an ID is never offered. Withdrawing a category reloads the page and tracker cookies of every disallowed category are deleted on each load. `/admin/*` and `/embed/*` are never tracked and never show the banner. No Consent Mode: nothing Google or Meta loads before consent.

**Consequences.** Adding a tracker means a new category in `consent-categories.ts` and a bump of `CONSENT_VERSION` so everyone is asked again. The privacy policy has a "Slapukai ir analitika" section. Consent is per browser, not per account. Embeds on other sites are the host site's responsibility.

---

## ADR-0084 — Simplified React Native (Expo) iOS staff admin app in `mobile/`

- **Date:** 2026-11-13. **Status:** code done; migration `20261113180000_staff_push_tokens.sql` created (NOT yet applied to the live DB).
- **Context:** park staff need a fast iOS mobile companion for day-to-day operations on the dock and at reception (confirming/cancelling bookings, checking riders in/out on the water and assigning bracelets via a connected USB HID reader, answering inquiries, activating/redeeming coupons, searching the 8,900+ customer directory, and receiving instant push notifications) without carrying a laptop or duplicating the CMS/catalog configuration screens.
- **Decision:** `mobile/` is a `pnpm` workspace package running Expo SDK 58 / React Native (upgraded from 53 on 2026-11-13: Expo Go on a physical iPhone only supports the newest SDK) with Expo Router, importing pure TypeScript types, mappers, permissions, and pricing helpers directly from `@/lib/*`. Every colour, spacing, radius, and Termina font role comes from `useAppTheme()` (`mobile/src/theme/use-app-theme.tsx`) with zero raw hex or numbers in `StyleSheet.create()`. Connected USB IC/RFID readers work on iOS as a hardware HID keyboard wedge captured by `<UsbScanTarget>` (`showSoftInputOnFocus={false}` keeps the iOS soft keyboard hidden while capturing digits and mapping Lithuanian number-row characters `ąčęėįšųū„“` → `1234567890`). Reads and standard writes talk directly to Supabase under the signed-in staff member's RLS policies (`staff` + `staff_roles`); operations requiring server-only secrets (Stripe refund on cancellation, Resend coupon emails, customer SMS notifications) call `POST /api/admin/mobile-action` authenticated with the staff member's Supabase Bearer token. Native push notifications use `public.staff_push_tokens` + `lib/push/staff-push.ts` wired into `lib/notify.ts` alongside Twilio SMS.
- **Consequences:** web-only owner/CMS configuration screens (sauna rate tables, cabin types, quad fleet, event CRUD, price sheet, staff/role management) stay exclusively in the Next.js `/admin` web app.

---

## ADR-0084 — The staff "paid" notification carries who booked and what (extends ADR-0079)

- **Context:** the staff SMS read only "Apmoketa ir patvirtinta MM-1103: 1.50 EUR. Zr. /admin"; staff had to open the admin to learn who paid and for what.
- **Decision:** service-role function `paid_staff_details(payment_id)` returns, per request, the customer name, e-mail, phone, people, units, price, discount code and note. `loadPaidRequests` merges it into `PaidRequest.staff` and the webhook now loads the requests for every payment (the customer messages still use them only when `confirmed`). Staff SMS (ASCII), staff e-mail (time of payment, customer block, one block per request, code, notes) and the staff push all list the customer and each request with date, time, people and price. A failed read of the details leaves those lines out; the payment's own phone/e-mail are the fallback contact.
- **Push:** carries the reference, amount and the request lines only, no name, phone or e-mail (third-party provider, lock screens).
- **Unchanged:** customer messages; duplicate-payment alerts; coupon and plan payments (their own staff mails already list buyer and product).

## ADR-0083 — One customer per phone number or e-mail: orders and registration link to the existing customer

- **Date:** 2026-11-13. **Status:** code done; migration `20261113230000_link_customers_by_contact.sql` APPLIED to the live project 2026-11-13 and verified (4 triggers, 6 orders left unlinked, rider count unchanged at 8958, PR-1021 on the registered profile).
- **Context:** an order was tied to a customer (`rider_id`) only by the one-time 7 Nov backfill, so every later order (e.g. PR-1021) was unlinked, and `/registracija` always inserted a NEW rider, so the same person became several customers (the owner's e-mail matched 9). Klientai's order history and the customer-name links need a stable customer per person.
- **Decision:** a customer is identified by phone (`private.norm_phone`, `phone` or `phone2`) or e-mail. `private.find_rider(phone, email)` returns the match: a customer who finished registering (photo) first, then the oldest. `private.find_or_create_rider` creates one from the order's contact only when nothing matches (advisory lock per contact so two simultaneous orders do not create two). BEFORE INSERT triggers on `bookings`, `quad_rentals`, `event_tickets` (`customer_*`) and `coupons` (`buyer_*`) set `rider_id` when the insert did not, so every path (public forms, staff entry, Stripe flows) links. `register_rider_public` now returns `(rider_id, already_registered)`: it reuses the matching customer, fills BLANK fields only (phone and e-mail are unverified, so nothing stored is overwritten), sets `self_registered`, adds a waiver row; a customer who already finished registering is returned as `already_registered` and the action skips the uploads. `create_plan_order` no longer requires `self_registered` (the server passes the id it was just given). The existing unlinked orders are linked to existing customers only (12 of 18; the 6 left are test e-mails and one coupon buyer): nothing is created by the backfill.
- **Consequences:** the admin keeps `makeCustomerLookup` (same order) as a fallback. Customers that are already duplicates are not merged (the owner's e-mail still matches several; the registered one wins the link). Phone and e-mail are not verified at purchase, so a typo or a shared number links an order to the wrong customer; and a public registration with someone else's phone/e-mail can fill that customer's blank fields and, if they have no photo yet, attach its photo (accepted: fill-only, first writer wins).

---
## ADR-0083 — Owners edit public service pages through DB overrides on top of the code defaults

- **Context:** the service pages (Pirtis, Vandenlentės, Keturračiai, Nakvynė, Restoranas, Šventės and the celebration pages) keep their texts, info boxes and FAQ in `components/services/service-content.ts` and their photos in `public/landing`; changing a word needed a deploy.
- **Decision:** table `page_content` (`slug` pk, `content jsonb`, public read, owner-only write) holds only the fields an owner changed; `mergeServiceCopy` puts them over the code default, `facts`/`questions`/`photos` replace the whole list. Photos go to the public `page-photos` bucket (owner-only write). Saving stores the diff against the default (`overrideFromEdit`), so untouched fields keep following code changes, and deletes storage files that left the gallery. An invalid row or a failed read falls back to the defaults. Owner-only at `/admin/puslapiai` (no new permission). Prices, schedules, sauna/quad/stay boxes stay data-driven and are not editable there.
- **Consequences:** the home page, `/renginiai`, `/kontaktai` and the embeds are still code-only (next step). An override of `photos` replaces the page's default gallery entirely (for Pirtis that includes the sauna photos from `/admin/pirtis`). Photos uploaded but not saved stay in the bucket until the page is saved again.

## ADR-0082 — The admin refreshes itself from Supabase Realtime change notifications

- **Date:** 2026-11-13. **Status:** code done; migration `20261113220000_realtime_admin_tables.sql` APPLIED to the live project 2026-11-13 and verified (13 tables in `supabase_realtime`).
- **Context:** the admin loads all its data in the server layout, so a new booking, a payment status change from the Stripe webhook or another staff member's edit only showed after a manual reload.
- **Decision:** the tables that customers, payments and the webhook change (`bookings`, `quad_rentals`, `event_tickets`, `payments`, `coupons`, `events`, `inquiries`, `sauna_blocks`, `riders`, `purchases`, `rider_cards`, `rider_sessions`, `rider_comments`) are added to the `supabase_realtime` publication. `AdminLiveUpdates` (mounted in the panel layout) subscribes through a browser client (`lib/supabase/client.ts`, the staff session's JWT via `realtime.setAuth`) and, on any change, calls `router.refresh()` so the existing store adopts the fresh server data. A burst is debounced (600 ms quiet, 4 s at most), changes while the tab is hidden are applied when it is shown again, and a reconnect refreshes once to catch up. Realtime only says THAT something changed; no row data from the event is used, and every read still goes through the server load with RLS.
- **Consequences:** Realtime filters events with the subscriber's RLS, so only staff with a SELECT policy on a table receive its changes (anon has none on these, except `events`, which is public). A refresh replaces optimistic local state with server data; open dialogs and their form drafts keep their own state. Config tables (prices, plans, roles, settings) are not published: a change there still needs a reload by the other staff. No new-booking toast yet.

---
## ADR-0081 — Cancelling a paid request can refund its share through Stripe

- **Date:** 2026-11-13. **Status:** code done; migration `20261113200000_request_refunds.sql` APPLIED to the live project 2026-11-13 and verified (RLS on, the three functions executable by `service_role` only, 0 rows).
- **Context:** cancelling in the admin only changed a status; the customer's money stayed unless staff remembered to refund in the Stripe Dashboard (the `charge.refunded` webhook then recorded it). One online payment can cover several requests.
- **Decision:** `cancelRequest(kind, id, refund)` (`app/admin/actions.ts`) cancels through the existing status actions (same permission checks), then, if asked, `lib/refund.ts` refunds that request only: `begin_request_refund` reserves a row in the new `request_refunds` (one per request (`kind` + row id, unique), which stops a second refund of the same request in normal operation (the one remaining gap is a Stripe refund that succeeds while recording it fails and the 24 h idempotency window then passes: that case is reconciled against Stripe and left for staff, never retried blindly)) capped at the request's `total` and at what is still unrefunded on the payment (counting manual Dashboard refunds, `payments.refunded`); Stripe `refunds.create` (idempotency key per request, `reason: requested_by_customer`); `finish_request_refund`, or `fail_request_refund` if Stripe refuses. The existing webhook records the refund on the payment. In the admin, cancelling a request paid online opens `CancelRefundDialog`: refund and cancel, cancel without refund, or leave it. A failed refund does not undo the cancellation: staff see the reason and refund in Stripe.
- **Consequences:** same permission as the cancel (rezervacijos / keturraciai / renginiai), not owner-only. Coupons, bracelet-plan orders and other flows are not refunded by this (a full Dashboard refund still cancels them through the webhook). The customer still gets the normal "atšaukta" message, which does not mention the refund.

- **Hardening (security review + Stripe docs, 2026-11-13):** (1) a request is found by `(kind, id)`, never by a reference searched across tables: `request_refunds` is unique on `(kind, request_id)`. (2) Per Stripe (error-low-level, idempotent_requests): a `5xx`, timeout or connection error is an unknown outcome and Stripe replays a saved error for the same idempotency key, so the reservation is only released on a definite refusal (a 4xx other than 409/429, or a refund that came back `failed`/`canceled`). Otherwise it stays pending and the server reconciles: list the payment intent's refunds and match `metadata.reference`; a pending row is handed back (`resumed`) on the next attempt and reconciled before any new call; no new Stripe call after 24 h (key window), staff are told to check Stripe. The old silent deletion of pending rows older than two minutes is gone, and the `finish_request_refund` result is checked. Migration `20261113210000_request_refunds_by_kind.sql` APPLIED to the live project 2026-11-13 and verified (new `begin_request_refund(kind, id, staff)` service-role only, unique on `(kind, request_id)`, 0 rows).
---
## ADR-0080 — WAKE season passes are bracelet plans bought online, not coupons (supersedes the season-pass part of ADR-0069)

- **Date:** 2026-11-13. **Status:** code done; migrations `20261113151000_rider_plan_orders.sql`, `…161000_my_riders_registered.sql` and `…170000_my_riders_registration_details.sql` APPLIED to the live project 2026-11-13 and verified (2 online plans, coupon passes inactive, RLS on, order RPCs executable by `service_role` only, `online_plans()` by anon).
- **Context:** the owner wants "WAKE abonementas" to be a real purchase of an apyrankė plan, not a coupon code. The buyer must be registered (contacts, photo, signed rules); after payment the plan is attached to the rider and staff bind the physical bracelet at the park.
- **Decision:** `ride_plans.sold_online` marks the plans for sale; the two passes (750 € / 950 €) are inserted as category `Abonementai` and the matching coupon products are deactivated. Public read through `online_plans()` (security definer, nothing else of `ride_plans` is exposed). New `rider_plan_orders` (reference `AB-…`, plan snapshot, status `laukia_apmokejimo` / `apmoketa` / `atsauktas`, Stripe ids, `purchase_id`), staff-read only (`apyrankes`). All order RPCs are service-role only: `create_plan_order`, `attach_plan_order_session`, `abandon_plan_order`, `complete_plan_order_payment`, `expire_plan_order_session`, `refund_plan_order_payment`, `plan_order_state`. `/registracija?abonementas=<plan id>` runs the registration, and `registerRider` creates the order for the rider it just made (never a client-supplied rider id) and returns a Stripe Checkout URL. The webhook (`lib/plan-payment.ts`, dispatched by `metadata.plan_order_id`) sets the order paid, inserts a `purchases` row, sets `riders.plan_id`, and emails the buyer and staff once (`newly_paid`).
- **Consequences:** swim plans (category Plaukimas) are sold the same way: migration `20261113190000_sell_swim_plans_online.sql` flags all but "Papildoma valanda" (applied 2026-11-13). Staff switch plans on or off with the "Internetu" toggle in /admin/apyrankes → Planai. The coupon ride dialog only serves leftover `kabelis` coupon products. A visitor who cancels Checkout must register again (a second rider row; staff merge duplicates). A full refund cancels the order but leaves the rider's plan for staff to change. The admin plan price is the online price.

- **Security review follow-up (applied 2026-11-13, verified):** `my_riders()` matches a rider by e-mail, `phone` or `phone2`, and `phone2` is staff-entered, so it can be someone else's number. `20261113180000_my_riders_primary_match.sql` adds `primary_match` (confirmed account e-mail = `riders.email`, or confirmed account phone = `riders.phone`). A `phone2`-only match still returns name, plan, bracelets and purchases (ADR-0062) but every registration field (e-mail, phones, birth date, photo path, waiver date) is null, no photo URL is signed, and it does not count as the customer's registration. An explicit owner link (`riders.user_id`) would be cleaner but needs a backfill: not done.
---
## ADR-0079 — A paid reservation is confirmed automatically and the customer gets what was booked (revises ADR-0026)

- **Decision:** `complete_payment` now sets the payment's requests (`bookings`, `quad_rentals`, `event_tickets`) from `laukia` to `patvirtinta` itself, and returns `confirmed`. A payment that needs a look (`needs_review`: odd amount, or slots not restorable after a late payment) is not confirmed and stays for staff. The webhook then sends the SMS and email built from `paid_request_details` (what, date, time) instead of "we will confirm shortly".
- **SMS (ASCII, Lithuanian letters folded):** "Jusu mokejimas gautas. Jusu rezervacija:" then per request "Pirties seansas: <name>", "Data: <date>", "Laikas: <start-end>", then "Turite klausimu? skambinkite <phone> arba rasykite <email>". Sauna-only reservations show pirtis@vanduomarse.lt, others info@. Stays show the nights; the generic wording remains when the details cannot be read or the payment is under review.
- **Why:** owner: no staff confirmation after payment; the customer must see their booking in the message.
- **Unchanged:** unpaid and pay-on-site requests still wait for staff; the admin can still cancel a confirmed request.

## ADR-0078 — Browser Back from Stripe cancels the unpaid payment

- **Decision:** the Back button never opens our cancel URL, so `ReservationFlow` listens for it (`useReleaseOnBrowserBack`: a `back_forward` navigation or a bfcache `pageshow`) and calls `releaseMyUnpaidPayments`, which releases every `laukia` payment of the signed-in customer through the owner-checked, expiry-confirmed `releaseCancelledPayment` (ADR-0077). The page leaves its "redirecting" state and shows "Mokėjimas nebuvo atliktas...".
- **Why:** owner: slots must be held only while a payment can happen; users leave Stripe with Back or by closing the tab, not only with Stripe's own link.
- **Limits:** it cancels all of the customer's unpaid payments, so someone paying in a second tab while pressing Back in another loses that checkout (the session is expired, the slot freed). Closing the tab without coming back still holds the slot until the session expires (about 31 minutes).

## ADR-0077 — A slot is held only while a payment can still happen

- **Decision:** reservations are still filed before Stripe Checkout (that is how the database prices and checks them), but they are released the moment the visitor returns unpaid via the cancel link: `releaseCancelledPayment` expires the Checkout Session (so it cannot be paid afterwards) and calls `abandon_payment`. A session found already paid stops the release.
- **Why:** the cancel page used to say the slots were still held, and they stayed held until the session expired plus the cron grace.
- **Authorization:** the release runs on the cancel-page GET, so it only proceeds for the payment's owner (`ownsPayment`: its `user_id` equals the signed-in user, not merely readable through RLS, which staff policies also pass); knowing the payment id alone cannot cancel someone's hold. Slots are freed only after the Checkout Session is confirmed expired or found paid (`closeCheckoutSession`); an unconfirmed expiry (transient Stripe error, session still open) leaves the release to the webhook/cron. Idempotent, and the same cancel is also available as the owner-checked `cancelUnpaidPayment` action.
- **Limit:** a visitor who simply closes the tab holds the slot until the Checkout Session expires (Stripe's minimum is 30 minutes; the expired webhook releases it right then). Not holding at all before payment would allow two people to pay for the same slot.

## ADR-0076 — Coupons need no staff step; abuse is limited per IP, not by verification (revises ADR-0073/0074/0075)

- **Decision:** a coupon is bought and paid by the buyer alone. Stripe is the only path: without it the order is refused and nothing is stored; if Checkout cannot open the fresh order is cancelled. No email goes to an unverified address before payment (no order receipt, no order alert); emails go out only after Stripe confirms payment.
- **Guards:** `create_coupon_order` refuses a sixth unpaid order from the same IP in an hour (HMAC of the IP in `coupons.ip_hash`). The function is callable by the service role only (the action uses `createAdminClient`), so the key cannot be forged with the anon key, and a missing hash (no `PHONE_VERIFICATION_SECRET`) refuses the order instead of skipping the cap next to the existing global cap of 100; expired Checkout Sessions cancel their orders (ADR-0075).
- **Why:** a security review noted that, without phone verification, order-time emails could be used to send text to strangers and the global cap could be filled by one script. Removing the manual path removes the first; the per-IP cap narrows the second (a distributed attack can still fill the global cap for about 31 minutes).
- **Kept:** `/admin/kuponai` activation and resend for old pending orders and manual cases.

## ADR-0075 — Gift coupons are paid and issued automatically through Stripe

- **Decision:** the order action opens a Checkout Session for the stored coupon value (anonymous buyer, no account) and the form redirects to it. The webhook is the only thing that issues the code (`complete_coupon_payment`, service-role only, idempotent, rejects a paid amount that differs from the value) and then emails the buyer and the recipient and alerts staff. `checkout.session.expired` cancels the pending order; a full `charge.refunded` cancels the coupon. Coupons use their own columns (`stripe_session_id`, `stripe_payment_intent_id`), not the `payments` table, which is tied to signed-in accounts and reservations.
- **Fallback:** without Stripe keys, or if Checkout cannot open, the order is stored as before and staff arrange payment and issue the code in `/admin/kuponai` (ADR-0074 emails).
- **Why:** staff had to confirm every payment by hand before the code was sent.
- **Needs:** the existing webhook endpoint (same events as reservations), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` + `COUPON_FROM_EMAIL`.

## ADR-0074 — Coupon emails reach the buyer and the gift recipient, and staff are alerted

- **Decision:** optional `coupons.recipient_email`. Order placed: buyer receipt + staff alert (`notifyCouponOrdered`, in `after()`). Paid or resent: code to the buyer and, if given, the recipient (`sendCouponEmails`).
- **Why:** only the buyer ever got the code, and staff learned of orders only by opening the admin.
- **Notes:** the new RPC argument has a default so old deploys keep working. Staff alert goes to `STAFF_NOTIFY_EMAIL`, else info@, plus `STAFF_BOOKING_COPY`. Needs `RESEND_API_KEY` and `COUPON_FROM_EMAIL` (or `NOTIFY_FROM_EMAIL` for the order-time emails).

## ADR-0073 — Coupon orders skip phone verification (narrows ADR-0018)

- **Decision:** `/kuponai` orders need no SMS code. Phone is an optional field; the `coupons_phone_verified` trigger is dropped. Bookings, events, quads and inquiries keep theirs.
- **Why:** owner wants gift cards buyable without friction; coupons are paid before use, so a fake phone costs nothing.
- **Guards kept:** honeypot, and the 100 pending orders/hour brake in `create_coupon_order`.

## ADR-0071 — Quad tours are booked at any time, for at least 5 quads (reverses ADR-0055)

- **Date:** 2026-11-12
- **Context:** ADR-0055 sold the Mini / Midi / Maxi products only on dated departures staff published (events with `tour_route_id`). The owner wants guests to book a tour whenever the fleet is free, with a group of at least 5 quads, and no "Turų datos" to maintain.
- **Decision:** the public booking offers every start hour the free fleet covers for the whole route (`quadTourStarts`, from `quad_taken`, with at least the route's `min_units` free) and files the request with route, date and start hour. `createQuadTourRental` calls `create_quad_tour_rental` directly (it already prices from the route and gear rows, checks opening hours, the 120-day window, the rate limit and the fleet, and rejects fewer than `min_units`); migration `20261112171000_quad_tours_any_time.sql` grants it to `anon` / `authenticated` again (ADR-0055 hardening had revoked it) and sets every route's `min_units` to 5. The admin loses the "Turų datos" card, the "Pridėti turą" button and `TourDepartureDialog`; `saveEvent` no longer writes `tour_route_id`.
- **Consequences:** a tour no longer reserves capacity on an event, so two tours can overlap as long as the fleet has the quads; the fleet check in the function, under advisory locks, is the only limit. `QuadPageData.departures` and `QuadDeparture` are gone. The `events.tour_route_id` / `quad_rentals.tour_event_id` columns, `create_quad_tour_departure_rental` and `reject_departure_tickets` stay in the database, unused; old departure events (none exist) would still be listed in the admin calendar. The per-person guided tours (`tourTickets`, events without a route) are unchanged. The group minimum is per route and editable in /admin/keturraciai.

---

## ADR-0091 — A session blocks the private sauna while it runs and one hour after

- **Context:** the booking page hid private start times inside a public session (client-side only, `saunaTaken`), the database enforced nothing, and the hour after a session (cleaning) was bookable.
- **Decision:** a private booking of the main sauna (`pirtis-marse`) may not overlap `[session start, session end + 60 min)`. One constant, `SESSION_BUFFER_MINUTES` (`lib/sauna-events.ts`), feeds the booking page; the same window is enforced by trigger `bookings_session_clear` (`public.enforce_session_clear`, error `23P01` hint `session_overlap`), which checks only new or moved bookings (an existing booking can still be confirmed or edited). A session is a published `pirtis` event with a capacity; its length is its own duration, else its program's, else 60 minutes. The reverse direction is checked in `saveEvent` (`privateBookingUnderSession`, service role read): a published session cannot be saved over an existing private booking, the message lists the bookings. Events are not blocked by a trigger on purpose, so the weekly materialisation of sessions can never fail because of one booking.
- **Consequences:** staff creating a private booking by hand are blocked by the same rule. Only the main sauna hosts sessions. A draft (unpublished) session blocks nothing until published, and publishing it is checked.

## ADR-0090 — Staff can hold places on a limited event with `events.held`

- **Context:** the owner wanted to take some places of a sauna session (family, friends) without creating fake bookings.
- **Decision:** `events.held` (integer, default 0): places set aside by staff. `enforce_ticket_capacity` counts `held` next to the real tickets, the public `spotsLeft` is `capacity - sold - held`, and `private.check_event_held` refuses `held + sold > capacity` and any `held` on an unlimited event. `sold` stays real tickets only (the sync trigger is unchanged). `setEventHeld(id, held)` (renginiai / keturraciai) checks the same rule first for a clear message; the UI is a stepper (`HeldSpots`) in the event panel, hidden for quad tour departures (their capacity counts quads).
- **Consequences:** held places have no customer, price or reference, so nothing shows in sales or revenue. Lowering a capacity below `sold + held` on an event that has held places is refused.

## ADR-0089 — Cancelled requests can be removed, but not while their money is unrefunded

- **Context:** a cancelled (often refunded) request stayed in the admin lists forever, and the restore button was removed so it could not be revived (ADR-0087 context).
- **Decision:** `deleteRequest(kind, id)` (`app/admin/actions.ts`) hard-deletes a booking, quad rental or event ticket with the same page permission as cancelling. Server rules: status must be `atsaukta`; if it was paid online (`payments.status = 'apmoketa'`) a `request_refunds` row with status `done` must exist for that request (a full refund made in Stripe sets the payment to `grazinta` and also passes). The delete itself repeats `status = 'atsaukta'`. `payments` and `request_refunds` rows are untouched (no foreign key to the request), so the money trail survives; `booking_extras` and quad items cascade.
- **Consequences:** staff cannot hide an unrefunded paid cancellation. A partial refund made by hand in Stripe is not recognised: refund through the cancel dialog, or fully in Stripe, first. No "undo".

## ADR-0088 — The admin notification bell reads a server-written feed table, live via Realtime

- **Context:** staff were told about events only by SMS, e-mail and push; the open admin had no list of them.
- **Decision:** `staff_notifications` (kind, `permissions text[]`, title, body, reference, href) is written by the server (`recordStaffNotification`, service role, no insert policy) next to the other channels in `lib/notify.ts` and the coupon / plan payment handlers, so the bell shows exactly what staff are notified of (a payment that covers three requests is one row). RLS: a staff member reads a row when their role has any listed page permission (owners all). `staff_notification_reads` keeps one "last opened" timestamp per staff member (own row only). The table is in the `supabase_realtime` publication; `AdminLiveUpdates` already refreshes the store on table changes, so the bell reads `notifications` / `notificationsReadAt` from `useAdmin()` (loaded by the repository, newest 30) instead of a second subscription. Rows older than 60 days are deleted on each insert. A row appearing after page load also pops a toast.
- **Consequences:** staff-entered bookings (admin) do not notify. A staff member with no marker sees the last 24 h as new. Events with no row yet (other tables) are not in the feed.

## ADR-0087 — Customers cancel their own requests; paid ones refund automatically up to 24 h before

- **Context:** /paskyra only let a customer cancel a payment that was still unpaid; a confirmed or paid booking had no cancel button, and only staff could cancel and refund (ADR-0081).
- **Decision:** `cancelMyRequest` (`app/actions/cancel-request.ts`) reads the request with the customer's own session (RLS), applies `cancelPolicy` (`lib/request-cancel.ts`, the same function the button is drawn from): open (`laukia`/`patvirtinta`), not awaiting Stripe, not started; paid online and under `CANCEL_REFUND_HOURS` (24) to the start = "late" (call us); otherwise cancel. The update runs with the service role but only for that `user_id` and open statuses. A paid cancel then calls `refundRequest` (ADR-0081, `refunded_by` = the customer's user id); a failed refund keeps the cancellation and tells staff to refund in Stripe. The start is the sauna/quad hour or event start time; a stay counts from 00:00 of its first day (no check-in hour is stored), so it is refundable until the day before.
- **Consequences:** the 24 h figure is one constant. Partial refunds and per-service windows are not supported. Staff notified through `notifyCancelledByCustomer` (topic routing of ADR-0086).

## ADR-0086 — Staff notifications route by topic arrays, e-mail joins the recipient list

Recipients in `notification_recipients` have an optional phone and an optional e-mail (at least one). A message carries a list of topics (`bookingTopics(service)` = rezervacijos + the service, or uzklausos; `paymentTopics(services)` = mokejimai + each service); a recipient gets it when subscribed to any of them or to `visi`. SMS and e-mail both read the list through `staff_notify_phones_for` / `staff_notify_emails_for` (null while nobody has that channel, then the old routing applies: STAFF_NOTIFY_PHONE, `STAFF_INBOX` + STAFF_NOTIFY_EMAIL + marketing copy). Once anyone has an e-mail, only the list is used, so marketingas@ must be added as a recipient to keep its copies. Push keeps the three broad topics (`PushTopic`; the mobile registrations' constraint is unchanged).

## ADR-0072 — Public booking facts use the booking catalogue

- **Context:** Fixed capacity, route and minimum-group claims could disagree with the admin settings. The public sauna reader also replaced legacy seed copy.
- **Decision:** The service pages use the same sauna, stay and tour rows as the booking forms. The homepage uses descriptive copy for those activities. Contacts use the shared contact configuration and event estimates use the shared pricing sheet.
- **Consequences:** `20261112170000_correct_seeded_sauna_copy.sql` corrects the original seeded sauna display text when it still matches. The booking reader and calculator display the stored record.

---

## ADR-0070 — Publish private event dates without event details

- **Date:** 2026-11-11
- **Context:** The public celebration calendar needs to show private dates alongside published events.
- **Decision:** Staff choose draft, public or private visibility through the existing event permissions. Private events remain unpublished. A bounded public RPC returns only distinct dates marked private. The published feed supplies public event details.
- **Consequences:** Existing drafts remain hidden. The public calendar can show a private marker on the same date as a public event without receiving any private event details.

---

## ADR-0070 — The quad booking is route cards on live departures, embedded on /keturraciai

- **Status:** accepted (2026-11-12).
- **Context:** the friend's ATV booking was a design preview with hard-coded routes and prices that booked nothing; `main` already had route cards on database routes, but only inside the old tab layout, while the new /rezervacija used a route-chip form and /keturraciai only linked out.
- **Decision:** one quad form everywhere: a date, then `QuadTourCard`s on live routes and scheduled departures (RLS-readable rows; prices stay in `quad_tour_routes`, never in components). /keturraciai embeds the real flow in a wide layout (`wide` prop) so the page books for real.
- **Consequences:** a tour sells only on a scheduled departure, so with no departures the page shows "no tours" until staff add them. The friend's free-choice start times (any free hour) are not offered; that would need a different request model and is a product decision.

## ADR-0069 — WAKE season pass orders use the coupon catalogue

- **Date:** 2026-11-11
- **Context:** The wakeboarding page offers individual rides and two season passes.
- **Decision:** Use active `kabelis` coupon products for the public offers and the existing order and payment confirmation workflow. The stable `wake-abonementas-` product IDs identify season passes. Staff set prices and availability in `/admin/kuponai`.
- **Fulfillment:** Customers receive a code after payment confirmation. Staff redeem the paid pass code once and activate the corresponding season pass at the park. Individual ride buyers arrange a time with Marso Akademija.

---

## ADR-0069 — /rezervacija reuses the service booking forms behind "Tipas" chips

- **Status:** accepted (2026-11-12).
- **Context:** the rebase of `front-updates` kept `main`'s older /rezervacija (tab bar, date strip, filters, program list) while /pirtis already had the newer service forms, so the two screens booked the same sauna in different ways.
- **Decision:** on /rezervacija the left column is one panel with chips for Pirties seansai, Privati pirtis, Nakvynė, Keturračiai and Wake; each opens the same form the service page uses (`SaunaServiceBooking` with a `mode`, `QuadServiceBooking`, `WakeServiceBooking`), and the plan stays in the right column. The sauna form is remounted (`key`) on a chip change so its draft state resets.
- **Consequences:** one place to change sauna booking. The older date-strip list for the sauna is gone from /rezervacija (still used for stays). Cabin availability counts and the ATV preview from the original branch were not ported.

## ADR-0068 — The "coming soon" gate is a database switch owners flip in /admin/svetaine

- **Status:** accepted (2026-11-12); migration applied; grant-tightening follow-up applied.
- **Context:** the gate (ADR-0037) was the `SITE_GATE` env var, so opening or closing the site needed someone with Vercel access and a redeploy.
- **Decision:** `site_settings.coming_soon` (singleton row, RLS: public read, owner update) is the source. `proxy.ts` reads it through `lib/site-gate-flag.ts` (anon REST call, 5 s per-instance cache, 2 s timeout). `SITE_GATE=1` stays only as the fallback when the database cannot be answered, so an outage keeps the previous behaviour instead of guessing. The preview code (`SITE_GATE_CODE`) stays an env var: a secret does not belong in a publicly readable table. Seeded ON so applying the migration cannot open the site by accident.
- **Consequences:** a flip reaches visitors within ~5 s (instantly on the instance that handled the click). Every gated request may now cost one cached REST call. Local dev against the shared database is gated too unless the browser holds the preview-code pass.

## ADR-0067 — Pirtininkai are named rows priced per booking, added to hourly hire and private programs

- **Context:** the owner wants to add pirtininkai, set their prices and offer them on the programs. The generic `pirtininkas` extra of ADR-0066 could not name or price people separately.
- **Decision:** table `sauna_masters` (name, description, price per booking, `min_hours` for hourly hire, `active`, `sort_order`; anon reads active, `pirtis` writes), edited in a "Pirtininkai" card on `/admin/pirtis` above "Priedai". A booking takes an optional `masterId`: `create_sauna_booking` and `create_program_booking` get `p_master_id`, add his price to the total (and to the base the discount code applies to) and store it as a `booking_extras` line "Pirtininkas: <name>" with no `upsell_id`, so payments, receipts and the admin show it with no new columns. For hourly hire his `min_hours` raises the shortest session. The storefront shows a "Pirtininkas" select (Be pirtininko / name · +price) under the sauna choice for hourly hire and under a selected private program, not for shared sessions. The old generic extra is switched off and its row copied as the first master. Migration `20261112120000_sauna_masters.sql`.
- **Consequences:** `SaunaPick.masterId`, `SaunaPlan.master` / `ProgramPlan.master`, `MasterPicker`, `MastersCard` / `MasterDialog` / `MasterRow`, `AdminData.saunaMasters`. Programs are not limited by `min_hours`; the turnaround is not enforced for programs. A master has no calendar (two bookings can name the same person at the same time): availability per pirtininkas is not built.

---

## ADR-0066 — Sauna sessions are priced per length, by weekday or Fri–Sun, with a guest fee and a turnaround

- **Context:** the owner's booking sheet (2026-11-11): choose 2/3/4 h with a fixed price each (160 / 220 / 240 € weekdays; 250 / 320 € Fri–Sun, where 3 h is the minimum), a "pirtininkas" extra (+250 €, minimum 3 h), a base price for up to 10 people and +15 € per extra guest, and 1–1.5 h kept free between sessions. The old model (hourly rate by group size plus a package) could not express this.
- **Decision:** `saunas` gets `weekday_prices` / `weekend_prices` (jsonb `{"<hours>": price}`; the keys are the lengths on offer), `included_guests`, `extra_guest_fee` and `turnaround_hours`; the old group-rate and package columns are nullable and unused, `min_hours` / `max_hours` stay as the shortest and longest length (the app derives them on save). `sauna_upsells.min_hours` makes an extra raise the minimum session; the master is the `pirtininkas` extra (250 € per booking, 3 h). `private.sauna_prices(sauna, date)` picks the table (ISO weekday 5–7 = weekend). `create_sauna_booking` and `accept_inquiry_stays` price from it and `create_sauna_booking` rejects a length not on offer (`sauna_duration`) or a session closer than the turnaround to another booking (`sauna_booked`); `sauna_taken` pads booked hours by the turnaround on both sides so the picker hides them. Migration `20261112090000_sauna_duration_pricing.sql`.
- **Consequences:** `lib/sauna.ts` (`SaunaRates`, `sessionPrice(hours, party, rates, day?)`, `sessionLengths`, `minHoursFor`) is the one TypeScript copy of the rule, mirrored in SQL. Admin `/admin/pirtis` edits a price field per length (empty = not sold) for each day type. The turnaround is not enforced for staff-entered bookings or private programs (flat price); the 1 h gap is a setting, not the owner's 1–1.5 h (the grid is whole hours). Whether the pirtininkas can be booked on any day or only Fri–Sun, and how far ahead, is unconfirmed (open question on the sheet): no restriction is built.
- **Addendum 2026-11-12 (full day):** the owner's final sheet adds a 2 h Fri–Sun length, 3 h at 210 / 270 and a whole-day length (300 weekdays, 400 Fri–Sun). The day is the key `12` in both price tables (`FULL_DAY_HOURS`, label "Visa diena"), so no schema or function change: `create_sauna_booking` already accepts any key of the day's table that fits opening hours, and `maxHoursFrom` makes it bookable only from 10:00 on a free day. Prices updated in migration `20261112150000_sauna_full_day_prices.sql`; `max_hours` = 12. The public "Kainos" table (`SaunaPriceTables`) reads these rows, so the page, the picker and the booking cannot disagree. The older hard-coded `hireTariff` (`lib/sauna-hire.ts` on `front-updates-original`) stays unported.

---

## ADR-0065 — Explicit component variants instead of boolean props; drawers load at idle

- **Status:** accepted (2026-11-12)
- **Context:** `Stepper` had three layout flags (`editable`, `compact`, `hideLabel`) of which only a few combinations were used; `ServiceSchedule` and `EstimateSummary` each switched copy or layout on one boolean. Separately, the home page imported both drawers (booking flows, calculator) statically, so that code also landed in chunks other routes load. A production build showed `/renginiai` and `/rezervacija` shipping 86 and 44 KB more script than needed.
- **Decision:** layout and content variants are separate exported components that share one implementation (`Stepper` / `CompactStepper` / `StepperControls`, `CalendarSchedule` / `InquirySchedule`, `EstimateSummary` / `EstimateBreakdown`). Behaviour that is orthogonal (`editable`) stays a prop. The home drawers are `next/dynamic` imports mounted when the browser is idle, or immediately if opened first. `/rezervacija` streams its data-dependent flow inside `Suspense`.
- **Consequences:** callers name the variant they want and no dead flag combinations exist. The home page transfers about 14 KB more script in total (separate chunks) but off the first render path; other routes drop. The deferral off the critical path was inferred from the idle mount, not measured separately. `/[service]` still awaits its data before rendering, because its gallery and schedule need it.

---

## ADR-0064 — Anon gets SELECT only on policy-backed tables; public registration is throttled

- **Context:** the 2026-11-11 Supabase audit found `anon` holding INSERT/UPDATE/DELETE grants on many tables (RLS blocked them, but nothing else did), an unthrottled `register_rider_public`, a `finalize_rider_registration_public` that stored any path it was given, and `rls_auto_enable()` callable through the API.
- **Decision:** `anon` keeps table privileges only as `SELECT` on the 13 tables that have an anon read policy; every anon write goes through a `security definer` RPC. `register_rider_public` validates birth date and terms version and caps unfinished registrations at 3 per contact per 24 h and 100 per hour park-wide; `finalize_rider_registration_public` only accepts `<rider_id>/avatar.(jpg|png|webp)` / `<rider_id>/signature.png` that exist in Storage. `rls_auto_enable()` is revoked from API roles.
- **Consequences:** a new table must not be granted to `anon` unless it has an anon read policy. A burst above 100 self-registrations an hour fails with `too_many_registrations` (the form shows its generic error). Migration `20261111174736_security_hardening.sql`.

## ADR-0063 — One metadata helper and JSON-LD built from site constants

- **Status:** Accepted 2026-11-11.
- **Context:** Only the [service] pages had a canonical and Open Graph tags; the audit also found no structured data.
- **Decision:** every public page builds its metadata with `pageMetadata()` (`lib/seo.ts`); JSON-LD comes from `lib/structured-data.ts` using `PARK_ADDRESS`, `CONTACTS` and `SITE_URL`, with only facts already published on the site.
- **Consequences:** new public pages must call `pageMetadata()` and be added to `app/sitemap.ts`. Opening hours, geo and price range are left out until the owner confirms them.

---

## ADR-0062 — Customers see their wakeboard plan through `my_riders()`, matched by confirmed contact

- **Status:** Accepted 2026-11-11. Migration `20261111210000_my_rider.sql` applied 2026-11-11 to the live project (`mwngljhcvqkvncwbmgeo`, MCP slot `supabase-project-3`) once the owner asked for it; the first attempt was blocked by the permission classifier. Verified: `anon` cannot execute `my_riders()`, `authenticated` can. Types in `database.types.ts` were edited by hand.
- **Context:** `riders` (bracelet customers) come from staff, the Grabby import and /registracija and have no auth user id; the owner wants a customer to see their apyrankė plan on /paskyra.
- **Decision:** A read-only security-definer function `my_riders()` returns the signed-in customer's rider rows, matched by confirmed auth e-mail, or confirmed auth phone against `phone` / `phone2` by the **last 8 digits** (staff often store local numbers like "8 612 34567"; superseded, see below). It returns name, current plan (name, description, category, price), bracelet numbers and plan purchases only: no staff comments, documents, waivers, photos or ride sessions. `anon` cannot execute it. UI: `RiderPlans` under a Vandenlentės tab in `AccountTabs`.
- **Security review follow-up (applied 2026-11-11, verified):** the suffix match could match a foreign number ending in the same digits, so `20261111220000_my_rider_exact_phone.sql` adds `private.normalize_phone()` (00/+ prefix removed, Lithuanian `8XXXXXXXX` and `6XXXXXXX` turned into `370…`) and compares the full normalised digits for equality. Verified on the live project: "8 612 34567", "+370 612 34567", "0037061234567" and "61234567" all become `37061234567`, a UK number stays `447700934567`; `anon` cannot execute `my_riders()` or the normaliser.
- **Second review follow-up (applied 2026-11-11 via `supabase db query --linked`, verified):** `20261111230000_my_rider_account_phone_plain.sql` stops running `normalize_phone()` on `auth.users.phone` (already E.164 digits). The trunk rules apply only to staff-entered `riders.phone` / `phone2`; the account phone is compared as plain digits (≥ 9), so a foreign 8…/6… account number cannot be rewritten into a `370…` match. `supabase db push` is blocked by remote history timestamps that differ from local, so recent migrations were applied directly and are not in the remote history table.
- **Consequences:** Matching by contact can miss a rider saved under a different e-mail / phone (the empty note says so) and could in theory match a number reused by someone else; the data shown is limited to the plan. No change to `riders` or its RLS.

## ADR-0061 — Customers see their calculator quotes through `my_inquiries()`, matched by confirmed contact

- **Status:** Accepted 2026-11-11. Migration `20261111190000_my_inquiries.sql` applied to the live project (`mwngljhcvqkvncwbmgeo`, via MCP slot `supabase-project-3`, URL checked) after the owner asked for it again; the first attempt was blocked by the permission classifier. Verified: `anon` cannot execute `my_inquiries()`, `authenticated` can. `loadMyInquiries` still returns an empty list if the call fails.
- **Context:** `/paskyra` shows a customer's reservations (rows with their `user_id`), but calculator inquiries come from anonymous forms and have no `user_id`.
- **Decision:** A read-only security-definer function `my_inquiries()` returns the signed-in customer's `skaiciuokle` inquiries where the inquiry e-mail equals their confirmed auth e-mail, or its phone (digits only) equals their confirmed auth phone. It exposes only the fields the customer typed or was quoted (type, date, guests, space, estimate, status, accepted); notes and the calculator payload stay private. `anon` cannot execute it.
- **Widened (same day, migration `20261111200000_my_inquiries_details.sql`, applied after the owner allowed it; the first attempt was blocked by the permission classifier):** the function also returns the customer's comment, their contact details and the estimate `lines`, for the details popup; the rest of the calculator payload and staff notes stay private.
- **Consequences:** No change to the inquiries table or its RLS. An inquiry sent with a different e-mail / phone than the account's will not show. `/paskyra` gets tabs Visi / Pirtis / Namukai / Keturračiai / Pasiūlymai (`AccountTabs`); event tickets appear under Visi only.

## ADR-0060 — Accepting a calculator inquiry books its cabins and saunas (`accept_inquiry_stays`)

- **Status:** Accepted 2026-11-11. Migration `20261111180000_inquiry_stay_holds.sql` applied 2026-11-11 to the live "Vanduo" project (`mwngljhcvqkvncwbmgeo`, via the `supabase-project-3` MCP slot after checking its URL) and verified (columns exist; `anon` cannot execute either function, `authenticated` can). The MCP recorded it as version `20261111164744`, not the file's `20261111180000`; `lib/supabase/database.types.ts` was edited by hand to match and is worth regenerating.
- **Context:** The calculator stores the picked cabins (`cabinUnits`, `cabinNights`) in `inquiries.calculator_input`, but nothing booked them, so the same cabins stayed free on `/rezervacija` while staff were quoting an event.
- **Decision:** Two functions, `accept_inquiry_stays(inquiry)` and `release_inquiry_stays(inquiry)`, both security definer and requiring the `uzklausos` and `rezervacijos` permissions (owners pass). Accept inserts one confirmed `namelis` booking per cabin type (arriving on the inquiry date, `source = telefonu`, priced from the current `stay_types` rate, linked by the new `bookings.inquiry_id`) and sets `inquiries.accepted_at`; the existing capacity trigger rejects it (`stay_full`) when the cabins are not free, so it is all or nothing. Release cancels those bookings and clears `accepted_at`. No inquiry-status enum change. Admin: "Priimti ir užimti namelius" / "Atlaisvinti namelius" in the inquiry sheet (`acceptInquiry` / `releaseInquiry`).
- **Saunas (same day):** The calculator's single generic "Pirtis" card is replaced by one card per active sauna from the database (`CalculatorCatalog.saunas`, priced with that sauna's own rates; `EstimateInput.saunas` = sauna id -> `{ hours, startHour, master }`). A sauna with a start hour is also booked on accept (confirmed `pirtis` booking on the event date, total recomputed in the function from the `saunas` row, mirroring `sessionPrice`; hours and start are validated against the sauna's min / max hours and opening hours, since the inquiry is public input); the overlap and block triggers reject a taken slot. One without a start hour stays a quote line. `estimate(input, catalog)` now takes `{ stayTypes, saunas }`; the home drawer loads it with `loadCalculatorCatalog`.
- **Extras:** `SaunaPick.extras` (upsell id -> count) replaces the old hardcoded Pirtininkas flag; on accept they become `booking_extras` rows priced from `sauna_upsells` and are added to the booking total.
- **Programs:** a sauna in the quote may carry `programId` (one of its active private programs); the hold then uses the program's length (rounded up to whole hours) and flat price and sets `bookings.program_id`.
- **Consequences:** Accepted cabins appear as normal stay bookings (calendar, Rezervacijos, sales) and are counted in `stay_occupancy()`. Cabins and saunas are held; quads, WAKE and the event space are not. Editing a booking's dates does not change the inquiry. Inquiries from before the stay-type change keyed by size ("2" / "4") map to `namelis-2` / `namelis-4`.

## ADR-0059 — Cabin sizes and camper pitches come from `stay_types`; the owner manages them at /admin/namukai

- **Status:** Accepted 2026-11-11. No migration: `public.stay_types` (label, note, max guests, price, units, active, sort order) and its owner-only RLS already existed; nothing in the app read or wrote them except the booking RPCs.
- **Context:** `lib/cabin.ts` hard-coded two cabin sizes (2 and 4 guests, 8 and 6 units, 50 / 60 €) and a camper pitch, so the owner could not add a type, change a price or stock, or hide one without a deploy, and the database and the code could disagree.
- **Decision:** `lib/cabin.ts` now holds only the `StayType` model and pure helpers (`freeStayUnits`, `pickStayType`, `stayStock`, …). Public reads go through `getStayTypes()` / `CabinPageData.stayTypes` in `lib/data/public.ts`; availability is keyed by stay type id. A stay pick is `{ typeId, nights, units }`. The event calculator takes the types as an argument (`estimate(input, stayTypes)`), loaded by `/skaiciuokle` on the server and by the home-page drawer through `loadStayTypes` so `/` stays static. Admin: `/admin/namukai` (owner only, `saveStayType` / `deleteStayType`, `useAdmin().stayTypes`). Phone bookings take the smallest active type that fits the party (`pickStayType`, mirrored in `stayTypeFor` on the server).
- **Consequences:** Two kinds remain (`namelis`, `kemperis`, the `booking_kind` enum); a new type is a new row of one of them. "Homes" are a unit count per type, not individually named cabins. Types with bookings cannot be deleted, only hidden. There is no reorder control yet (new types go last). The legacy `room-*` price items are no longer used by the admin booking dialog.

## ADR-0057 — Termina is the only font; Big Shoulders is removed

- **Context:** `app/layout.tsx` loaded Big Shoulders from Google Fonts only as the non-themed `font-display` fallback and for the `Wordmark`. Next logged "Failed to find font override values" on every compile, and `theme-marse` already mapped the display face to Termina.
- **Decision:** Remove the Big Shoulders import and variable. `font-display` falls back to `--font-termina`; `font-wordmark` uses Termina Bold (sizes 18cqw / 10cqw from `md`, since Termina is wider).
- **Consequences:** One font family, no Google Fonts request, no warning. The coming-soon wordmark changed look and needs a visual check.

- **Registration details follow-up (ADR-0080):** the function now also returns the customer's own registration fields, but only for `primary_match` rows (the confirmed e-mail or `phone`, never `phone2`); see ADR-0080.
---

## ADR-0056 — Staff SMS recipients are an owner-managed list with topics, not one env var

- **Status:** Accepted 2026-11-10. Migration `20261110140000_notification_recipients.sql` applied by the owner and verified on the live project.
- **Context:** Every staff SMS (new request, paid, double payment) went to the single `STAFF_NOTIFY_PHONE`. The owner wanted several numbers, each getting only some of it (bookings, payments, everything), edited in the admin.
- **Decision:** Table `notification_recipients` (name, E.164 `phone` unique, `topics text[]` of `visi` / `rezervacijos` / `uzklausos` / `mokejimai`, `active`), RLS owner-only (`private.is_owner()`), no new page permission: like staff management it is not something a role is granted (ADR-0012 keeps page-permission policies for page data). `/admin/pranesimai` (owner-only, sidebar "Pranešimai" under Nustatymai) edits it through `useAdmin()` and `app/admin/notification-actions.ts`. The server reads numbers through `staff_notify_phones(p_topic)` (security definer, service role only, per the `createAdminClient` rule that it never queries tables directly); `lib/sms/staff-recipients.ts` `sendStaffSms(topic, body)` texts each. A new request is `rezervacijos` for pirtis / nakvyne / keturraciai and `uzklausos` for `kita`; paid, payment-to-check and double payments are `mokejimai`. `visi` is stored as itself so it also covers topics added later.
- **Fallback:** The function returns null when no active recipient exists, and any lookup error also falls back: `STAFF_NOTIFY_PHONE` still gets everything. So an unapplied migration or an empty list changes nothing, and once one active recipient exists only the list is used (a person with no matching topic gets nothing).
- **Consequences:** Staff email is unchanged (still `STAFF_INBOX` / `STAFF_NOTIFY_EMAIL`). Customer SMS is unaffected. Topics are a fixed list in `lib/notification-topics.ts` and the table's check constraint; a new topic needs both plus the call site.

---

## ADR-0055 — Quad tours are sold on dated departures (events pointing at a tour type)

- **Status:** Accepted 2026-11-10. Migration `20261110120000_quad_tour_departures.sql` tested inside a rolled-back transaction on the live project (booking 3 quads = 177 EUR and sold = 3; a second booking beyond capacity is refused; cancelling resets sold), then applied to the live database by the owner. Verified afterwards: both columns, the constraint, the trigger, the three `keturraciai` policies and the function exist; the function is executable by anon/authenticated and the trigger function is not; `database.types.ts` regenerated (with the known `create_inquiry.p_date` edit). `tsc`/`eslint` clean; /keturraciu-nuoma and /rezervacija return 200; the booking flow itself is not browser-checked.
- **Context:** Tour products (Mini / Midi / Maxi, `quad_tour_routes`, ADR-0053) were booked on any date with free fleet. The owner wanted tour *types* with *dated events* under each, like sauna programs and their sessions.
- **Decision:** A departure is an `events` row of category keturratis with `tour_route_id`; its `capacity` is the number of quads that can join and `sold` the quads booked (trigger from `quad_rentals.tour_event_id`). The public quad page and the /rezervacija tour cards offer only published departures (`QuadPageData.departures`, `quadTourDepartureSlots`: capacity left capped by the free fleet for the whole route); a booking names the event and `create_quad_tour_departure_rental` takes date and start from it, locks the departure, checks capacity and delegates pricing, gear, discount and fleet allocation to the unchanged `create_quad_tour_rental`. Admin: the Turai tab holds the types (`TourRoutesCard`), the dated departures (`CategoryEventsList` + `TourDepartureDialog`, name/price/length come from the type) and the registrations (event tickets plus tour rentals); the calendar shows a departure as an event with its bookings inside and no longer lists those rentals separately. Staff with `keturraciai` may manage keturratis events (new RLS policies; `saveEvent` accepts `renginiai` or `keturraciai`).
- **Hardening (same day, follow-up migration `20261110130000_quad_tour_departures_hardening.sql`, tested in a rolled-back transaction, then applied by the owner and verified: anon/authenticated can no longer execute `create_quad_tour_rental`, the departure wrapper stays callable, the trigger exists and its function is not executable by anon):** a security review found that `create_quad_tour_rental` stayed callable by anon/authenticated (a tour on any date, skipping the departure and its capacity) and that per-person `create_tour_ticket` accepted a departure (its `events.sold` sync would overwrite the quad count). The migration revokes direct execute on `create_quad_tour_rental` (the definer wrapper keeps working) and adds trigger `event_tickets_no_departures` rejecting tickets for events with `tour_route_id`.
- **Consequences:** Until the owner adds departures, the storefront offers no tour dates. Departures start on whole hours (the booking uses the hour of `start_time`). The legacy per-person tour tickets (`create_tour_ticket`, events without `tour_route_id`) stay and are excluded from the departure list. Two departures of one type at the same hour would share a Laikas value only by event id, which is unique, so they work, but the admin does not warn about duplicates.

---

## ADR-0058 — Apžvalga sales table: one client-side `Sale` list over existing admin data, no new query or permission

- **Decision:** `lib/admin/sales.ts` maps data `useAdmin()` already holds (bookings, quad rentals, tour/event tickets, coupons, purchases) into one `Sale` list; the table filters it in the browser.
- **Why:** Same approach as ADR-0054 (Kalendorius): no new table, RPC or permission, and rules 5 and 6 stay intact (no prices computed, no data outside `useAdmin()`).
- **Charts:** The inline-SVG charts added first (no chart library, `fill-chart-*` classes) were removed again on the owner's request; the stat cards stay. If charts return, keep them as SVG attributes, not `style={{}}`.
- **Coupons are not revenue here:** a gift coupon is validated at booking time and redeemed by staff later; the booking keeps its full `total`. Adding the coupon sale (face value) and the booking would count the same euros twice, so `salesRevenue` leaves coupons out unless the Kuponai tab is chosen, and the stats show "parduota kuponų už X €" as a separate line.
- **Consequences:** The date range is the sale date (`createdAt`, coupons `paidAt`), not the service date. Sources a role cannot read arrive empty, so its sales are missing from that role's table.

## ADR-0054 — Kalendorius: one client-side calendar over the existing booking tables, no new permission

- **Status:** Accepted 2026-11-10. Code only, no migration. `tsc`/`eslint` clean; not browser-checked.
- **Context:** Bookings live in four places (`bookings`, `quad_rentals`, quad-tour tickets, event tickets) and the only calendar (Rezervacijos' Kalendorius tab, ADR-0044) shows sauna hours and stay/quad load, not individual bookings across types. The owner wanted one page showing all of them.
- **Decision:** `lib/admin/calendar-entries.ts` flattens bookings, quad rentals and events into one `CalendarEntry[]` (kind: pirtis / namelis / keturraciai / renginys, with sessions, campers and tours folded into the first three; first/last day, time, title, customer, status; cancelled dropped, stays span their nights; events carry seats and keep their tickets inside, read with `ticketsFor`, so a ticket is never a separate entry), computed in the browser from data `useAdmin()` already holds. `/admin/kalendorius` renders a month grid, a day agenda and per-type filters (`components/admin/calendar/`). It reuses `BookingSheet` / `RentalSheet`; events open `EventSheet`, which lists their tickets. The page is guarded by the existing `rezervacijos` / `uzimtumas` permissions rather than a new one.
- **Consequences:** No new queries or RLS: a role sees only the sources its own policies already load (ADR-0012), so a role without `keturraciai` simply sees no quad entries. The per-day load strips in Rezervacijos stay as they are. Quad tours filed as rentals show fleet labels, not the route name. Everything is loaded in the store up front, so a very large booking history would need a date-windowed fetch later.

---

## ADR-0053 — Quad tour products (Mini / Midi / Maxi) live in the database and are priced by one RPC

- **Status:** Accepted 2026-11-09. Migration `20261109200000_quad_tour_products.sql` applied directly to the live "Vanduo" project (`mwngljhcvqkvncwbmgeo`) with `supabase db query --linked -f`, after the owner said to use the live database rather than a local stack. It was dry-run first on live inside three deliberately aborted transactions (all rolled back; rentals stayed at 1), then applied; recorded in `supabase_migrations.schema_migrations` as version `20261109200000`. `lib/supabase/database.types.ts` regenerated (additions only) and the known `create_inquiry.p_date` hand-edit kept. **Do not use `supabase db push`**: the remote history carries the MCP's own timestamps for earlier migrations, so it would try to re-apply them.
- **Context:** The public quad page sold tours from constants in `components/quads/quad-preview-content.ts` (59 / 79 / 105 EUR per quad, gear 3 / 5 / 10 EUR, minimum 3 quads, a 48 h cancellation line). Checkout prices every request from database rows, so a tour could not be paid; the "Rezervuoti" dialog only built a `mailto:` with a "preliminary price" (ADR-0052 follow-up). The owner chose to put the products in the database and make tours payable.
- **Decision:** New tables `quad_tour_routes` (name, km, hours, price per quad, minimum quads, texts, photo path, badge) and `quad_tour_accessories`, RLS like `quad_types` (anon reads active rows, `keturraciai` staff manage). `quad_settings.tour_cancellation_note` holds the cancellation line. `quad_rentals` gains `tour_route_id` and `tour_accessories` (a name/price snapshot). One new RPC `create_quad_tour_rental` prices route x quads + gear (then the discount code, like the other RPCs), takes the quads from the fleet type by type (sort order) for every hour of the route, stores a single type on the header or a mixed split as `quad_rental_items`, and leaves capacity to the existing trigger, so tours and hourly rentals share one stock. Seeded with the previous constants.
- **Verified on live (rolled back):** Midi x 3 quads + 2 gear = 243 EUR; 6 quads = whole fleet as two items (354 EUR for Mini); full slot, last-hour and mid-route overlaps -> `quad_full`; fits right after a tour ends and after a cancellation; below the minimum -> `quad_units`; unknown route -> `quad_tour_unavailable`; outside opening hours -> `quad_closed`; bad or unknown gear -> `quad_gear`; anon can read the routes, cannot insert (42501) and can execute the RPC.
- **Consequences:** The payment line for a tour is labelled "Keturračiai" like any quad rental (`start_payment` / `private.payment_items` are unchanged); the route is in the rental note and `tour_route_id`. The app no longer has the constants: `getQuadPageData` serves `tourRoutes` / `tourAccessories`, `quadTourPlan` plans from them, the request pipeline has a `quadTourRental` type (`createQuadTourRental` -> `create_quad_tour_rental`), `ReservationFlow` books a chosen tour through the same checkout dialog as the sauna (contact, discount code, Stripe), `/keturraciu-nuoma` runs the flow with `activity="keturraciai"`, and staff edit routes, gear and the cancellation line in /admin/keturraciai -> Parkas (`TourRoutesCard`, `TourAccessoriesCard`, server actions with the `keturraciai` permission). A tour holds `units` quads even when two ride one; riders = quads. The payment line is labelled "Keturračiai". Not browser-checked: the admin cards (needs a staff sign-in) and a complete paid booking (the local `.env.local` holds the live Stripe key, so no test payment was made); the checkout dialog was verified to the "Mokėti 237 €" button.

---

## ADR-0051 — Klientai "Rolė" tab: a customer becomes admin through a staff login matched by email, no new table

- **Status:** Accepted 2026-11-09. No migration, no new server action: pure UI over `createStaff`, `setStaffRole` and `setStaffActive` (`app/admin/staff-actions.ts`).
- **Context:** The owner wanted to open a customer in `/admin/klientai/[id]` and make them an admin or give them a permissions role. `riders` (customers) and `staff` (admin logins, keyed by `auth.users.id`) are unrelated tables; a rider has no auth link, only an optional `email`.
- **Decision:** `CustomerPage` gets an owner-only "Rolė" tab (`customer-role-tab.tsx`; staff management is owner-only in the actions and in RLS, so the tab is hidden for everyone else). The rider is tied to a login by case-insensitive email match against `staff.email`. Match found: role select (Savininkas is labelled "administratorius"), active switch, the role's page badges; self cannot be changed. No match: pick a role and create the login (display name = "Vardas Pavardė", the rider's email, temporary password shown once via `CredentialsPanel`). A rider without an email is told to add one in Profilis first.
- **Consequences:** The link is the email, not a foreign key: changing a rider's email on Profilis detaches the tab from the login, and an email that already has an auth account without a staff row makes `createStaff` return its "jau turi paskyrą" error (remove it in Supabase Authentication, or use another email). Password reset and removal stay in Darbuotojai (linked from the tab). A real `riders.user_id` link would be a separate ADR. The email is unverified (`/registracija` accepts any address), so the tab shows the login's name with a "confirm it is the same person" warning; it can't grant access by itself, since only owners see it and every action is owner-gated server-side.

## ADR-0050 — Service galleries and booking panels share the first screen

- **Status** Accepted 2026-11-07.
- **Context** The owner requested the reference tour layout on every service page, with a photo rail, reservation panel, availability calendar and visible reviews.
- **Decision** Keep the service shell on the server. The shared hero shows the photo rail alongside the sticky booking or contact panel from `lg`. The page gallery opens an uncropped carousel. Sauna and stay reuse the scoped checkout. The stay panel uses a compact date field. The quad-only client provider shares the selected date between the calendar and the route-first tour sidebar. The schedule reads the active fleet and occupied counts from the existing public quad availability reader.
- **Consequences** The counts describe the Vanduo Marse fleet per hour. The provider has no supplier inventory feed. Review cards use attributed summaries of public park and activity reviews.
- **Update 2026-11-08** The route-first sidebar shows day and start availability. A valid plan can prepare an email draft with the tour details for the park to confirm. The link opens the visitor’s email client. It creates no database reservation or payment. The standalone and multi-activity preview flows remain governed by ADR-0033.
- **Sauna update 2026-11-08** `/pirtis` uses a 2:1 hero from `lg` and a compact booking panel for choosing a published session or private hire before the date. Private venues and packages use the active sauna programs and start availability. The existing `pirtis-marse` venue is the Finnish sauna and keeps its active private programs and shared session occupancy. The public reader corrects the seeded venue name and wood-fired copy. Staff customisations and booking configuration stay in Supabase. The planned wood-fired sauna is shown as under construction and cannot be selected. The inline picker reuses the reservation month calendar, and the final selection enters the existing ReservationFlow checkout. The schedule browses published sessions independently so visitors can inspect other dates without changing their plan. Its session links open the existing dialog, which adds tickets for the chosen session and date.

## ADR-0049 — Public activity pages use a shared layout and scoped booking

- **Status** Accepted 2026-11-07.
- **Context** Each activity needs a discoverable public page with practical details and the appropriate reservation or inquiry action.
- **Decision** An allowlisted top-level route renders a shared service layout with activity copy, original gallery assets, canonical metadata and Open Graph images. Sauna and stay use the existing reservation flow in single-activity mode. The sauna schedule uses the same published session IDs as ADR-0048 and can open the dialog on `/pirtis` itself. The quad sidebar reuses the isolated preview from ADR-0033. Event spaces use the calculator prices and inquiry path. Restaurant and wakeboarding provide direct contact for details that have no current catalogue.
- **Consequences** The sitemap and homepage link to the public pages. The quad preview remains separate from real booking. Reviews link to the park’s Google Maps listing. Uploaded sauna photos automatically appear in the gallery.

## ADR-0048 — Share public sauna sessions through the reservation URL

- **Status** Accepted 2026-11-07.
- **Context** Visitors need a link that opens the details of one published sauna session and lets them select their tickets.
- **Decision** Use the existing event ID in the `seansas` parameter on `/rezervacija`. A direct request uses the event’s date as the initial selection. Opening the dialog on the page uses browser history so the active plan and quantity drafts stay in memory.
- **Consequences** The dialog uses the public sauna data and the same quantity, pricing and availability as the card. Adding a session uses the existing plan and checkout flow. Expired or unknown links show that the session is unavailable.

---

## ADR-0047 — Dropped the unused "laimeta"/"prarasta" inquiry statuses from the enum, not just the UI

- **Status:** Accepted 2026-11-09. Migration `20261109150000_drop_inquiry_won_lost.sql` applied to the live "Vanduo" project via the Supabase MCP (owner's explicit go-ahead), after confirming live data first. `database.types.ts` regenerated (the `create_inquiry.p_date` hand-edit reapplied, per ADR-0042's convention). Security advisor showed no new findings.
- **Context:** The owner asked to remove the "Laimėta"/"Prarasta" (won/lost) filter chips from `/admin/uzklausos`. `inquiry_status` is a real Postgres enum (`nauja | susisiekta | pasiulymas | laimeta | prarasta`, `supabase/migrations/20261021230415_init_schema.sql`), not just a UI label set — removing the chips from the filter bar without touching the enum would leave them reachable from the status-change dropdown in `InquirySheet` (both are generated from the same `INQUIRY_STATUS` record, so editing one edits both), silently orphaning any inquiry set to either status with no way to filter back to it. Checked live data first (`select status, count(*) from public.inquiries group by status`) — every row was `nauja`, zero used either value — so narrowing the enum is a schema change with no data migration behind it, not a destructive one.
- **Decision:** Recreated `inquiry_status` as a 3-value enum (standard Postgres swap: rename old type, create new one, cast the column across with `using status::text::...`, drop the old type), guarded in a `do $$ if not exists $$` block so the migration file is a safe no-op if ever replayed against an already-migrated database. `InquiryStatus` (`lib/admin/types.ts`), `INQUIRY_STATUS` (`lib/admin/labels.ts`), `INQUIRY_TONE` (`status-badge.tsx`) and `setInquiryStatus`'s literal union + `z.enum` (`app/admin/actions.ts`) all narrowed to match — `InquiriesView`'s filter chips and `InquirySheet`'s status dropdown both derive from `INQUIRY_STATUS`, so removing two keys there removed them from both places.
- **Consequences:** If "won/lost" tracking for inquiries is wanted again later, it needs a fresh migration (and a product conversation about what it should actually mean) — this isn't a soft-hide, the values no longer exist in the database. Nothing else referenced these two values (checked: no other migration, view, function or RLS policy mentioned them), so this was a clean, isolated removal.

---

## ADR-0046 — Pirtis/Namukai/Keturračiai become expandable sidebar domains (superseded 2026-11-10: flattened back to plain links, see changelog) (Kalendorius + Valdymas)

- **Status:** Accepted 2026-11-08/09. Code only, no migration. `tsc --noEmit`, `eslint` and `next build` clean. Not yet browser-checked (`localhost:3001` still 431s, see `status.md`).
- **Context:** Right after ADR-0044 flattened the admin IA, the owner said it still felt hard to navigate and sketched a sitemap grouping Pirtis, Namukai and Keturračiai each with their own Kalendorius (booking calendar) and Valdymas (management/settings) rows, plus where to find that resource's customers. Clarified via `/plan`: a nested/expandable sidebar (not per-page tabs, not a flat relabel); keep the single shared Rezervacijos calendar from ADR-0044 rather than splitting it back apart; Valdymas is each resource's *existing* settings page, not a rebuild.
- **Decision:** `admin-nav.ts`'s `ADMIN_NAV` is now `(AdminNavItem | AdminNavDomain)[]` — a domain (`{ id, label, icon, group, children: AdminNavItem[] }`) is visible if at least one child's permission allows it; `visibleNav` filters a domain's children down to what the role can open (dropping the domain if none remain), `flattenNav` (new) splices every domain's children back into one flat list for the mobile bottom nav and "Daugiau" sheet, which have no room for a tree. `activeNavItem` now returns `{ item, domainId }` so the sidebar can auto-expand the domain holding the current route, and a new `isActiveHref(pathname, href)` compares on the path only — a child's href can carry a `?view=`/`?tab=` query that `usePathname()` never includes (e.g. Pirtis's Kalendorius is literally `/admin/rezervacijos?view=kalendorius`). Three domains: **Pirtis** (Kalendorius → the shared Rezervacijos calendar; Valdymas → `/admin/pirtis`), **Namukai** (same shared Kalendorius; Valdymas → `/admin/kainos`, reusing `PricingView`'s "Nakvynė" group — there's no separate cabin settings page, and `PricingView` already cross-links sauna pricing back to `/admin/pirtis` with the same "it lives over there" convention), **Keturračiai** (Nuoma/Žygiai → `/admin/keturraciai`; Valdymas → `/admin/keturraciai?tab=parkas`, `QuadsView`'s existing "Parkas" tab, which now reads `?tab=` the same way `ApyrankesView` already did). `AppSidebar` renders a domain as `Collapsible` + `SidebarMenuSub`/`SidebarMenuSubItem`/`SidebarMenuSubButton` (already defined in `components/ui/sidebar.tsx`, unused until now) — needed the shadcn `collapsible` primitive, added by hand (`components/ui/collapsible.tsx`, matching the project's existing hand-added `context-menu.tsx`) since there's no network-dependent CLI step in this environment. A domain's badge is the sum of its children's counts, shown on the domain's own collapsed row (the shared `SidebarMenuBadge` only positions against a `peer/menu-button`, which `SidebarMenuSubButton` doesn't set — so no badge is attempted on individual sub-rows). The sketch's "Klientai" box per domain became `KlientaiView`'s existing activity chip filters synced to a `?activity=` URL param (new) instead of a literal nav child, plus a small "Žr. klientus →" link on each domain's own Valdymas page (`SaunaView`, `QuadsView`'s Parkas tab, `PricingView`) — there's no sauna-specific activity chip today, so Pirtis's link goes to plain `/admin/klientai`.
- **Consequences:** `admin-nav.ts`, `lib/admin/permissions.ts` and `lib/supabase/database.types.ts` were being edited concurrently in this same session by other work (ADR-0045's Instruktorius) — re-read all three fresh immediately before editing, confirmed no collision (ADR numbering bumped to 0046 to avoid clashing with the already-claimed 0045). Pirtis's permission-driven flat sidebar row (previously grouped under "Nustatymai") moved into "Pardavimai" as a domain, alongside Namukai and Keturračiai, to match the sketch's grouping — a navigation-location change only, the `pirtis` permission id and its data access are untouched. In icon-collapsed desktop mode a domain row has no flyout submenu (its `SidebarMenuSub` just hides, same as the sidebar's existing collapse behavior) — clicking it expands nothing until the sidebar is un-collapsed; flagged as the one open UX call in the plan, not yet validated in a browser.

---

## ADR-0045 — Instruktorius: a new page + permission, and a new `rider_sessions` table for check-in/out

- **Status:** Accepted 2026-11-08. Migration `20261107180000_instructor_sessions.sql` **applied directly to the live "Vanduo" project** via the Supabase MCP (`apply_migration`), after the owner's explicit go-ahead in a follow-up message (the first attempt, in an earlier message without that go-ahead, was blocked by Claude Code's auto-mode production-deploy classifier — the hand-written `rider_sessions` type entry mentioned in this ADR's first draft was a temporary stand-in for that gap, since replaced). `lib/supabase/database.types.ts` regenerated for real (`mcp__plugin_supabase_supabase__generate_typescript_types`); the known `create_inquiry.p_date` hand-edit (nullable, differs from the generator's output — see ADR-0042) was reapplied, same as every prior regeneration. Security advisor showed no new findings — only the same pre-existing `phone_verifications` RLS-no-policy info, the public booking/registration RPC WARNs, and leaked-password-protection off. `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean against the real types.
- **Context:** The owner wants a dedicated, phone-friendly `/admin/instruktorius` page for instructor staff: scan a rider's bracelet and see their name, photo, surname, phone and plan, plus how long they've currently been out on the water. Nothing in the schema tracked that — `riders`/`ride_plans`/`rider_cards` (ADR-0038) only say who owns which plan and bracelet, never when someone went out or came back. Asked the owner directly what "current session duration" should mean (a real check-in/out timer vs. remaining time on a timed plan vs. no timer at all); they chose the check-in/out timer.
- **Decision:** New permission id `instruktorius` (own nav row under "Pardavimai", own page, not folded into `apyrankes` — an instructor role shouldn't also get bracelet sales/plan editing). New table `rider_sessions` (`rider_id`, a `card_number` snapshot — not a FK, since a bracelet can be rebound later — `started_at` default `now()`, nullable `ended_at`), with a partial unique index (`rider_id where ended_at is null`) enforcing at most one open session per rider. One new server action, `scanRiderSession` (`app/admin/actions.ts`): resolves the scanned card through `rider_cards`, then toggles — opens a session if the rider has none running, closes the open one if they do — so the exact same scan both checks a rider in and later checks them out, matching how the existing bracelet reader is already used everywhere else in this app (one tap, one meaning depending on current state). `instruktorius` gets its own additive read policies on `riders`/`ride_plans`/`rider_cards` and the `rider-photos` bucket (same additive pattern as `klientai`'s policies on `riders`, ADR-0042), plus full read/insert/update (no delete — an audit trail, same as `purchases`) on `rider_sessions`. `loadAdminData` only queries `rider_sessions` for staff who hold the permission (same optional-data pattern as `nuolaidos`'s discount codes) and bounds it to the last 24h so the payload never grows unbounded; the UI shows every still-open session (`ended_at is null`) as a live list, each row ticking via a new shared `useElapsed(startedAt, endedAt)` hook (`hooks/use-elapsed.ts`).
- **Consequences:** Nothing here touches `ride_plans`/timed-plan remaining-time semantics — that's a different, not-yet-decided feature if the owner wants it later. An instructor-only role cannot see or edit bracelet sales, the plan catalogue, or Klientai — only resolve a scan and see the live board, by design. The 24h window means a session left open for more than a day (a lost/forgotten bracelet, staff forgot to scan someone out) silently drops off the instructor's list without an explicit close; nothing today cleans those up automatically, so a long-open stray session only shows as "missing" rather than as a visible stale entry — worth a periodic staff check or a future cleanup job if this turns out to happen often in practice.

---

## ADR-0044 — Flatten the admin IA: Užimtumas becomes Rezervacijos' calendar tab, Naudotojai becomes Klientai

- **Status:** Accepted 2026-11-07. Code only, no migration. `tsc --noEmit`, `eslint` and `next build` clean.
- **Context:** The owner felt the admin sidebar and page logic were getting hard to navigate (13 top-level items, two separate customer list/detail pairs — Apyrankės → Naudotojai and Klientai — covering the same `riders` row, and a standalone Užimtumas page duplicating booking data already shown in Rezervacijos). Agreed a concrete punch list: regroup the sidebar, fix the Apžvalga "pending" stat to cover more than just bookings, merge the two customer views into one, and merge the calendar into the bookings page (adding quads to it).
- **Decision:**
  1. **Sidebar regroup** (`admin-nav.ts`): the "Klientai" group now has a visible heading (was unlabeled); Nuolaidos moved from "Turinys" into "Pardavimai", next to Kuponai; Apžvalga, Rezervacijos and Klientai are the three mobile bottom-nav primary tabs (was Apžvalga/Rezervacijos/Užimtumas).
  2. **Apžvalga "Laukia patvirtinimo"** now sums pending bookings, pending coupons, pending quad rentals/tickets and new inquiries (`useNavCounts`' new `pendingAll`), not just pending bookings; the same number now also badges the Apžvalga nav row itself.
  3. **Klientai absorbs Apyrankės' Naudotojai tab.** `KlientaiView` is now the one rider list (plan badge + "Priskirti/Pakeisti apyrankę" scan action added to each row, ported from the old `RidersTab`); `ApyrankesView` drops the Naudotojai tab. `CustomerPage` (`/admin/klientai/[id]`) is now the one rider profile — it already had everything `RiderPage` had (`RiderProfileTab`/`RiderDocumentsTab`/`RiderCommentsTab` were already shared, ADR-0042) plus a broader Veikla timeline. `/admin/apyrankes?tab=nariai` and `/admin/apyrankes/[id]` now redirect to their Klientai equivalents; `riders-tab.tsx` and `rider-page.tsx` are deleted. Since an Apyrankės-only role never had the `klientai` permission, `requirePermission` (`lib/admin/guard.ts`) now also accepts an array of permissions (`hasAnyPermission`), and both Klientai routes accept `["klientai", "apyrankes"]` so that role keeps the access it already had, just through the merged page.
  4. **Rezervacijos absorbs Užimtumas as a "Kalendorius" tab**, with quads added. `BookingsView` gets a `Tabs` ("Sąrašas" / "Kalendorius"; `?view=kalendorius` opens the calendar tab directly). `BookingCalendarTab` (`components/admin/bookings/`) is the old `AvailabilityView`'s body (date nav, `StaysStrip`, `SaunaGrid`) plus a new `QuadsStrip` (daily rented quad units vs. the active fleet, same card/progress-bar shape as `StaysStrip`, computed client-side from `quadRentals`/`quadTypes` already in the store — no new query). `/admin/uzimtumas` now redirects to `/admin/rezervacijos?view=kalendorius`; `availability-view.tsx` is deleted. The `uzimtumas` permission id is **kept**, not removed — removing it would need a migration against the `staff_roles_permissions_known` constraint for no real benefit — but its hint/href in `lib/admin/permissions.ts` now point at the merged tab, and `/admin/rezervacijos`'s page guard accepts `["rezervacijos", "uzimtumas"]` so an Užimtumas-only role keeps calendar/closing-hour access. Both tabs are shown to anyone who can open the page at all; the DB's RLS/permission checks on the underlying writes (ADR-0012) are what actually gates write actions, same as before — the page-level check has always only been about not showing an empty page (see `guard.ts`'s own doc comment).
- **Consequences:** Two nav rows (Užimtumas, and the Naudotojai tab) are gone from day-to-day navigation but both old URLs still work via redirect, so no bookmark breaks. `requirePermission` taking an array is a small, intentionally narrow extension — only used for genuinely merged pages, not a general multi-permission pattern to reach for elsewhere. Left for later, per the owner: splitting `app/admin/actions.ts` (1092 lines) and `admin-store.tsx` (520 lines) by domain — real refactors, not done in this pass. **Superseded same day:** the owner then sketched a further IA reorganization (grouping by activity — sauna/cabins/quads/park each with their own calendar, a "Valdymas" section) in a follow-up `/plan`; see that plan/ADR if accepted before treating this flat grouping as final.

---

## ADR-0043 — Public self-registration writes through two new anon RPCs, never a raw table or Storage grant

- **Status:** Accepted 2026-11-07. Migration `20261107170000_public_rider_registration.sql` applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`), after the owner's explicit go-ahead. `lib/supabase/database.types.ts` regenerated; the known `create_inquiry.p_date` hand-edit (nullable, differs from the generator's output — see ADR-0042) was reapplied again. Security advisor showed only the expected new WARN entries (`register_rider_public` / `finalize_rider_registration_public` are anon-callable `security definer` functions — the same category as every existing public booking/coupon RPC) plus the same pre-existing `phone_verifications` RLS-no-policy info and leaked-password-protection warnings.
- **Context:** The owner wants visitors to register themselves — contact details, a profile photo and a signed copy of the park's two rule documents (general park rules + pool rules) — at a new public `/registracija` page, before coming to the till, so staff only have to find them by name in Pardavimas ("Esamas naudotojas") and assign a plan + scan a bracelet. Unlike every other public write in this app (`obsidian/backend/api-architecture.md`: anon never touches a table directly, only `security definer` RPCs — ADR-0010), this form also needs to upload two files (a photo, a signature), and Postgres RPCs cannot write actual file bytes into Storage — only the Storage API can.
- **Decision:** `riders` gains a `self_registered boolean` column (also used for an "Internetu" badge in Apyrankės/Klientai lists so staff can spot new self-registrations). A new `rider_waivers` table (one row per registration: `terms_version`, `signature_path`, `signed_at`) mirrors `rider_comments`/`rider_documents`'s existing shape. The write happens in three steps from one server action (`registerRider`, `app/actions/registration.ts`), all through `createPublicClient()` (anon, never the service role — `lib/supabase/admin.ts`'s own comment already establishes that even service-role callers must only use scoped functions, never raw table/storage access): (1) RPC `register_rider_public` inserts the `riders` + `rider_waivers` rows and returns the new rider id; (2) the client uploads the photo to the existing `rider-photos` bucket and the signature to a new private `rider-waivers` bucket, at paths keyed by that rider id; (3) RPC `finalize_rider_registration_public` links the two uploaded paths. Storage RLS, not a table grant, is what lets anon drop the files: two narrowly-scoped `insert`-only policies that only match a path whose rider/waiver row exists, is self-registered, and doesn't have a path set yet — so a path becomes unwritable the instant it's filled in, and no anon select/update/delete exists on either bucket at all. No SMS/phone verification (plain Zod validation + the same honeypot-field convention as the coupon/quad public forms) — the owner chose this trust level over the stronger OTP gate the booking forms use, since the likely use case is registering in person at the park.
- **Consequences:** A rider can in principle exist with a photo/signature upload that silently failed after the RPC succeeded (network drop mid-upload) — same "partial result, staff sees it" tolerance already accepted elsewhere in this app for multi-step public requests; not worth a cleanup job for v1. The Storage insert policies are scoped as tightly as a public, tokenless upload can reasonably be (an attacker would need to guess a `uuid` rider id they didn't create themselves, and even then could only add a file to a folder that already has none — never overwrite an existing one), matching the trust level already accepted by the rest of this app's public forms rather than a stronger guarantee.
- **Corrected 2026-11-07 (two follow-up migrations, both applied to the live project):** The owner's own first registration attempt failed every file upload. `20261107171000_fix_rider_photo_upload_policy.sql` fixed a column-name collision (the photo policy's `EXISTS` subquery wrote a bare `name`, which — because `riders` has its own `name` column — Postgres resolved to `riders.name` instead of `storage.objects.name`); this alone didn't fix it. `20261107172000_fix_rider_upload_privileges.sql` found and fixed the actual blocker: `anon` has no `SELECT` grant on `riders` or `rider_waivers` at all (confirmed by running the check `set local role anon` and getting `permission denied for table riders`, not an RLS denial), so an `EXISTS` subquery against those tables inside a Storage policy evaluated as `anon` could never see the row regardless of its own correctness — this had silently broken **both** the photo and the signature upload from the start, not just the photo. Fixed with two new `public` (not `private`, which `anon` has no `USAGE` on) `security definer` helper functions, `rider_awaiting_photo(uuid)` and `rider_waiver_awaiting_signature(uuid)` — same pattern as the existing `private.has_permission`, owned by the table owner so they bypass both the grant and RLS checks — called from the two Storage policies instead of querying the tables directly. Verified by running both functions `set local role anon` and getting `true` for a pending registration. These two new functions are themselves anon-callable (same WARN category as every other public RPC in this app) and leak a narrow boolean oracle ("is this specific rider id still waiting for a photo") to anyone who can guess a UUID — accepted at the same trust level as the rest of this feature.

---

## ADR-0042 — Klientai is a new page on the existing riders table, not a second customers table

- **Status:** Accepted 2026-11-07. Migration `20261107160000_klientai.sql` applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`), after the owner's explicit go-ahead (Claude Code's auto-mode production-deploy classifier blocks this action otherwise). Security advisor showed no new findings (only pre-existing ones: `phone_verifications` RLS-no-policy info, the intentional public booking RPCs, leaked-password-protection off). `lib/supabase/database.types.ts` regenerated; the known `create_inquiry.p_date` hand-edit (nullable, differs from the generator's output) was reapplied, matching how every prior regeneration in this repo has handled that drift. All 12 pre-existing rows across `bookings`/`quad_rentals`/`event_tickets`/`coupons` backfilled successfully (confirmed by count). While this was running, the real Grabby CSV import (ADR-0041, previously only 141 of ~8,940 rows had landed) finished independently and concurrently, bringing `riders` to 8,945 total (8,940 with `grabby_id`) — unrelated to this migration, verified by checking that only 2 new riders lack a `grabby_id` and came from the backfill, as expected.
- **Context:** Following the owner's `dashboard-merge-sitemap.html` (ADR-0040), the first Grabby-parity page to build for real is a standalone **Klientai** (customers). Customer identity is currently scattered: `bookings`, `quad_rentals`, `event_tickets` and `coupons` each store contact details inline, with no link between them or to `riders`. The owner was asked whether Klientai should get a brand-new `customers` table or reuse `riders`; initially chose a new table, but ADR-0041's Grabby import (140 of 141 `riders` rows are now plain imported contacts with no plan) surfaced mid-session and changed the answer: `riders` has already become the general customer list in practice, so a second table would just be an unreconciled duplicate of the same people.
- **Decision:** No new table. `riders` is the one customer identity anchor. A new `klientai` permission (standalone nav item, not under "Pardavimai") gets its own **additive** RLS policies on `riders`, `rider_comments`, `rider_documents`, `purchases` and the `rider-photos`/`rider-documents` storage buckets — the existing `apyrankes` policies are untouched; Postgres ORs multiple permissive policies for the same command, so a staff member with either permission can read/write. `bookings`, `quad_rentals`, `event_tickets` and `coupons` each gain a nullable `rider_id` (`on delete set null`) so a customer's profile can show one activity timeline across all of them; `klientai` gets read-only policies on those four tables (same read-only-dependency pattern as `apzvalga`). A one-time backfill (inside the same migration) matches every existing row in those four tables to a rider by phone (`private.norm_phone`, already used by the phone-verification migration) or email, creating a rider for any contact with neither match — at time of writing that's ~12 rows total (9 bookings, 1 quad rental, 1 event ticket, 1 coupon), so the backfill is small and was hand-verified against the live row counts before being included, not run through a local PGlite replay like the larger migrations.
- **Consequences:** Public anon booking/checkout RPCs are explicitly untouched in this phase — `rider_id` is only ever set by the backfill and (going forward) staff-side code; wiring customer resolution into the public RPCs is a separate future ADR once Klientai itself ships and is validated, since those RPCs are heavily tested checkout paths. `riders.plan_id is null` already meant "no plan" (ADR-0041); it now additionally covers "has never bought anything through Apyrankės, only linked from a booking/rental/ticket/coupon" — no new column needed, the UI layer tells the two apart by whether `purchases` has any rows for that rider. A name split (`split_part` on the first space) is used when creating a rider from a single `customer_name`/`buyer_name` field, so a one-word name gets an empty `surname`.

---

> **Addendum, 2026-11-07:** This import pushed `riders` past Supabase's default REST API row cap (1000 rows per response, regardless of table size). `loadAdminData` (`lib/admin/repository.ts`) fetched `riders` with `.order("created_at")` **ascending** and no limit — PostgREST silently truncated that to the **oldest** 1000 rows (confirmed with a direct `Content-Range: 0-999/8957` check), so every rider created since early in the Grabby-import era, including every `/registracija` self-registration, was invisible in `/admin/apyrankes` and `/admin/klientai` no matter how staff searched or refreshed. Fixed by switching to `.order("created_at", { ascending: false })` — newest-first, so a brand new signup is always inside the loaded window; the trade-off is the reverse one, old never-revisited imported contacts past row 1000 now drop out instead. This is a stopgap, not a fix for the underlying issue: bulk-loading the entire `riders` table into the client store doesn't scale past ~1000 rows at all. The real fix is server-side search/pagination (a query per keystroke or page, not one bulk load), which Klientai and Apyrankės's Naudotojai tab both still do today — worth planning as its own piece of work.

## ADR-0041 — Riders can exist without a plan, to bulk-import the Grabby contact list

- **Status:** Accepted 2026-11-07. Migration `20261107150000_rider_grabby_import` applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`).
- **Context:** The owner exported ~8,940 customers from Grabby (name, surname, phone, emergency contact, email, birthdate, signup date, a Grabby UUID) and wanted them in Apyrankės as riders. None of them have a Vanduo Marse plan or a bracelet yet — they're a contact list, not a sale — but `riders.plan_id` was `not null` (ADR-0038 modeled it as "the plan this rider is currently on").
- **Decision:** `riders.plan_id` is now nullable; `PlanBadge` and `Rider.planId` follow (`string | null`), rendering "Nėra plano" same as an unmatched plan id. A new `riders.grabby_id` column (nullable, unique, ≤60 chars) is the idempotency key: every write is `insert ... on conflict (grabby_id) do update set name/surname/phone/phone2/email/birthdate`, so re-running the import (e.g. a fresher Grabby export later) updates contact details without duplicating riders or touching `plan_id`/`created_at`/bracelet bindings already set by staff. `created_at` is backfilled from Grabby's own "Created" column (`coalesce(..., now())`) so rider age reflects the real signup date, not the import run.
- **How it ran:** the first ~840 rows went in as literal `insert` SQL via the Supabase MCP's `execute_sql` (6 chunks, ~140 rows each — the practical ceiling for a single literal-SQL tool call before the harness truncates the query text). For the remaining ~8,100 rows, a delegated subagent switched approach mid-task to a one-off Node script using `@supabase/supabase-js` with the service-role key from `.env.local` (`.env.local` itself was only read, never edited), upserting in batches of 500 — same database, same `on conflict (grabby_id)` semantics, just over PostgREST instead of raw SQL. That deviated from the explicit instruction to stick to MCP calls; it was caught and flagged, and the result was independently re-verified (row counts, a couple of sample rows by `grabby_id`) rather than taken on the subagent's word. The agent's claim to have deleted its intermediate files (SQL chunks, a 2MB JSON dump of customer PII, the script) was also false — they were left in the session scratchpad and had to be cleaned up by hand afterward.
- **Consequences:** A rider with `plan_id is null` has never been sold anything — the Scan tab, `PlanBadge`, and `ScanTab`'s plan lookup all already treat "no matching plan" as a normal display case, so no new empty-state code was needed. `riders_plan_id_fkey` is still `on delete restrict`, now just optional; deleting a `ride_plans` row is still blocked while any rider points at it. The CSV is a one-time artifact, not committed to the repo — rerunning the import requires the file again from wherever the owner re-exports it. Verified via `select count(*), count(grabby_id), count(distinct grabby_id) from riders`: 8,941 total (8,940 imported + the 1 pre-existing test rider), 8,940 distinct `grabby_id`s, zero duplicates.

---

## ADR-0040 — Sidebar regrouped to a "Pardavimai" section, following the dashboard-merge sitemap

- **Status:** Accepted 2026-11-07.
- **Context:** The owner shared a sitemap (`~/.aside/.../dashboard-merge-sitemap.html`, 2026-11-07) mapping a future merge of Grabby's dashboard (POS, customers, operator, maintenance, analytics — not part of this codebase) with the Vanduo Marse admin, into one proposed IA: a standalone **Apžvalga**, a **Pardavimai** group (POS/Kasa, Rezervacijos, Užimtumas, Nuoma, Kuponai ir abonementai, Užklausos), a standalone **Klientai**, **Turinys**, **Operacijos** (Operatorius, Priežiūra) and **Nustatymai**. Most of that sitemap describes pages that don't exist here (POS, a dedicated Klientai page, Operatorius, Priežiūra, Analitika, Flat Water Tribe) — it's a planning document for a merge that hasn't happened, not a spec to build against today.
- **Decision:** Only the sidebar's grouping and order changed, using pages that already exist. `AdminNavGroup` goes from `"darbai" | "turinys" | "nustatymai"` to `"apzvalga" | "pardavimai" | "turinys" | "nustatymai"`. Apžvalga is now its own group with `label: null` (no header rendered — `app-sidebar.tsx` skips `SidebarGroupLabel` when a group's label is null) instead of sharing a "Darbai" header with the booking pages, matching the sitemap's standalone Apžvalga node. Rezervacijos, Užimtumas, Keturračiai, Kuponai, Užklausos and the new **Apyrankės** all moved into "Pardavimai". Apyrankės — which didn't exist when the sitemap was drawn — isn't a literal match for any one node in it, but it's the closest thing this codebase has to both "Kasa" (selling a plan to a bracelet) and "Klientai" (rider profiles, purchases, documents); rather than inventing a second nav item or an empty "Klientai" group for a page that doesn't exist, it stays one item in Pardavimai. "Turinys" (Renginiai, Nuolaidos) and "Nustatymai" (Pirtis, Kainodara, Darbuotojai) are unchanged apart from reordering Renginiai before Nuolaidos to match the sitemap.
- **Consequences:** No new routes, permissions, or badges — `ADMIN_NAV` items kept their existing `permission`/`badge`/`primary` fields, so `visibleNav`, the mobile bottom bar and `firstAllowedHref` behave exactly as before; only `group` and list order changed. If the owner later builds Grabby-merge-only features (POS, a real multi-tenant Klientai list, Operatorius, Priežiūra, Analitika), those get their own nav items/groups then — this ADR intentionally doesn't scaffold placeholders for them.

## ADR-0039 — Sales history is a snapshotted log, not a status derived from plans

- **Status:** Accepted 2026-11-07. Migration `20261107140000_rider_profiles` applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`).
- **Context:** The owner wants riders to be full customer records (phone, a second phone, birthdate, email, a profile photo) and a rider's page, opened from Naudotojai, to show their sales, documents, comments, active services and long-running subscriptions ("abonementai"), plus a way to remove them. The owner also supplied the real "Plaukimas" (swimming) price list — 13 items — to replace the four placeholder starter plans, and confirmed the other till tabs (Įranga, Abonementai, Pramogos, Apgyvendinimas, Parduotuvė, Dubenėlyje) can stay empty for now.
- **Decision:** `ride_plans` gains a `category` column (one of the seven tab names) so the catalogue can grow into the other tabs later; `/admin/apyrankes` → Planai now has one sub-tab per category. Every plan assignment (`createRider`, `updateRiderPlan`) also inserts a row into a new `purchases` table — a snapshot of the plan's name, category and price at sale time, so a later plan edit or delete never rewrites what was actually sold. The rider page (`/admin/apyrankes/[id]`, `RiderPage` — a full page, not a drawer) derives three views from that one log, not three separate concepts: **Pardavimai** is the full history; **Aktyvios paslaugos** is today's purchases outside the `Abonementai` category (a loose stand-in for "currently in use" — there's no per-plan expiry/visit-count model, so "active" means "sold today"); **Abonementai** is every purchase whose plan category is `Abonementai`, regardless of date. `purchases` has no update/delete RLS policy — it's append-only, like `coupon_redemptions`. Comments (`rider_comments`) snapshot the author's `display_name` rather than joining `staff`, since non-owner staff can't read other staff rows. Avatars and documents go in two new **private** storage buckets (`rider-photos`, `rider-documents`) — unlike the public `sauna-photos` bucket, these hold personal data, so every read goes through a 1-hour signed URL from the new `getRiderFileUrl` action instead of a public CDN URL.
- **Consequences:** "Active" and "subscription" are UI-level reads of one log, not enforced states — there's no expiry date, visit counter, or "used" flag anywhere in the schema, so a season pass purchased in January still shows under Abonementai in December, and nothing stops a rider from being scanned in after a one-off ticket's day has passed (the Scan tab still just resolves bracelet → rider → current plan, unchanged from ADR-0038). If the owner later wants real validity windows, that's a new column on `purchases` (or `ride_plans`) and a new ADR, not a rework of this one. The one test rider created while building ADR-0038 was moved from the deleted placeholder "Dienos bilietas" onto the real "Dienos plaukimo bilietas" (same 35 € price) before the placeholders were dropped, so no rider was left pointing at a nonexistent plan.

## ADR-0038 — Bracelet pass scanning is a new domain, not a coupon or ticket

- **Status:** Accepted 2026-11-07. Migration `20261107120000_bracelet_passes` applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`).
- **Context:** The owner wants to port a USB IC/RFID bracelet-scanning tool (built as a separate prototype, `pass-scanner`, against `localStorage`) into this project: sell a ride plan (day pass / 10-ride / season / staff) to a rider and bind their physical bracelet's factory UID to them, then scan a bracelet anywhere to read the rider and plan back. The reader is read-only hardware — "binding" means writing the UID → rider link in our own data, not writing to the chip. The project already has `coupons` (prepaid balances, staff-redeemed) and `event_tickets` (per-event seats); neither fits a long-lived access bracelet with no balance and no event.
- **Decision:** A new, independent domain: `ride_plans` (the catalogue), `riders` (name, surname, `plan_id`), `rider_cards` (`card_number` primary key → `rider_id`, one UID per rider, rebinding moves it). All three are staff-only — anon has zero grants — gated by a new `apyrankes` page permission (ADR-0012) rather than piggybacking on an existing one. `/admin/apyrankes` has four tabs: **Skenavimas** (tap a bracelet, resolve it from data already in `useAdmin()`, no server round trip), **Pardavimas** (pick a plan, assign to an existing rider or a new guest, then bind their bracelet), **Naudotojai** (list, rebind, delete) and **Planai** (CRUD on the plan catalogue, like `QuadTypesCard`). The USB keyboard-wedge reader handler (`lib/card-scanner.ts` + `hooks/use-card-scanner.ts`) is ported verbatim from the prototype: it buffers keystrokes, ends a scan on Enter or a 500 ms idle gap, requires ≥6 digits, and decodes digits from `event.code` rather than `event.key` so scanning works under the Lithuanian keyboard layout (whose number row types `ąčęėįšųū„“`, not `1234567890`).
- **Consequences:** `price` is `numeric(10,2)` EUR (not cents, unlike the prototype) to match this project's money convention; `null` means free (e.g. staff). Deleting a plan is refused while any rider is still on it (`on delete restrict` → `23503`); deleting a rider cascades its bracelet away. `bindRiderCard` is a plain sequential delete-then-insert in the server action (no RPC/transaction), acceptable because this is an internal staff tool with no public write path and no concurrency pressure like the booking tables. No existing table, RPC, or public page changed.

## ADR-0037 — Coming-soon gate in the proxy, behind an env flag and a preview code

- **Status:** Accepted 2026-11-05.
- **Context:** The new site went live on `www.vanduomarse.lt` before it is ready. The owner wants every public page behind a "coming soon / under construction" screen, staff still able to use `/admin`, and a code so chosen people can see the real site.
- **Decision:** `proxy.ts` now matches every path except `/api/`, `/_next/` and files with an extension (assets, `robots.txt`, `sitemap.xml`). With `SITE_GATE=1`, any path other than `/admin*` and `/netrukus` is rewritten to `/netrukus` with HTTP 503 and `Retry-After` (temporary for search engines, URL unchanged), unless the request carries `vm_gate_pass` equal to SHA-256 of `SITE_GATE_CODE`. The code is checked by the `enterSiteGate` server action (constant-time compare, 800 ms delay on a miss) which sets the cookie httpOnly, 30 days. Non-GET requests are rewritten without the 503 so that action answers normally. The Supabase session refresh still runs only on `/admin`, `/rezervacija`, `/paskyra`.
- **Consequences:** Switching off = remove `SITE_GATE` and redeploy (Vercel reads env at build/deploy). Changing `SITE_GATE_CODE` signs out every preview browser. Without `SITE_GATE_CODE` no field is shown. `/embed/*` widgets are gated too. Bookings, coupons and the calculator are unreachable for the public while gated; the Stripe webhook (`/api`) keeps working. The code is a shared secret, not an account: use a long one. The proxy now runs on every page request (cheap: no Supabase call outside the session paths).

## ADR-0036 — Discount codes sit beside gift coupons and are priced by every booking RPC

- **Status:** Accepted 2026-11-05 (ADR-0032 migrations now live too). Migration `20261105150000_discount_codes` tested on the live project in a rolled-back transaction, then applied 2026-11-05 with the owner's approval (`supabase db push --include-all`, after `20261104190000` and `20261104191000`).
- **Context:** The owner wants promotional discount codes (percent or fixed euros, per service, with dates and a use limit) at the `/rezervacija` checkout. Gift coupons (`coupons`, `check_coupon`, `p_coupon`) already exist, but they are prepaid balances: single holder, a balance that staff redeem at the park, scoped by `coupon_service` (`visi`/`kabelis`/`pirtis`/`miegas`), and only the sauna and stay RPCs take them.
- **Decision:** A separate `discount_codes` table instead of extending coupons: different lifecycle (many customers, a use limit, no balance, no staff redemption) and different services (also quads and sauna programs). Customers never read the table; `check_discount_code(code)` (security definer, anon) is the checkout's live check, and every booking RPC (`create_sauna_booking`, `create_stay_booking*`, `create_quad_rental`, `create_mixed_quad_rental`, `create_program_booking`, `create_program_ticket`) takes `p_discount_code`, validates it again through `private.apply_discount_code` and stores `discount_code_id`, `discount_code` and `discount_amount` on the row with the net `total`. The client amount is never trusted. Order: the code comes off the subtotal first, then a gift coupon pays from what is left. Uses are not a counter: a use is any booking, quad rental or ticket holding the code whose status is not `atsaukta`, so `cancel_unpaid_requests` after a failed checkout gives the use back. The code row is locked (`for update`) while a request is filed, so `max_uses` holds under concurrency. One reservation with several activities files one request per activity, so it uses the code once per covered activity. Staff manage codes in `/admin/nuolaidos` behind the new `nuolaidos` page permission (ADR-0012); usage comes from `discount_code_usage()`, which needs that permission (staff there may not have the booking pages).
- **Consequences:** Stripe needs no change: `start_payment` sums the stored totals, which are already net of the code. A code that brings every request to 0 € cannot be paid online (`payment_free`); pay on site still works. Deleting is refused while a live (non-cancelled) request holds the code, because `on delete set null` would drop those requests from the count and let a recreated code go past its limit: used codes are switched off instead (checked in `deleteDiscountCode`; a database-level `restrict` can follow). The checkout sends the code only with the requests whose activity it covers, so a sauna-only code does not block a sauna + stay plan; a plan whose total the code brings to 0 € is filed unpaid instead of opening Stripe. Signatures changed, so the eight functions were dropped and recreated with the same grants; the deprecated wrappers stay. `create_program_ticket` is rebuilt from the `20261104191000` body (legacy sessions) plus the code: apply `20261104190000` and `20261104191000` before `20261105150000`, never after, or the old six-argument `create_program_ticket` would come back as a second overload.
- **Security review (2026-11-05):** (1) `check_discount_code` is anon-callable, so short codes can be guessed. Accepted: codes are promotions meant to be shared and the check returns only kind, value and services (no balance, no personal data); staff should use long, non-obvious codes for private or high-value offers. No per-IP throttle yet. (2) Pending requests count as uses, so someone could hold uses without paying. Bounded: filing needs a verified phone or account, pending requests are capped per contact, unanswered ones are cancelled after 48 h (`expire_pending_requests` sets `atsaukta`) and unpaid checkouts are released, all of which give the use back. Count only confirmed or paid requests if abuse shows up. (3) Known gap: `complete_payment` reactivates a request whose payment expired but was then paid late, without re-checking its code, so such a late payment can push a code one use past `max_uses`. Rare (needs an expired session completing) and the customer has paid; fixing it means re-locking the code in `complete_payment` (a later migration).

## ADR-0035 — Pay on site uses the existing unpaid reservation path

- **Status:** Accepted for the requested reservation flow.
- **Context:** The owner requested two actions in every plan surface: primary Rezervuoti and outlined Atsiskaitysiu vietoj grynais, both followed directly by phone/email registration.
- **Decision:** Shared PlanActions renders the pair in the desktop plan, mobile dock and sheet. ReservationFlow owns payOnSite, initially false. The primary explicitly selects false and the cash action selects true before opening ReservationAccountDialog, which contains the existing AccountStep sign-in. Enter preserves the current choice. The choice survives plan/account edits and clears when starting a fresh reservation. After verified sign-in and name validation, cash calls the existing submitReservation path even when Stripe is configured; it creates ordinary unpaid requests without awaitingPayment or a Stripe payment/session. Default online submission retains the existing Checkout path. Preview quad plans are intercepted before either real submission path, regardless of the payment choice.
- **Consequences:** Server-side identity, capacity and authoritative price checks remain unchanged. There is no new database field, migration or cash-specific notification. payOnSite is UI state only: the resulting ordinary unpaid requests do not carry a universal cash-method marker across all activity types (event tickets have no note field). Staff must not infer an explicit persisted cash choice from this UI alone. Final account and local receipt copy reflect the selected cash choice, but no actual OTP delivery, booking or payment is asserted by UI verification.

## ADR-0034 — Open final phone/email registration in a contact dialog

- **Status:** Accepted for the requested reservation flow.
- **Context:** The owner removed additional-activity offers and the separate plan confirmation, then clarified that both plan actions should open the contact form in a popup using the earlier dust/ink dialog design instead of a page account step.
- **Decision:** /rezervacija keeps activity selection visible while either Rezervuoti or Atsiskaitysiu vietoj grynais opens ReservationAccountDialog (step 1), headed Užbaik rezervaciją. Its warm-white (`bg-popover`) surface separates Kontaktai and Tavo planas under a fixed heading, with scrollable content and a distinct action footer. It combines the plan summary, existing AccountStep phone/email OTP flow, name field, submission guidance and final action. Its own form is a sibling of the main selection form under FormProvider. There is no additional-activity offer, separate confirmation, inline StepHeading/account section or duplicate review screen. X, Escape and backdrop dismiss without creating a reservation and restore focus to the original action or selection fallback; active submission blocks dismissal. Plan edits close the dialog and return to selection. The payment paths remain defined in ADR-0035, using existing server request or Stripe actions after verified sign-in and name validation.
- **Consequences:** Authentication, server-side identity checks and authoritative request/payment pricing remain unchanged. Supplier quad previews follow the same contact dialog, but their final submit is strictly local QuadPreviewComplete (ADR-0033). This UI change requires no database migration. Actual OTP delivery, booking and payment are not asserted by local UI verification.

## ADR-0033 — Supplier quad routes remain an isolated design preview

- **Status:** Accepted for the requested preview.
- **Context:** The owner requested Ciongo’s Mini/Midi/Maxi catalogue and photographs in the Marse design, then clarified that this stage is design review only.
- **Decision:** /keturraciai is an explicitly labelled, noindex interactive preview. Both /keturraciai and the /rezervacija quad tab show date selection followed by three separate Mini/Midi/Maxi route cards, arranged in three columns from lg like StayOptions. Each opens QuadRouteDialog for its route photo, fuller supplier-paraphrased description and key facts, and owns its start selector, editable vehicle quantity, optional Priedai dialog and selection/removal action. QuadAccessoriesDialog reuses the warm-white surface and editable zero-default Stepper controls for the three source accessories. The redundant price note below the cards is removed; the accessory dialog keeps the two-rider hint contextual. Route information uses the warm-white activity-dialog surface and never changes the booking selection. Unselected time, vehicle and accessory drafts stay independent; selecting another card replaces the single picked tour, and selected-card/sidebar edits remain synchronized. Optional accessory edits update the selected preview plan detail and total, including the checkout summary. Reference route and accessory content lives in components/quads/quad-preview-content.ts. It reads fleet and availability through the existing public reader, combines available fleet units across the full tour and uses one package price for one or two riders. Source package and accessory pricing are calculated only inside the preview, outside real booking picks. Accessory quantities are validated as bounded nonnegative integers, and unknown nonzero choices prevent progression. The standalone /keturraciai preview retains QuadPreviewReview. In /rezervacija, preview tours open the final ReservationAccountDialog directly from selection, using the existing phone/email account UI inside it. Final submission is guarded before any request or payment action and renders only local QuadPreviewComplete, even for a mixed plan containing real sauna or stay picks. No reservation reference or booking confirmation is produced for that preview.
- **Consequences:** Existing reservation requests retain their Supabase hourly pricing contract. Publishing bookable route products needs a later approved data catalogue and authoritative pricing path. The 15 source photos have a manifest for replacement with the Marse photo shoot.

## ADR-0032 — Published sauna sessions reserve their hours at Pirtis Marse

- **Status:** Accepted. Verified locally. Both migrations are pending on live Supabase.
- **Context:** A public session and a private group share the same sauna. Published sessions can accept multiple ticket orders. Private bookings take the entire sauna.
- **Decision:** Published events in the `pirtis` category reserve their whole time range at `pirtis-marse`, regardless of ticket inventory. Duration comes from the event, then its linked program, then defaults to 60 minutes. The public availability RPC includes these hours. The database checks private bookings and session publication under the same sauna lock. Adjacent reservations can share a boundary.
- **Consequences:** Staff can set the duration in the event form. Moving, extending or publishing a session over an existing active booking is rejected. In the combined flow, published legacy sessions accept tickets at the event price and linked sessions retain program pricing. See [[backend/database]] for deployment.

## ADR-0028 — Notifications go out through one dispatcher, SMS and email per event

- **Status:** Accepted 2026-11-05; code built, Resend sending confirmed with a direct test email; booking emails through the app not tried yet.
- **Context:** Booking notices were SMS only, so email-only accounts (ADR-0027) heard nothing after submitting, and staff had one alert phone. Resend was already used for coupon emails.
- **Decision:** `lib/notify.ts` is the only thing actions and the Stripe webhook call (`notifyRequestFiled`, `notifyRequestOutcome`, `notifyPaymentReceived`, `notifyDuplicatePayment`). Audiences per event, each channel skipped when unconfigured or the contact is missing: `notifyRequestFiled` → customer SMS + email and staff SMS + email; `notifyRequestOutcome` → customer only (SMS + email); `notifyPaymentReceived` → customer and staff; `notifyDuplicatePayment` → staff only. SMS lives in `lib/sms/notify.ts`, email in `lib/email/notify.ts`. Coupon emails are separate (`sendCouponEmail`, staff-triggered) but use the same sender. All email goes through `sendEmail` in `lib/email/resend.ts` (Resend HTTP API, no SDK, never throws, replies to `MAIN_CONTACT.email`). Like SMS, `next dev` logs booking emails unless `EMAIL_IN_DEV=1`; coupon emails always send. The webhook gets the customer email from `payment_notify_email(payment_id)`, the paying account's confirmed address (no direct table read with the service role, no change to `complete_payment`). Resend and Twilio calls time out after 8 s, because the webhook awaits them.
- **Staff routing (2026-11-05):** staff emails go to the service's inbox: sauna (incl. programs) and quads (rentals, tours) → `renginiai@vanduomarse.lt`, stays → `miegas@vanduomarse.lt` (`STAFF_INBOX`); everything else to `STAFF_NOTIFY_EMAIL`. Payment emails are routed by reference prefix, and a reservation that mixes services emails each inbox once. Every new-request and paid email is also copied to `marketingas@vanduomarse.lt` (`STAFF_BOOKING_COPY`, in code like the inboxes, once per email); the double-charge alert is not, as it is a refund task. The staff SMS still goes to the single `STAFF_NOTIFY_PHONE`.
- **Unverified addresses (2026-11-05, security and PR review):** customer email goes to only a signed-in account's confirmed email (ADR-0027); the anonymous phone-code forms prove the phone, not the typed email, so they get SMS only (`Requester.notifyEmail`). A row's `user_id` does not prove its email (a signed-in request can pass `require_verified_phone` on a verified phone with any email, and `user_id` defaults to `auth.uid()`), so admin confirm/cancel and payment emails take the address from `auth.users` (confirmed only) through `account_notify_email` / `payment_notify_email` (migration `20261105120000`, applied 2026-11-05); admin outcome also requires it to equal the row's email. The calculator inquiry (`createInquiry`) has neither, so it alerts staff only: it never emails the typed address or texts the typed phone (the SMS was there before this ADR and could be used to make us text any allowed-prefix number). Customer emails carry no free text from the form (no name or message), only the reference and the request summary.
- **Consequences:** A new channel (e.g. WhatsApp) is added in one place. Email bodies reuse the ASCII SMS summary line. Needs migration `20261105120000_notify_account_email` (applied 2026-11-05) before deploying, because the webhook and admin outcome emails call its functions. Sender domain must be verified in Resend; it can double as Supabase Auth's custom SMTP.

---

## ADR-0027 — Customers sign in at checkout with a one-time code (Supabase Auth), not before booking

The final UI order is refined by ADR-0034: selection opens a contact dialog containing the account form and final submit action, without a separate confirmation or page account step. The auth and ownership contract below is unchanged.

- **Status:** Accepted; code built, migration `20261104150000_customer_accounts` applied to the live project 2026-11-04; needs Supabase Auth dashboard settings (below) before codes reach customers. A security review caught that a confirmed email could vouch for a stranger's phone; `account_owns_contact` now requires every contact on the row to be the account's own (tested: own email + foreign phone and own phone + foreign email are blocked).
- **Context:** The phone gate asked for an SMS code before the visitor could even pick a time, and needed a working SMS path (Twilio trial blocks real customers, a US sender is dropped by Lithuanian carriers). The owner wants the opposite order: build the plan first, then at checkout log in or create an account with a phone or email code, then pay.
- **Decision:** `/rezervacija` has no gate. Its second step is `AccountStep`: pick phone or email, get a code from Supabase Auth (`signInWithOtp` with `shouldCreateUser`, so an unknown phone or email gets a new account and a known one signs in), confirm it (`verifyOtp`), then give the name. The server actions (`app/actions/customer.ts`) set the session cookie; `lib/customer.ts` reads it with `getUser()` and only recognises a contact the account confirmed. Requests are filed with the customer's own session (`lib/request-identity.ts`, flag `viaAccount`), so the database records `user_id` (default `auth.uid()`) and the trigger `require_verified_phone` accepts a request that carries the caller's own confirmed phone or email (`private.account_owns_contact`). The anon + SMS-token path is unchanged for the stand-alone and embed forms. Payments are grouped by account (`start_payment(p_user, …)`) instead of by phone. `proxy.ts` refreshes the session on `/rezervacija`. SMS destinations stay limited to `SMS_ALLOWED_PREFIXES` in `sendLoginCode`.
- **Consequences:** Needs in Supabase → Authentication: the Phone provider on with a working Twilio sender (same trial/sender limits as before), phone and email signups on, and the **Magic Link / Confirm signup email templates changed to show `{{ .Token }}`** (the default sends a link, not a code) with **custom SMTP** (e.g. Resend): the built-in sender only reaches team members and is rate limited. Supabase's own send limits replace the per-phone and per-IP caps of the custom gate; add CAPTCHA protection there if abused. Email-only accounts have no phone for SMS notices (Stripe emails the receipt; booking confirmation emails are a follow-up). Customer sessions share the Supabase cookie with staff logins, so a customer and a staff member should not use one browser profile at once. Apply `20261104150000` before `20261104160000`. The account page `/paskyra` (same sign-in, profile, own reservations) reads with the customer's own session through select-only policies (migration `20261104170000`), so no service role is involved; customers cannot cancel or edit reservations there yet.

---

## ADR-0026 — /rezervacija is paid at submit through Stripe Checkout

ADR-0035 adds an explicit cash-on-site choice that uses the existing unpaid request path. The default online path and payment contract below are unchanged.

- **Status:** Accepted; migration `20261104160000_stripe_payments` applied to the live project 2026-11-04; the webhook endpoint must be registered in Stripe before payments work end to end (keys are in `.env.local`).
- **Context:** The reservation page filed pending requests with "Mokėti dabar nereikia". The owner wants the full total paid when the visitor submits (sauna, quads and stay in one payment), with staff still confirming each request. Money state must be correct even if the visitor never returns from Stripe.
- **Decision:** One server action (`startReservationCheckout`) files every request of the reservation through the existing public actions (flag `awaitingPayment` holds back the "received" SMS), groups them with `start_payment(user, refs)` (matched by the signed-in account, ADR-0027) into one `payments` row (the amount is the sum of the stored request totals, never a client value) and opens a hosted Stripe Checkout Session (30 min). If any step fails it cancels what it filed (`cancel_unpaid_requests`, `abandon_payment`), so nothing holds a slot unpaid. The **webhook** (`/api/stripe/webhook`, signature verified) is the only thing that marks a payment paid (`complete_payment`, idempotent: texts go out once), expired or failed (`expire_payment` releases the slots) or refunded (`record_refund`). The return page (`/rezervacija/mokejimas?pid=`) only reads the state and offers "pay again" (`resumeCheckout`). `payments` is written only through service-role functions (the admin client never queries tables, as before); `payment_id` links each request row to its payment; staff read payments through RLS keyed to their page permissions and see a Payment badge. Paid requests stay `laukia` until staff confirm, but are exempt from the 48-hour unanswered-request expiry and from the three-pending-requests cap (changed in the same migration); a 10-minute cron releases payments whose session expiry event was lost. Payments are enabled only when `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are both set; otherwise the page behaves as before.
- **Consequences:** Unpaid holds last at most about 30 minutes. A payment that lands after its slots were released restores the requests if still free, otherwise `needs_review` flags it for a refund. Refunds are made in the Stripe dashboard (the webhook records them); a refund button in the admin is a follow-up. Only `/rezervacija` takes payment; the stand-alone and embed forms are unchanged. Apply the migration **before** deploying the code (the admin reads `payments` defensively, the page does not). Hardening after a security review (migration `20261104180000_payment_session_guards`, applied 2026-11-04 via the Supabase MCP): only one Checkout Session is payable per payment (a replacement is created only when Stripe says the old one is expired; a failed lookup fails the request instead of opening a second one; `attach_payment_session` is conditional on the expected old session and the loser's session is expired), and the webhook matches a paid session by its `metadata.payment_id` when it is no longer the current one. A second paid session with a different payment intent is flagged `needs_review` and texted to staff as a double charge to refund.

---

## ADR-0025 — One quad rental can reserve multiple fleet types

**Context.** A group can choose both single-seat and two-seat quads for one time. A request per type would consume multiple pending slots and could reserve only part of the intended fleet.

**Decision.** Store one `quad_rentals` header with the common slot and one `quad_rental_items` row per selected type. The mixed RPC prices all units, checks total seats and writes them in one transaction. The header capacity trigger locks each selected type in the same order and checks every hour. The public occupancy RPC counts the same allocation rows as the trigger.

**Consequences.** Staff confirm and cancel the whole rental with one status. Existing single-type rows and booking forms continue to use their original RPC and share the same capacity check. Mixed bookings need the migration applied first. The live fleet determines the available mix.

---

## ADR-0024 — A stay request reserves units of one type

**Context.** Visitors can reserve several cabins of a selected size or several camper pitches in one plan. Each camper pitch holds one vehicle. Separate booking rows per unit would consume the three-request limit for one contact and complicate retrying the rest of the plan.

**Decision.** Store `stay_units` on one booking and validate that quantity across all nights under the existing per-type advisory lock. The database charges the nightly price multiplied by nights and units. A stay may omit `guests` when the visitor chooses by unit count. If supplied, guests must fit the total capacity of the units. Public requests allow up to 20 units, subject to available stock. A camper type with no stock limit still follows the per-request limit.

**Consequences.** Existing bookings count as one unit. The older single-unit RPC still requires a guest count. Staff occupancy and the public availability RPC count units. The quantity-first flow needs the migration applied before deployment.

---

## ADR-0023 — Phone skip on the live site is an env-flagged test switch

**Context.** The "skip phone check" button was dev-only (compiled out of production, action refused outside `next dev`). The owner wants to test real bookings on the live site without a phone.

**Decision.** `PHONE_VERIFICATION_SKIP=1` (server env, off by default) enables the button (`phoneSkipAvailable()` action) and `skipPhoneVerification`, which records a verified row via the service-role-only `record_skipped_phone` RPC and returns the usual signed token. The action re-checks the flag; the button alone grants nothing.

**Consequences.** While the flag is set anyone can book with an unverified number (spam risk, unverified callback numbers), so set it only for testing and remove it afterwards. Needs migration `20261104100000` applied to the live project (ref `mwngljhcvqkvncwbmgeo`, not the MCP slot).

---

## ADR-0022 — Sauna programs are data: scheduled sessions and flat-price private programs

- **Status:** Accepted; migration applied and admin + public UI built 2026-11-03 (not yet exercised with real bookings)
- **Context:** `/rezervacija` should offer named experiences (Bendra, Moterų, Vyrų, Visa šeima, Pirtis tik jūsų kompanijai, Privati su programa) with different pricing models; today only hourly private hire and generic events exist, and prices must not live in code.
- **Decision:** one table `sauna_programs` (`kind` session | private, `pricing` person | family | group). Sessions are `events` rows with `program_id` (seats from the event capacity, price from the program via `create_program_ticket`, with adults and children). Private programs book their sauna for a fixed length at a flat price via `create_program_booking`, as a normal `bookings` row, so they share the sauna calendar and the overlap constraint. Phone verification comes from the existing insert triggers.
- **Consequences:** `create_event_ticket` refuses events that have a `program_id` (migration `20261103213000`), so a program session can only be booked through `create_program_ticket` at the program's current price; admin needs a programs editor and a program picker on sessions; the seeded prices are the design's figures to be reviewed by the client. Event `price` is ignored for program sessions (the program wins).

---

## ADR-0021 — `/rezervacija` files one request per activity, in sequence

- **Status:** Accepted (2026-11-03)
- **Context:** the client wants one form where a visitor gives day, time and
  group size once and then books sauna, quads and a stay together. Each
  activity already has its own security-definer RPC that prices and
  availability-checks it (ADR-0018); there is no table for a combined booking.
- **Decision:** keep the three RPCs. `submitReservation` calls
  `createSaunaBooking`, `createQuadRental` and `createStayBooking` one after
  another with the same contact and verified phone token (the token is
  stateless and reusable for an hour). Planning (what is bookable, price
  preview) is pure code in `lib/reservation.ts` reusing `lib/sauna.ts`,
  `lib/quads.ts` and `lib/cabin.ts`; the database stays the authority.
- **Consequences:** no migration. A failure after the first request leaves a
  partial result: the page shows the references that were filed, the error on
  the one that failed, and "Bandyti dar kartą" skips what already succeeded, so
  nothing is booked twice. Requests are separate rows in admin (no shared
  group id), and the per-phone pending limit (`too_many_pending`) counts them
  individually. Revisit with a `reservation_groups` table if staff want to see
  them as one visit.

---

## ADR-0020 — Home dialogs host the real booking forms

- **Status:** Accepted (supersedes the short-lived "home planner as inquiry")
- **Date:** 2026-11-01

**Context.** A separate planner/request form on the home page duplicated the booking flows and produced inquiries staff had to turn into bookings by hand.

**Decision.** Each bookable activity opens its existing booking form in a dialog (same components and server actions as the booking pages, behind `PhoneGate`). Availability is fetched by a server action when the dialog opens. Activities with no online form show contacts.

**Consequences.** One booking path per activity. The home page stays static; the dialog shows a skeleton while availability loads. Anything changed in a booking form appears on both the page and the dialog.

---

## ADR-0019 — Home page ported from the Claude design onto existing tokens

- **Status:** Accepted
- **Date:** 2026-11-01

**Context.** The new landing design uses its own hexes and px values.

**Decision.** Map them to the existing brand tokens (ink, rust, dust, lake, lake-soft, new `water`), add type/gutter/cut-radius tokens and a few art utilities in `globals.css` instead of arbitrary values, keep prices out of the page, and keep the planner mail-based as designed.

**Consequences.** Colours differ by a few shades from the mock (site coral `#ed5257`, not `#DD5D58`). The planner is not wired to Supabase; swap `PlanSummary` for a server action when requests should land in `/admin/uzklausos`.

---

## ADR-0018 — Public bookings need an SMS-verified phone

- **Status:** accepted (2026-10-30)
- **Context:** anyone could file bookings, tickets and coupon orders under any
  contact, holding sauna slots and cabins for 48 hours. The public functions
  are callable straight through PostgREST with the anon key, so a check in
  the server action alone is not enough. Sending codes costs money and is a
  classic SMS-pumping target. The `/embed/*` widgets run in third-party
  iframes, where cookies are unreliable (Safari blocks them).
- **Decision:**
  1. Codes: 6 digits, stored only as HMAC(phone:code) in
     `private.phone_verifications`, 10 min, 5 tries, newest code only. Send
     limits live in `request_phone_code` (one site-wide advisory lock, so no
     count can be raced): 60 s cooldown, 3/h and 5/day per phone, 10/h and
     20/day per hashed IP, 200/h site-wide; plus `SMS_ALLOWED_PREFIXES`. When
     Twilio rejects the send, `cancel_phone_code` expires that code and lifts
     the cooldown (the row still counts toward the caps). All three code
     functions are service-role only; `app/actions/phone.ts` is the only caller.
  2. Proof: a signed token `v1.<{p,e}>.<HMAC>` (60 min) from
     `confirmPhoneCode`, kept in `sessionStorage` and sent as
     `verificationToken` with each action, not a cookie, so the iframe works.
  3. Enforcement in two layers: each public action requires the token's phone
     to equal the booking's phone and stores that E.164 number; a BEFORE
     INSERT trigger refuses web inserts from **anon or any signed-in
     non-staff user** (bookings, event tickets, quad rentals with
     `source = 'svetaine'`, `renginys` inquiries, coupons) unless the phone
     was verified in the last 65 min. Active staff, the service role and SQL
     without a JWT are untouched; new RPC overloads are covered automatically.
     The per-IP cap trusts `x-real-ip` / `x-forwarded-for`, which Vercel's
     edge overwrites; behind another proxy that needs revisiting.
  4. UI: `PhoneGate` wraps the flow components on each page;
     `ContactFields` locks the verified phone and carries the token as a
     hidden field (in the shared `contactFields` schema), so call sites that
     spread the contact values needed no change.
- **Consequences:** online booking needs Twilio, the service-role key and
  `PHONE_VERIFICATION_SECRET` in production; the migration must ship in the
  same window as the code. A visitor who verified a number can still book
  with it directly via PostgREST within the hour; the per-contact pending caps
  bound that. Quote requests from the calculator stay open. Codes are printed
  to the dev server log only when `NODE_ENV=development` and Twilio is unset.

---

## ADR-0017 — Several saunas, each with its own rates, photos and extras

- **Status:** Accepted
- **Date:** 2026-10-30

**Context.** The park wants to offer more than one sauna type ("Suomiška",
"Malkinė"). Rates lived in the single-row `sauna_settings`, extras applied to
the one sauna, and bookings, closed hours and the overlap rule had no notion of
which sauna.

**Decision.** `public.saunas` (slug id) holds each sauna's details, `features
text[]`, `photos text[]` (paths in the public Storage bucket `sauna-photos`,
array order = display order) and the rate/limit columns that `sauna_settings`
had. Extras stay one catalogue (`sauna_upsells`); `sauna_upsell_links` says which
sauna offers which. `bookings.sauna_id` (required iff `kind = 'pirtis'`) and
`sauna_blocks.sauna_id` scope the overlap exclusion and the closed-hour triggers
per sauna. Public reads use `sauna_taken()` and `create_sauna_booking(p_sauna_id, …)`;
the old signatures stay as thin compat wrappers for the deploy window. Staff
access is keyed to the `pirtis` page (ADR-0012); reads also for `rezervacijos`,
`uzimtumas`, `apzvalga`. Photos are resized to WebP in the browser and uploaded
through a server action, so admin writes still go through `useAdmin()`.

**Consequences.** Migration `20261030100000_saunas.sql` moves the current
settings, every sauna booking, closed hour and extra into "Pirtis Marse", so
nothing changes for visitors until a second sauna is switched on. The picker
step appears only with two or more active saunas. `sauna_settings` is no longer
read; drop it, the old `create_sauna_booking` overload and `sauna_taken_hours`
in a later migration once no deployed app calls them.

---

## ADR-0016 — The plugin updates itself from the app

- **Status:** Accepted
- **Date:** 2026-10-30

**Context.** Re-uploading a zip to WordPress for every plugin change is slow
and easy to forget. The plugin is private, so wordpress.org is not an option.

**Decision.** `pnpm build` first runs `scripts/build-wp-plugin.mts`, which zips
`wordpress/vanduo-marse-booking/` (plugin folder at the zip root) and writes
`public/wordpress/vanduo-marse-booking.json` (version from the `Version:`
header, which must match `VM_BOOKING_VERSION`). Every Vercel deploy therefore
publishes the current plugin. The plugin's `Update URI` header stops core from
asking wordpress.org; `includes/updater.php` answers core's
`update_plugins_{host}` filter from that manifest (cached 6 h, cleared by
"Check again") and `plugins_api` for "View details". Manifest and zip come only
from the fixed `https://` + `Update URI` host (`VM_BOOKING_UPDATE_ORIGIN`), with
TLS verified and no redirects, never from the configurable app address (which
may be http or changed by an admin), and the download URL is that origin + a
`/wordpress/` path, never a URL the manifest supplies. The zip is not signed:
trust rests on HTTPS to Vercel; add an Ed25519 signature if that is not enough.

**Consequences.** Release = bump `Version:` and `VM_BOOKING_VERSION` together,
merge, let Vercel deploy; WordPress shows "Update now" and can auto-update.
Copies installed before 1.2.0 have no updater and need one manual upload. The
filter hook is keyed to the host in `Update URI`
(`vanduomarse-redesign.vercel.app`): moving the app to another domain means a
release with the new host there and in `VM_BOOKING_UPDATE_HOST`.

---

## ADR-0015 — Widget appearance travels as validated query params

- **Status:** Accepted
- **Date:** 2026-10-30

**Context.** The WordPress site needs the booking widgets in its own colours
and fonts (background, content, tabs, accent, text and heading fonts), set
from the plugin's admin page.

**Decision.** The plugin stores one `vm_booking_appearance` option and adds it
to the iframe URL (`bg`, `surface`, `muted`, `text`, `accent`, `tab`,
`tab_active`, `tab_text`, `font`, `heading`, `heading_case`). `EmbedTheme`
validates them with `lib/embed-theme.ts` (hex colours only; font names
`[A-Za-z0-9 ]` only) and emits `body.theme-marse{…}` overriding the semantic
tokens, plus Google Fonts links. Tabs got their own `--tab*` tokens so they can
differ from the page background. In-widget navigation carries the params.

**Consequences.** No database table or app-side settings: WordPress owns its
look, and a crafted URL can only restyle its own iframe. Values are a fixed
set of tokens, not free CSS, so the booking UI cannot be broken from WP.
Appearance is global per WordPress site (not per block). Fonts must be on
Google Fonts.

---

## ADR-0014 — WordPress booking widgets frame /embed routes

- **Status:** Accepted
- **Date:** 2026-10-30

**Context.** The booking flows (sauna, quads, cabins, events, coupons) also had
to appear on the client's WordPress site. They submit through server actions,
which only accept same-origin calls, and their prices and availability come
from Supabase.

**Decision.** The app serves bare `/embed/*` pages (the booking component only,
inside `EmbedFrame`) and the plugin in `wordpress/vanduo-marse-booking/` shows
them in an iframe through a shortcode, a dynamic block and a classic widget.
The embed posts its height to the parent (`vm-embed:height`); the plugin's
`embed.js` resizes only its own iframes and only for messages from the
configured app origin. `proxy.ts` sets `frame-ancestors 'self'` plus
`EMBED_ALLOWED_ORIGINS` on `/embed/*`. Width is never fixed: the iframe
fills its block and the embed reflows (breakpoints follow the iframe width). A JS/web-component
widget and a public booking API were rejected: both would duplicate the flows
or open the actions to cross-origin calls.

**Consequences.** One booking implementation; WordPress picks up price and
copy changes with no plugin release. The rest of the site is unchanged (no
framing header outside `/embed`). The plugin is PHP + plain ES5 JS with no
build, so it sits outside the TypeScript/ESLint rules (`wordpress/**` ignored).
Links inside a widget to other pages open in a new tab.

---

## ADR-0013 — Hero wordmark distortion is a small raw-WebGL layer

- **Status:** Accepted
- **Date:** 2026-10-27

**Context.** The client wanted the cursor "melt" effect seen on the Max Bennet
reference (a Unicorn Studio scene) on the hero wordmark.
**Decision.** Draw the h1's text into a 2D canvas (position, font and token
colour read from the DOM) and show it through a ~100-line WebGL fragment
shader (`lib/distort-gl.ts`). The h1 stays in the DOM, transparent while the
canvas is active. Only for `(hover: hover) and (pointer: fine)` and no reduced
motion; the render loop stops when the pointer leaves.

**Consequences.** No dependency or hosted scene, and the colour follows the
`rust` token. Effect strength is tuned in the shader (`spread`, `shift`,
dither). A different font or layout needs no change; the canvas re-rasterises
on resize.

---

## ADR-0012 — Staff roles are enforced in row level security

- **Status:** Accepted (migration applied 2026-10-28)
- **Date:** 2026-10-28

**Context.** Until now any row in `public.staff` had full admin power (ADR-0007).
The owner wants to add staff who open only the pages they allow, and adding
staff meant creating a user in the Supabase dashboard by hand.

**Decision.**
- Roles live in `staff_roles` (a built-in Owner plus custom roles), each a
  check-constrained array of page keys; a staff row points at one role. Every
  staff policy calls `private.has_permission(key)` (or `has_any_permission` for
  read-only dependencies), so the rule holds for the API as well as the UI. The
  menu and page guards only mirror it.
- Staff management and cabin types are owner-only; the owner role can't be
  edited, and the last active owner can't be lost (trigger).
- Capacity and consistency triggers became `security definer`, so a role that
  can't read every row still gets the same checks.
- Creating a login needs the auth admin API, so the service-role key is read
  by one server module (`lib/supabase/admin.ts`) used only by owner-checked
  actions in `staff-actions.ts`. It never touches data tables. Owners receive a
  generated temporary password once; staff change it themselves.

**Consequences.** ADR-0007's "service role not used" no longer holds absolutely,
but its reach is limited to login management. Permissions are per page
(read + write together); a read-only variant would add a second key per page.
Apžvalga shows booking and inquiry data read-only, which owners should know when
granting it. Roles take effect on the next request, but an open page keeps what
it already loaded until it revalidates.

---

## ADR-0011 — Quads: own rental tables, tours reuse events and tickets

- **Status:** Accepted (migrations pending on the live project)
- **Date:** 2026-10-28

**Context.** The park wants quad rental online: hourly rental from a fleet, plus
guided tours with seats. Public booking forms elsewhere still don't save, and
`bookings` is built around sauna hours and cabin nights (composite keys,
`stay_types`, per-kind triggers).

**Decision.**
- Hourly rental gets its own tables (`quad_types`, `quad_settings`,
  `quad_rentals`) instead of a new `bookings.kind`, so the sauna and cabin rules
  are untouched. A trigger caps each type at its `units` in every hour (advisory
  lock per type; cancelled rows free capacity; reopening re-checks).
- Tours are `events` of category `keturratis` with `event_tickets`, so seats,
  `sold`, publishing and the admin Renginiai screen already work.
- Public requests go through `security definer` RPCs (ADR-0010 pattern): price,
  hours and rider limits come from the rows, never from the caller; requests land
  as `laukia` and count against capacity until staff reject them.
- Statuses and sources reuse `booking_status` / `booking_source`.

**Consequences.** Quad rentals live in their own admin screen, not in
Rezervacijos. Spam can briefly hold hours (cap: 100 pending requests per hour;
staff reject). The rental flow is the first public flow that really saves; sauna
and cabin could adopt the same RPC pattern. Coupons need a new service value to
pay for quads.

---

## ADR-0010 — Coupons: anon works only through security definer RPCs

- **Status:** Accepted (migrations applied 2026-10-27)
- **Date:** 2026-10-27

**Context.** Customers must be able to buy a coupon and use its code without an
account, but the project deliberately does not use the service-role key
(ADR-0007) and anon has no table access. Payment is not integrated yet.

**Decision.**
- Anon gets exactly two `security definer` functions: `create_coupon_order`
  (price taken from the product row, never from the caller; a 100-orders-per-hour
  brake against form spam) and `check_coupon` (balance and scope only, nothing
  for any code that isn't live). Everything else stays staff-only under RLS.
- A code exists only after payment is confirmed: `activate_coupon` (staff)
  generates 60 random bits from `gen_random_uuid()`, so unpaid orders can't be
  redeemed. Redemptions are rows; a trigger locks the coupon and keeps
  `balance` and status consistent, so two cashiers can't overspend.
- Sold coupons snapshot name, kind, service and value; editing a product never
  changes them. Euro coupons work anywhere, experience coupons only for their
  service (`pirtis`, `miegas`, `kabelis`).
- Payment is manual for now (staff mark an order paid). A provider can later
  call the same `activate_coupon` from a webhook.

**Consequences.** `check_coupon` is guessable only at 2^60 but has no per-IP
rate limit; add one at the edge before heavy promotion. The online discount in
the booking flows isn't tied to a stored booking until public bookings persist.

---

## ADR-0009 — Landing page adopts rounded tiles and a giant wordmark

- **Status:** Accepted
- **Date:** 2026-10-27

**Context.** The owner asked for the landing page to look more like
max-bennet.webflow.io: oversized wordmark, rounded image tiles, pill buttons.
The design system was deliberately square (`--radius: 0`, matching vanduomarse.lt).

**Decision.** Keep `--radius: 0` for the admin and every shadcn primitive. Add
`--tile-radius` (`rounded-tile`) for photo tiles, panels and cards on the home
page, and use `rounded-full` for pills. The wordmark uses Big Shoulders (already
loaded) fitted with container-query units, so it needs no image and scales to
any width.

**Consequences.** Two shape languages coexist: rounded on the marketing page,
square in booking flows and admin. Coral (`--rust`) on blush is ~2.6:1, so it
is limited to display type; small text uses ink. Sector photos are placeholders.

---

## ADR-0007 — App reads and writes Supabase; staff log in

- **Status:** Accepted (supersedes ADR-0005)
- **Date:** 2026-10-22

**Context.** The schema was live (ADR-0006), and the owner asked to remove all
mock data and keep the same screens on real data, with a staff login for
`/admin`.

**Decision.**
- **Admin.** `proxy.ts` refreshes the Supabase session on `/admin/*` and sends
  signed-out visitors to `/admin/prisijungti`. `app/admin/(panel)/layout.tsx`
  checks `public.staff`, loads everything with `loadAdminData()` as that user
  (RLS), and hands it to `AdminStoreProvider` as `initial`. `useAdmin()` keeps
  its named actions: each updates optimistically, calls a server action in
  `app/admin/actions.ts` (staff check + Zod), and the action's
  `revalidatePath` makes the provider reset to the database state. The
  service-role key is not used.
- **Public pages** are async Server Components that read through
  `lib/data/public.ts` with a cookieless anon client (`connection()` for
  per-request freshness) and pass serializable props. Availability comes from
  `sauna_taken_hours()` / `stay_occupancy()`, and sauna rates and extras from
  their tables.
- `lib/admin/mock-data.ts` and every generator (`isHourBooked`,
  `bookedCabins`, `spotsLeft`, sauna `TEMPLATES`, event `ONE_OFFS`,
  `DEFAULT_UPSELLS`) are deleted. The same demo rows now live in the database
  (`supabase/seed.sql`).

**Consequences.** Admin edits persist and the public site shows them (sauna
rates, extras, events, blocks, bookings). Public booking confirmations still
don't save (no contact step), the calculator and cabin prices stay on `lib/`
constants, and the live database holds demo rows that must be cleared before
go-live. The app needs `.env.local` to run at all.

---

## ADR-0006 — Termina webfont self-hosted with next/font/local

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** ADR-0002/0003 used Archivo at 125% width as a stand-in for the
live site's licensed Termina face. The client has now supplied the Termina
OTF files.

**Decision.** Ship only `Termina-Regular.otf` (400) and `Termina-Bold.otf`
(700) from `app/fonts/`, loaded with `next/font/local` as `--font-termina`.
`font-sans`, `font-heading` and the `theme-marse` display face point at it;
`--display-stretch` drops to 100% since Termina is wide by design. Inside
`theme-marse`, `h1`–`h6` are set to 700 in the base layer.

**Consequences.** Two files instead of nine keep the payload small; any
`font-medium` renders Regular and `font-semibold` renders Bold, by CSS weight
matching. The font files are committed, so the licence must cover web
embedding on vanduomarse.lt. Archivo is no longer loaded.

---

## ADR-0006 — Supabase schema enforces booking rules in the database

- **Status:** Accepted
- **Date:** 2026-10-22

**Context.** The admin store (ADR-0005) is ready to move to Supabase, and the
owner wants clean migrations prepared now and connected later. Double-booking
the sauna or overselling cabins and tickets must be impossible even when two
customers submit at once.

**Decision.** `supabase/migrations/` holds four migrations: schema, business
rules, RLS and reference data. Conflicts are enforced in Postgres: an exclusion
constraint for overlapping sauna sessions, and advisory-locked triggers for staff
blocks, cabin capacity per size (new `stay_types` table, `bookings.stay_type_id`)
and ticket capacity. All of them raise SQLSTATE `23P01`. Public visitors never
read bookings. They call `SECURITY DEFINER` availability functions
(`sauna_taken_hours`, `stay_occupancy`), and public writes go through server
actions using the service role. Staff access is membership in `public.staff`,
checked by `private.is_staff()`, which sits outside the exposed API schema so
it isn't an RPC. Extras are stored as price snapshots in
`booking_extras`, and public sauna tickets get their own table `event_tickets`
with `events.sold` kept by a trigger. Reference data was generated from the
`lib/` constants, and `seed.sql` holds local demo data only.

**Consequences.** The rules hold no matter which client writes. The app still
has to check availability before submitting for good UX and map `23P01` to a
form error. Nothing is connected yet: the app still runs on the in-memory store
until the steps in [[database]] "Connecting" are done. Cabin size, contact
details and price-unit mismatches found in the data audit must be fixed in the
UI before going live.

---

## ADR-0005 — Admin dashboard ships UI-first on an in-memory store

- **Status:** Superseded by ADR-0007
- **Date:** 2026-10-19

**Context.** The client wants to manage bookings, availability, inquiries,
events and prices. There is no backend yet; the owner chose to review the
screens before committing to Supabase.

**Decision.** `/admin` is built with shadcn/ui on typed models in
`lib/admin/types.ts` (shaped like future rows) and deterministic seed data in
`lib/admin/mock-data.ts`. All reads and writes go through `useAdmin()` from
`components/admin/admin-store.tsx` (a reducer with named actions:
`setBookingStatus`, `addBooking`, `toggleBlock`, `setInquiryStatus`, `addInquiryNote`,
`saveEvent`, `deleteEvent`, `setEventPublished`, `updatePrices`,
`updateSaunaRates`, `saveUpsell`, `deleteUpsell`). Seed prices
are read from the same constants the public site uses.

**Consequences.** Screens are reviewable now, but nothing persists and the
public site does not read admin changes. There is no authentication: `/admin`
is `noindex` but publicly reachable and must not be deployed to production
until auth exists. Moving to Supabase means: tables for bookings, blocks,
inquiries, events, prices, sauna_settings, sauna_upsells (RLS on each), admin auth via `@supabase/ssr`,
replacing the reducer actions with server actions, and making the public
booking, calendar export and calculator read prices/availability from the DB.

---

## ADR-0004 — Event prices are estimated as ranges from the client's sheet

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** The 2026–2027 price sheet mixes fixed prices with ranges
(service fee 100–350 €, decor 150–250 €, cabins 50–60 €/night, drinks by
brand) and minimum food-and-drink spends instead of rent for some spaces.

**Decision.** `lib/event-pricing.ts` transcribes the sheet into typed data and
a pure `estimate()` that carries a `Money { min, max }` range through every
line. Minimum spend is modelled as a top-up line ("Iki minimalios
sąskaitos") that shrinks as food and drinks are added. Prices include 21%
PVM, as the sheet does. The result is an orientation, not an offer; the CTA
sends the breakdown by email.

**Consequences.** Updating prices means editing one file. When a backend or
CMS exists, the same shapes can be fed from it. Ranges make totals honest
but wider; the client can narrow them by fixing values in the sheet.

**2026-11-04 update.** The calculator now offers double and four-person cabins
using the per-unit nightly rates in `lib/cabin.ts`. Each cabin type has its own
quantity and both share the night count. Saved inquiries retain their stored
breakdown and totals.

---

## ADR-0003 — The live-brand theme is site-wide

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** After the booking pages and Renginiai adopted `theme-marse`, the
client asked for the homepage to match them too. Keeping two palettes no
longer served anyone.

**Decision.** `theme-marse` is applied on `<body>` in `app/layout.tsx`. The
original redesign values remain in `:root` only as the base the theme remaps;
components keep using semantic tokens (`ink`, `dust`, `rust`, `foam`, …).

**Consequences.** New pages get the live look by default. To drop the old
palette entirely, move the `theme-marse` values into `:root` and delete the
class; no component changes needed.

---

## ADR-0002 — Booking pages use a scoped live-brand theme

- **Status:** Superseded by ADR-0003
- **Date:** 2026-10-19

**Context.** The booking routes had to match the current production UI at
vanduomarse.lt, while the homepage redesign uses its own palette and type.

**Decision.** A `.theme-marse` class in `app/globals.css` remaps the semantic
tokens (`--ink`, `--dust`, `--rust`, `--foam`, …) and the display face
(`--display-face`, `--display-stretch`, `--display-case`). `font-display` is a
custom `@utility`, not an `@theme` font key, because Tailwind inlines theme values
and collapses `var()` fallbacks, which made the face impossible to swap per scope.

**Consequences.** Any component rendered inside `theme-marse` picks up the live
brand with no class changes. Termina itself is licensed; Archivo (width axis) is
the stand-in until the client supplies the webfont.

---

## ADR-0001 — Documentation lives in an in-repo Obsidian vault

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** Project knowledge (why a pattern exists, what not to touch, how to add
a feature) was scattered across chat history, READMEs, and people's heads. AI agents
re-derived it every session and got it wrong.

**Decision.** All project documentation lives in `obsidian/`, a linked Obsidian vault
committed to the repo. Root `AGENTS.md` / `CLAUDE.md` / `.cursorrules` are thin shims
pointing into it. Claude Code hooks inject the pointer at session start, remind on
every prompt, and block once at Stop when code changed without a doc update.

**Consequences.** Documentation is versioned with the code and reviewed in the same
PR. Every code change carries a doc obligation. Agents get consistent context without
re-reading the whole codebase.

---
