---
tags: [backend, wip]
updated: 2026-10-22
---

# Database

Supabase Postgres, project **Vanduo** (`mwngljhcvqkvncwbmgeo`, eu-west-1).
All migrations are **applied**, and the **app reads and writes it** (ADR-0007):
public pages through `lib/data/public.ts`, `/admin` through staff login and
`app/admin/actions.ts`.

> [!warning] Demo data in the live project
> `supabase/seed.sql` (fake customers: 64 bookings, 7 inquiries, 12 ticket
> sales, plus 6 one-off events and 90 days of sauna sessions) was loaded into
> "Vanduo" on 2026-10-22 so the dashboard looks like before. Before go-live:
> `delete from bookings; delete from inquiries; delete from event_tickets;
> delete from sauna_blocks;` (extras and notes cascade), and review `events`.

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
    20261021230415_init_schema.sql            ← enums, tables, checks, indexes, updated_at
    20261021230446_business_rules.sql         ← references, conflict triggers, availability RPCs
    20261021230515_rls.sql                    ← is_staff(), RLS + policies, materialize_sauna_events()
    20261021230538_reference_data.sql         ← settings, upsells, stay types, templates, price list
    20261021230629_harden_function_grants.sql ← is_staff() → private schema, RPC grants, FK index
  seed.sql                                    ← DEMO data, local `supabase db reset` only
lib/supabase/database.types.ts                ← generated from the live project
```

File names match the versions recorded in the remote project (the MCP stamps
its own version on apply), so `supabase db push` sees them as already applied.
`…_reference_data.sql` and `seed.sql` were generated from the
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
| `private.is_staff()` | authenticated | Used by every staff policy. Lives in the non-exposed `private` schema, so it isn't an RPC |
| `materialize_sauna_events(from, days)` | staff | Creates events from active templates; idempotent |

Both availability functions cap the range at 370 days. Supabase grants
EXECUTE on new `public` functions to `anon`/`authenticated` directly, so any new
function that isn't meant to be an RPC needs an explicit `revoke … from anon, authenticated`.

## Migrations

| File | Date | What it does |
|------|------|--------------|
| `20261021230415_init_schema.sql` | 2026-10-22 | Enums, all tables, checks, indexes, `updated_at` triggers |
| `20261021230446_business_rules.sql` | 2026-10-22 | Reference sequences, overlap/capacity triggers, `sold` sync, availability RPCs |
| `20261021230515_rls.sql` | 2026-10-22 | `is_staff()`, RLS on every table, policies, `materialize_sauna_events()` |
| `20261021230538_reference_data.sql` | 2026-10-22 | Sauna settings, 3 upsells, 3 stay types, 3 sauna templates, 39 price items |
| `20261021230629_harden_function_grants.sql` | 2026-10-22 | Moves `is_staff()` to `private`, revokes RPC access to trigger functions, covering index for the stay-type FK |

Verified on 2026-10-22 against PGlite (Postgres 17) with a stub `auth` schema:
all migrations and the seed apply cleanly, and 32 checks pass (overlaps,
blocks, cabin capacity, ticket capacity, `sold` sync, anon/non-staff/staff RLS,
idempotent materialisation). Then applied to the live project. Afterwards:
- The security advisor flags only the two intended public RPCs
  (`sauna_taken_hours`, `stay_occupancy`) and `public.rls_auto_enable()`,
  which existed in the project before these migrations (not ours, left alone).
- The performance advisor reports only "unused index", which is expected on an
  empty database.
- Live check: anon reads the 39 price items and upsells and can call
  `stay_occupancy`, but has no privilege on `bookings` or `inquiries`.

## Data audit (2026-10-22): status

1. **Bookings have no cabin size.** *Partly fixed.* Bookings now carry
   `stay_type_id`, and the DB enforces per-size capacity. But the manual-booking
   form still has no size picker: `createBooking` picks a double for ≤ 2 guests
   and a quad otherwise, and `occupancy.ts` still pre-checks against the
   14-cabin pool.
2. **Cabin price units disagree.** The price list and calculator charge
   "Nameliai 50–60 €/asm./naktis" (per guest), but the cabin booking charges
   50 € / 60 € per cabin per night. For 15 guests and 1 night that's
   750–900 € in the calculator against about 240 € through booking. Ask the client.
3. **Pirtininkas costs 100 € or 200 €.** The sheet says 100 € on the sauna rows and 200 € in the contract terms (already noted in `lib/sauna.ts`). Seeded at 100 €.
4. **The public flows collect no contact details.** Sauna, cabin and ticket
   bookings ask for no name, phone or email, and the calculator inquiry is a
   `mailto:`. The DB requires a name plus an email or phone, so each flow needs
   a contact step.
5. ~~**Public availability is fake.**~~ *Fixed.* `/pirtis` uses
   `sauna_taken_hours`, `/miegas` uses `stay_occupancy`, and spots left come
   from `events.sold`. Public **confirmations still don't save** (see item 4),
   and their references (`PM-`/`MM-`/`PR-` hashes) are display-only.
6. **The admin price list is display-only.** Edits save to `price_items`,
   but the calculator still reads `lib/event-pricing.ts`, and cabin prices come
   from `lib/cabin.ts`. Sauna rates and extras *are* live from the DB.
7. ~~**Extra names don't match.**~~ *Fixed.* Extras render from
   `booking_extras` ("Beržinė vanta × 3"), priced on the server.
8. ~~**Manual bookings store an empty email as `""`.**~~ *Fixed.* Stored as `null`.
9. ~~**`ManagedEvent` has no duration.**~~ *Fixed.* `durationMinutes` is mapped
   and `time` is trimmed to `HH:MM`.
10. **Recurring sauna sessions run out.** The seed created 90 days of them.
    Staff need a way to extend them (`materialize_sauna_events()`: a button in
    /admin/renginiai, or a `pg_cron` job) before about 2027-01-19.

## Running locally / adding staff

1. Copy `.env.example` to `.env.local` and fill both `NEXT_PUBLIC_SUPABASE_*`
   values for project `mwngljhcvqkvncwbmgeo` (Dashboard → Project Settings → API).
2. Create a user in Dashboard → Authentication → Users (email + password), then:
   `insert into public.staff (user_id, display_name) values ('<user id>', '<name>');`
   Signed-in users who aren't in `staff` see "Nėra prieigos".
3. `supabase link --project-ref mwngljhcvqkvncwbmgeo` for future `db push`.
4. Regenerate `lib/supabase/database.types.ts` after every schema change.
   `bookings.reference` / `event_tickets.reference` show as required on
   `Insert` though a trigger fills them; `createBooking` passes
   `undefined as unknown as string`.

## Related

[[api-architecture]] · [[environment-variables]] · [[decisions-log]]
