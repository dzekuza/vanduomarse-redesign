---
tags: [meta, decision]
updated: 2026-11-05
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0028 — Notifications go out through one dispatcher, SMS and email per event

- **Status:** Accepted 2026-11-05; code built, Resend sending confirmed with a direct test email; booking emails through the app not tried yet.
- **Context:** Booking notices were SMS only, so email-only accounts (ADR-0027) heard nothing after submitting, and staff had one alert phone. Resend was already used for coupon emails.
- **Decision:** `lib/notify.ts` is the only thing actions and the Stripe webhook call (`notifyRequestFiled`, `notifyRequestOutcome`, `notifyPaymentReceived`, `notifyDuplicatePayment`). Audiences per event, each channel skipped when unconfigured or the contact is missing: `notifyRequestFiled` → customer SMS + email and staff SMS + email; `notifyRequestOutcome` → customer only (SMS + email); `notifyPaymentReceived` → customer and staff; `notifyDuplicatePayment` → staff only. SMS lives in `lib/sms/notify.ts`, email in `lib/email/notify.ts`. Coupon emails are separate (`sendCouponEmail`, staff-triggered) but use the same sender. All email goes through `sendEmail` in `lib/email/resend.ts` (Resend HTTP API, no SDK, never throws, replies to `MAIN_CONTACT.email`). Like SMS, `next dev` logs booking emails unless `EMAIL_IN_DEV=1`; coupon emails always send. The webhook gets the customer email from `payment_notify_email(payment_id)`, the paying account's confirmed address (no direct table read with the service role, no change to `complete_payment`). Resend and Twilio calls time out after 8 s, because the webhook awaits them.
- **Staff routing (2026-11-05):** staff emails go to the service's inbox: sauna (incl. programs) and quads (rentals, tours) → `renginiai@vanduomarse.lt`, stays → `miegas@vanduomarse.lt` (`STAFF_INBOX`); everything else to `STAFF_NOTIFY_EMAIL`. Payment emails are routed by reference prefix, and a reservation that mixes services emails each inbox once. The staff SMS still goes to the single `STAFF_NOTIFY_PHONE`.
- **Unverified addresses (2026-11-05, security and PR review):** customer email goes to only a signed-in account's confirmed email (ADR-0027); the anonymous phone-code forms prove the phone, not the typed email, so they get SMS only (`Requester.notifyEmail`). A row's `user_id` does not prove its email (a signed-in request can pass `require_verified_phone` on a verified phone with any email, and `user_id` defaults to `auth.uid()`), so admin confirm/cancel and payment emails take the address from `auth.users` (confirmed only) through `account_notify_email` / `payment_notify_email` (migration `20261105120000`, applied 2026-11-05); admin outcome also requires it to equal the row's email. The calculator inquiry (`createInquiry`) has neither, so it alerts staff only: it never emails the typed address or texts the typed phone (the SMS was there before this ADR and could be used to make us text any allowed-prefix number). Customer emails carry no free text from the form (no name or message), only the reference and the request summary.
- **Consequences:** A new channel (e.g. WhatsApp) is added in one place. Email bodies reuse the ASCII SMS summary line. No migration. Sender domain must be verified in Resend; it can double as Supabase Auth's custom SMTP.

---

## ADR-0027 — Customers sign in at checkout with a one-time code (Supabase Auth), not before booking

- **Status:** Accepted; code built, migration `20261104150000_customer_accounts` applied to the live project 2026-11-04; needs Supabase Auth dashboard settings (below) before codes reach customers. A security review caught that a confirmed email could vouch for a stranger's phone; `account_owns_contact` now requires every contact on the row to be the account's own (tested: own email + foreign phone and own phone + foreign email are blocked).
- **Context:** The phone gate asked for an SMS code before the visitor could even pick a time, and needed a working SMS path (Twilio trial blocks real customers, a US sender is dropped by Lithuanian carriers). The owner wants the opposite order: build the plan first, then at checkout log in or create an account with a phone or email code, then pay.
- **Decision:** `/rezervacija` has no gate. Its second step is `AccountStep`: pick phone or email, get a code from Supabase Auth (`signInWithOtp` with `shouldCreateUser`, so an unknown phone or email gets a new account and a known one signs in), confirm it (`verifyOtp`), then give the name. The server actions (`app/actions/customer.ts`) set the session cookie; `lib/customer.ts` reads it with `getUser()` and only recognises a contact the account confirmed. Requests are filed with the customer's own session (`lib/request-identity.ts`, flag `viaAccount`), so the database records `user_id` (default `auth.uid()`) and the trigger `require_verified_phone` accepts a request that carries the caller's own confirmed phone or email (`private.account_owns_contact`). The anon + SMS-token path is unchanged for the stand-alone and embed forms. Payments are grouped by account (`start_payment(p_user, …)`) instead of by phone. `proxy.ts` refreshes the session on `/rezervacija`. SMS destinations stay limited to `SMS_ALLOWED_PREFIXES` in `sendLoginCode`.
- **Consequences:** Needs in Supabase → Authentication: the Phone provider on with a working Twilio sender (same trial/sender limits as before), phone and email signups on, and the **Magic Link / Confirm signup email templates changed to show `{{ .Token }}`** (the default sends a link, not a code) with **custom SMTP** (e.g. Resend): the built-in sender only reaches team members and is rate limited. Supabase's own send limits replace the per-phone and per-IP caps of the custom gate; add CAPTCHA protection there if abused. Email-only accounts have no phone for SMS notices (Stripe emails the receipt; booking confirmation emails are a follow-up). Customer sessions share the Supabase cookie with staff logins, so a customer and a staff member should not use one browser profile at once. Apply `20261104150000` before `20261104160000`. The account page `/paskyra` (same sign-in, profile, own reservations) reads with the customer's own session through select-only policies (migration `20261104170000`), so no service role is involved; customers cannot cancel or edit reservations there yet.

---

## ADR-0026 — /rezervacija is paid at submit through Stripe Checkout

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
