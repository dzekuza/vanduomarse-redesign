---
tags: [meta, decision]
updated: 2026-10-22
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

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
