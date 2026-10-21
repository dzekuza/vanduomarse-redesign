---
tags: [backend, wip]
updated: 2026-10-22
---

# Database

Supabase Postgres. Migrations are written and checked but **not applied or
connected yet** (ADR-0006): the app still runs on the in-memory admin store
(ADR-0005). See "Connecting" below for what's left to do.

## Rules

- **RLS on every table** — no exceptions, including join and lookup tables.
- **Never modify an applied migration.** A schema change is always a new migration.
- Server-side auth uses `@supabase/ssr`; never the browser client on the server.
- The service-role key is server-only and never reaches the client bundle.
- Regenerate types after a schema change and commit them.
- Enum labels match the TypeScript unions exactly (`'pirtis'`, `'Erdvės'`, …).
  Columns are snake_case, app models camelCase; map at the repository edge.
- Dates are local park days (`date`), times of day are `time`, money is
  `numeric(10,2)` EUR incl. 21% PVM.

## Layout

```
supabase/
  config.toml                         ← `supabase init` (project_id vanduomarse-redesign)
  migrations/
    20261022120000_init_schema.sql    ← enums, tables, checks, indexes, updated_at
    20261022120100_business_rules.sql ← references, conflict triggers, availability RPCs
    20261022120200_rls.sql            ← is_staff(), RLS + policies, materialize_sauna_events()
    20261022120300_reference_data.sql ← settings, upsells, stay types, templates, price list
  seed.sql                            ← DEMO data, local `supabase db reset` only
```

`20261022120300_reference_data.sql` and `seed.sql` were generated from the
`lib/` constants and `lib/admin/mock-data.ts` (one-off script, not kept in the
repo). After connecting, the database is the source of truth for prices.

## Schema

| Table | Mirrors | Notes | RLS |
|-------|---------|-------|-----|
| `staff` | — | `user_id` → `auth.users`. Membership = admin access | staff read; insert by service role |
| `sauna_settings` | `SaunaRates` | Singleton (`id = true`); same cross-field checks as `rates-schema.ts` | public read; staff update |
| `sauna_upsells` | `Upsell` | Slug id (`pirtininkas`, `vantos`, …) | anon reads `active`; staff all |
| `stay_types` | `CABIN_SIZES` + camper | `namelis-2` (8 units), `namelis-4` (6), `kemperis` (units null = unlimited) | public read; staff write |
| `bookings` | `Booking` | Customer columns inline; `stay_type_id` for stays (new: cabin size); `reference` auto `PM-`/`MM-` | staff only |
| `booking_extras` | `Booking.extras` | Snapshot of name, unit, price, qty, line total | staff only |
| `sauna_blocks` | `Block` | unique (`date`, `hour`) | staff only (public via RPC) |
| `inquiries` + `inquiry_notes` | `Inquiry` | `estimate_min/max` both null or both set; `calculator_input jsonb` | staff only |
| `sauna_event_templates` | `lib/sauna-events.ts` templates | weekday, start, duration, price/person, capacity | staff only |
| `events` | `ManagedEvent` | `start_time` (`time`), `duration_minutes`, `sold` kept by trigger, `template_id` + `date` unique | anon reads `published`; staff all |
| `event_tickets` | — (new) | Public sauna-session tickets, `PR-` reference | staff only |
| `price_items` | `PriceItem` | Column `"group"` is quoted (reserved word) | public read; staff write |

### Rules the database enforces (SQLSTATE `23P01` on conflict)

- No two live sauna sessions overlap (`exclude using gist`, needs `btree_gist`).
- A live sauna session can't cover a staff-closed hour, and staff can't close a booked hour.
- Stays never exceed `stay_types.units` on any night (advisory-locked trigger).
- Event tickets never exceed `events.capacity`; `events.sold` = sum of live tickets.
- Cancelled rows (`atsaukta`) never block anything.
- A booking's `stay_type_id` must match its `kind` (composite FK).

Map `23P01` to a form error with `setError` (the trigger `hint` says which:
`sauna_blocked`, `sauna_booked`, `stay_full`, `event_full`).

### Functions

