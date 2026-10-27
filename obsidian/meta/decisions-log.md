---
tags: [meta, decision]
updated: 2026-10-27
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0012 — Staff roles are enforced in row level security

- **Status:** Accepted (migration pending on the live project)
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