| Function | Who | Purpose |
|----------|-----|---------|
| `sauna_taken_hours(from, to)` | anon, authenticated | Booked + closed sauna hours, no customer data |
| `stay_occupancy(from, to)` | anon, authenticated | Nights taken vs units per stay type per day |
| `is_staff()` | authenticated | Used by every staff policy |
| `materialize_sauna_events(from, days)` | staff | Creates events from active templates; idempotent |

Both availability functions cap the range at 370 days.

## Migrations

| File | Date | What it does |
|------|------|--------------|
| `20261022120000_init_schema.sql` | 2026-10-22 | Enums, all tables, checks, indexes, `updated_at` triggers |
| `20261022120100_business_rules.sql` | 2026-10-22 | Reference sequences, overlap/capacity triggers, `sold` sync, availability RPCs |
| `20261022120200_rls.sql` | 2026-10-22 | `is_staff()`, RLS on every table, policies, `materialize_sauna_events()` |
| `20261022120300_reference_data.sql` | 2026-10-22 | Sauna settings, 3 upsells, 3 stay types, 3 sauna templates, 39 price items |

Verified on 2026-10-22 against PGlite (Postgres 17) with a stub `auth` schema:
all migrations and the seed apply cleanly, and 32 checks pass (overlaps,
blocks, cabin capacity, ticket capacity, `sold` sync, anon/non-staff/staff RLS,
idempotent materialisation). They have not run on real Supabase yet. Run
`supabase db reset` locally (needs Docker) before the first push.

## Data audit (2026-10-22): mismatches to settle before connecting

1. **Bookings have no cabin size.** `Booking` has no size, so admin occupancy
   lumps all 14 cabins into one pool, and the manual-booking form allows 4
   guests for any cabin. The schema adds `stay_type_id`. The admin form and
   `occupancy.ts` need a size picker or per-size counts.
2. **Cabin price units disagree.** The price list and calculator charge
   "Nameliai 50–60 €/asm./naktis" (per guest), but the cabin booking charges
   50 € / 60 € per cabin per night. For 15 guests and 1 night that's
   750–900 € in the calculator against about 240 € through booking. Ask the client.
3. **Pirtininkas costs 100 € or 200 €.** The sheet says 100 € on the sauna rows and 200 € in the contract terms (already noted in `lib/sauna.ts`). Seeded at 100 €.
4. **The public flows collect no contact details.** Sauna, cabin and ticket
   bookings ask for no name, phone or email, and the calculator inquiry is a
   `mailto:`. The DB requires a name plus an email or phone, so each flow needs
   a contact step.
5. **Public availability is fake.** It comes from hash-based pseudo-random
   occupancy (`isHourBooked`, `bookedCabins`, `spotsLeft`) that ignores the
   admin store. Replace it with `sauna_taken_hours` and `stay_occupancy`,
   and use `events.sold` for spots left.
6. **The admin price list is display-only.** The calculator and booking read
   `lib/` constants, not `price_items`. Wire them up, or keep `/admin/kainos`
   read-only.
7. **Extra names don't match.** The demo uses "Vantos × n" while the upsell
   is called "Beržinė vanta". The DB stores a structured snapshot, so the app
   should render extras from `booking_extras` instead of free strings.
8. **Manual bookings store an empty email as `""`.** It's stored as `null` in the DB.
9. **`ManagedEvent` has no duration.** Sauna sessions carry one in
   `duration_minutes`, and the `time` column comes back as `HH:MM:SS`, so trim it when mapping.

## Connecting (later)

1. Create the Supabase project. Add `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to
   `.env.local` (names already in `.env.example`).
2. `supabase link --project-ref <ref>`, then `supabase db push`. The demo `seed.sql` isn't pushed.
3. Create the first staff user in Auth, then `insert into public.staff (user_id, display_name) values (…)`.
4. `supabase gen types typescript --linked > lib/supabase/database.types.ts` and commit it.
5. Add `@supabase/ssr` clients (`lib/supabase/server.ts`, `client.ts`), protect `/admin` with login + `is_staff()`, and swap the reducer actions in `admin-store.tsx` for server actions (see [[api-architecture]]).
6. Fix the data-audit items above.

## Related

[[api-architecture]] · [[environment-variables]] · [[decisions-log]]
