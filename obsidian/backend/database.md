---
tags: [backend, wip]
updated: 2026-11-16
---

# Database

Supabase Postgres, project **Vanduo** (`mwngljhcvqkvncwbmgeo`, eu-west-1).
The **app reads and writes it** (ADR-0007). Pending migrations are noted below:
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
- **A function used in an index expression, generated column, check or RLS policy must be executable by the role that writes the table** (`authenticated`, and `service_role`). A `revoke execute … from authenticated` on such a function turns every insert/update into `42501 permission denied for function …` (seen with `private.norm_phone` on `riders`, fixed in `20261113230006_norm_phone_execute.sql`). After adding such an index, test a write as `authenticated` in a rolled-back transaction.
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
After applying a migration through the MCP, rename the file to the version it
returns (`select version, name from supabase_migrations.schema_migrations`).
A 2026-11-16 pass realigned 66 files that had kept hand-picked versions.
Known gaps in the remote log (the schema changes are live, the rows are not):
`20261110120000_quad_tour_departures`, `20261110130000_quad_tour_departures_hardening`,
`20261110140000_notification_recipients`, `20261111230000_my_rider_account_phone_plain`
and `20261112170000_correct_seeded_sauna_copy` have no row, and the live rows
`20261113121004 session_blocks_private_sauna`, `20261113153616 admin_login_limits`
and `20261113153820 admin_login_atomic` (the first, superseded admin-login attempt)
have no file. `db push` will stop on these until they are repaired
(`supabase migration repair`) or files are added for the live-only rows.


**Hand edits to `database.types.ts` — re-apply after every regeneration** (the
generator types function arguments and result columns as non-null, even where
the SQL takes or returns null):

| Where | Edit | Why |
|-------|------|-----|
| `Functions.create_inquiry.Args.p_date` | `string \| null` | contact-form and event-registration inquiries come without a date; the function stores null |
| `Functions.plan_order_state.Returns.discount_code` | `string \| null` | null when the plan order had no discount (ADR-0106; `/registracija/apmoketa` maps null to "no code") |
| `Functions.plan_order_state.Returns.pass_code` | `string \| null` | null for plan orders and for a pass that is not paid yet (ADR-0109) |
| `Functions.complete_plan_pass_payment.Returns.pass_code` | `string \| null` | null when the paid amount did not match the price, so no code was issued (ADR-0109) |

`…_reference_data.sql` and `seed.sql` were generated from the
`lib/` constants and `lib/admin/mock-data.ts` (one-off script, not kept in the
repo). After connecting, the database is the source of truth for prices.

## Schema

| Table | Mirrors | Notes | RLS |
|-------|---------|-------|-----|
| `staff` | — | `user_id` → `auth.users`, `display_name`, `email`, `role_id`, `active`. A row = an admin login; its role says which pages (ADR-0012) | own row, or all for an owner; owners write |
| `staff_roles` | `StaffRole` | `name` (unique, case-insensitive), `is_owner` (exactly one: "Savininkas", all pages + staff), `permissions text[]` of page keys, check-constrained to the known keys | active staff read; owners write |
| `saunas` | `Sauna` | Slug id; name, description, `features text[]`, `photos text[]` (paths in the public `sauna-photos` bucket, array order = display order), `weekday_prices` / `weekend_prices` (jsonb length → price, ADR-0066), `included_guests`, `extra_guest_fee`, `turnaround_hours`, `max_party`, `open_hour` / `close_hour`, `min_hours` / `max_hours` (shortest / longest length, kept by the app; the old group-rate and package columns are unused), `active`, `sort_order` (ADR-0017) | anon reads `active`; `pirtis` writes |
| `sauna_programs` | `SaunaProgram` (not built yet) | Slug id; name, label, description, `kind` (session/private), `pricing` (person/family/group), price, child price, duration, capacity, `sauna_id` (private only), `active`, `sort_order`; seeded with six programs. `events.program_id`, `bookings.program_id`, `event_tickets.children`; RPCs `create_program_ticket`, `create_program_booking` (ADR-0022). Applied 2026-11-03 | anon reads `active`; `pirtis` writes |
| `sauna_masters` | `SaunaMaster` | Slug id; name, description, `price` per booking, `min_hours` (hourly hire), `active`, `sort_order` (ADR-0067). Chosen master lands in `booking_extras` as "Pirtininkas: <name>" (no `upsell_id`); RPCs take `p_master_id` | anon reads `active`; `pirtis` writes |
| `sauna_upsell_links` | `Sauna.upsellIds` | (`sauna_id`, `upsell_id`): which extras a sauna offers | public read; `pirtis` writes |
| `sauna_settings` | — | **Superseded** by `saunas` (20261030100000); no longer read by the app | public read; staff update |
| `sauna_upsells` | `Upsell` | Slug id (`pirtininkas`, `vantos`, …) | anon reads `active`; staff all |
| `stay_types` | `CABIN_SIZES` + camper | `namelis-2` (8 units), `namelis-4` (6), `kemperis` (units null = unlimited) | public read; staff write |
| `stay_type_seasons` | date ranges (ADR-0126) | summer prices for a stay type; nights outside every range use `stay_types` prices | public read; owner write; live DB: no overlapping ranges per type (exclusion constraint). After `20261126110000` (PENDING): nested allowed, no identical ranges; the shortest season prices a night (ADR-0132) |
| `spaces` | slug (ADR-0133) | event spaces staff hire out: label, blurb, max guests, weekday / weekend rent (null = not offered), whole park, active | read `rezervacijos` / `uzimtumas` / `apzvalga` / `kainos` / `renginiai`; insert / update `rezervacijos` or `kainos`; no delete |
| `stay_room_assignments` | booking + unit (ADR-0134) | which Sirvoy room each confirmed stay booking unit is exported to | RLS on, no policy: only `assign_stay_rooms()` writes it |
| `external_calendar_exports` | calendar (ADR-0134) | secret token of each room's outbound iCal feed | RLS on, no policy: read through `stay_room_feed()` / `stay_room_export_links()` |
| `external_calendars` | `ExternalCalendar` | One Sirvoy room feed (14 seeded): `label` = Sirvoy room number, `stay_type_id` (`namelis-2` x8: rooms 1-4, 11-14; `namelis-4` x6: rooms 5-10), `active` (set when a URL is stored), `last_synced_at`, `last_error`. ADR-0102. Applied 2026-11-16 | staff (`rezervacijos` / `uzimtumas` / `apzvalga`) read; written only through the functions below |
| `external_calendar_feeds` | — | The secret Sirvoy iCal export URL per room (`secured.sirvoy.com/ical/…` only). RLS on, **no policies**: reachable only through `set_external_feed` (owner) and `external_sync_feeds` (service role). Never sent to the browser | nobody directly |
| `external_blocks` | `ExternalBlock` | One reservation or closure from a room's feed: `starts_on`, `nights` (check-out day free), unique (`calendar_id`, `uid`). Replaced wholesale by the sync. The sync never fails on a clash (a Sirvoy overbooking is shown, not rejected) | staff read as above; written only by `sync_external_blocks` |
| `bookings` | `Booking` | Customer columns inline; `stay_type_id` and `stay_units` for stays (existing bookings default to one unit). Stays may leave `guests` unknown. Sauna bookings require it. `reference` auto `PM-`/`MM-`; nullable `rider_id` → `riders` (ADR-0042) | staff only |
| `booking_extras` | `Booking.extras` | Snapshot of name, unit, price, qty, line total | staff only |
| `sauna_blocks` | `Block` | `sauna_id`; unique (`sauna_id`, `date`, `hour`) | staff only (public via RPC) |
| `inquiries` + `inquiry_notes` | `Inquiry` | `estimate_min/max` both null or both set; `calculator_input jsonb` | staff only |
| `sauna_event_templates` | `lib/sauna-events.ts` templates | weekday, start, duration, price/person, capacity | staff only |
| `events` | `ManagedEvent` | `tour_route_id` (quad tour departures, ADR-0055), `start_time` (`time`), `duration_minutes`, `sold` kept by trigger, `template_id` + `date` unique, `regular_price` = pre-sale price shown struck through (null = no sale, must be above `price`; `price` is always what a ticket costs, ADR-0104, migration `20261116164951` applied) | anon reads `published`; staff manage private calendar visibility through the existing event permissions. The public calendar reads only dates for marked private events (ADR-0070). |
| `event_tickets` | `TourTicket` | Per-person tickets for scheduled events: sauna sessions (`PR-`) and quad tours (`KZ-`, public ones start `laukia`); nullable `rider_id` → `riders` (ADR-0042) | staff only |
| `coupon_products` | `CouponProduct` | Catalogue: `kind` (`verte` / `paslauga`), `service` (`visi` iff `verte`), `value`; seeded from sauna rate x min hours and the cabin price | anon reads `active`; staff all |
| `coupons` | `Coupon` | One row per order and issued coupon. `code` (12 chars, 60 bits) null until paid; snapshots of product name/kind/service/value; `balance` 0..`face_value`; `KP-` reference; status `laukia_apmokejimo` → `aktyvus` → `panaudotas` / `atsauktas`; nullable `rider_id` → `riders`, the buyer (ADR-0042) | staff only |
| `coupon_redemptions` | `Coupon.redemptions` | One row per spend; a `before insert` trigger locks the coupon, checks status/expiry/balance and updates `balance` + status | staff only |
| `quad_types` | `QuadType` | Fleet: `seats` 1-2, `units` owned, `price_per_hour`, `active`. Placeholder seed: 4 singles (30 €/h), 2 doubles (45 €/h) | anon reads `active`; staff all |
| `quad_settings` | `QuadSettings` | Singleton (`id = true`): `open_hour`, `close_hour`, `max_hours`, `deposit` (0 hides it), `min_age`, `rules` (empty hides the block) | public read; staff update |
| `quad_rentals` | `QuadRental` | Hourly rental request with one slot, contact, total and `KT-` reference. `units` and `riders` cover the entire request. `quad_type_id` is set for single-type requests and empty for mixed requests. Public requests start `laukia`; nullable `rider_id` → `riders` (ADR-0042; unrelated to the `riders` seat-count column on this same table) | staff only |
| `quad_rental_items` | `QuadRental.items` | For a mixed request, one row per fleet type and its unit count. Deleting the rental deletes its items | Staff with `keturraciai` read. The mixed rental RPC writes |
| `price_items` | `PriceItem` | Column `"group"` is quoted (reserved word) | public read; staff write |
| `ride_plans` | `RidePlan` | Plan catalogue sold in `/admin/apyrankes`, grouped by `category` (the till's tabs: Plaukimas, Įranga, Abonementai; the others were removed 2026-11-14 — `RIDE_PLAN_CATEGORIES` in `lib/ride-plans.ts`); `price numeric` null = free. ADR-0038, ADR-0039 | staff only (`apyrankes`) |
| `riders` | `Rider` | A park rider/customer: name, surname, nullable `plan_id` (`restrict` delete, ADR-0041), optional `phone`, `phone2`, `email`, `birthdate`, `avatar_path` (private `rider-photos` bucket), unique `grabby_id` (ADR-0041 bulk import), `self_registered` (ADR-0043: created through `/registracija`, not by staff), `needs_review` (ADR-0108: a `/registracija` row whose phone, second phone or e-mail already belonged to another customer; unverified, only staff clear it; skipped by `private.find_rider` and `my_riders()`) and nullable `duplicate_of` → `riders` (`on delete set null`, informational: which customer it matched). ADR-0038, ADR-0039, ADR-0041, ADR-0043. Also the Klientai identity anchor (ADR-0042) — bookings/quad_rentals/event_tickets/coupons link to it, not a separate customers table | staff only (`apyrankes` or `klientai`, ADR-0042); insert also via the anon RPC `register_rider_public` (ADR-0043) |
| `rider_cards` | `RiderCard` | One bracelet UID (`card_number`, digits only) → one rider (`rider_id unique`, cascade delete). ADR-0038 | staff only (`apyrankes`) |
| `purchases` | `Purchase` | Sales log: one row per plan assignment (`payment_method` kortele / grynais, set once by `set_purchase_payment`, ADR-0098), snapshotted (`plan_name`, `plan_category`, `price`) so a later plan edit/delete never rewrites history; `sold_by` the staff member. Drives the rider page's Pardavimai / Aktyvios paslaugos (today, non-`Abonementai`) / Abonementai (category `Abonementai`) views. ADR-0039 | staff read + insert only (`apyrankes`) — no update/delete, it's an audit log |
| `rider_comments` | `RiderComment` | Free-text staff notes on a rider; `author_name` snapshotted (not joined from `staff`, so non-owners can still see who wrote it). ADR-0039 | staff read/insert/delete (`apyrankes`) |
| `rider_documents` | `RiderDocument` | Files attached to a rider (ID scan, signed waiver, …) in the private `rider-documents` bucket. ADR-0039 | staff read/insert/delete (`apyrankes`) |
| `rider_waivers` | `RiderWaiver` | One row per `/registracija` self-registration: `terms_version`, `signature_path` (private `rider-waivers` bucket, PNG), `signed_at`. ADR-0043 | staff read (`apyrankes` or `klientai`); insert only via the anon RPCs |
| `rider_sessions` | `RiderSession` | One open/closed interval per rider ("out on the water"): `card_number` snapshot, `started_at`, nullable `ended_at`. Partial unique index on `rider_id where ended_at is null` — at most one open session per rider. Toggled by `scanRiderSession`. ADR-0045 | staff read/insert/update (`instruktorius`), no delete — audit log like `purchases` |
| `staff_push_tokens` | `StaffPushRegistration` | Expo push token per staff iOS device (`user_id` → `staff`, `expo_push_token` unique, `device_name`, `topics text[]`, `active`). Read by `public.staff_push_tokens_for(p_topic)` (`service_role` only) to fan out Expo push notifications alongside Twilio SMS (`lib/push/staff-push.ts`, ADR-0084) | staff manage own rows (`auth.uid() = user_id` and `private.is_staff()`); owners read all |

### Rules the database enforces (SQLSTATE `23P01` on conflict)

- No two live sessions in the **same sauna** overlap (`exclude using gist` on `sauna_id`, date, hours; needs `btree_gist`). A sauna booking needs a `sauna_id`; stays have none.
- A live sauna session can't cover a staff-closed hour of its sauna, and staff can't close a booked hour.
- Stays never exceed `stay_types.units` on any night. The advisory-locked trigger sums reserved units rather than booking rows, **plus the Sirvoy rooms taken that night** (`private.external_units_on`: distinct active rooms of the type, so overlapping events in one room's feed count once). `stay_occupancy()` adds the same count, so /rezervacija greys the nights out (ADR-0102).
- Quad rentals never exceed stock for any selected fleet type in any hour. The capacity trigger locks mixed types in a consistent order and checks them together.
- Event tickets never exceed `events.capacity`; `events.sold` = sum of live tickets.
- Cancelled rows (`atsaukta`) never block anything.
- A booking's `stay_type_id` must match its `kind` (composite FK).

Quad rentals: `quad_full` (`23P01`) when a type would go over its `units` in any
hour; the public RPCs also raise `quad_unavailable`, `quad_closed`, `quad_past`,
`quad_riders`, `tour_unavailable`, `tour_people` (`23503` / `23514`) and
`too_many_requests` (`54000`).

Coupon redemptions raise `23514` with a hint: `coupon_inactive`, `coupon_expired`,
`coupon_balance` (admin maps them to messages); `activate_coupon` raises
`coupon_not_pending` on a second call.

### Who can read and write what

Every staff policy checks a page permission through `private.has_permission(key)` /
`has_any_permission(keys)`; owners pass everything. Read-only dependencies are
deliberate, so a page never opens onto silently empty data.

| Page key | Writes | Also reads (read-only) |
|----------|--------|------------------------|
| `apzvalga` | nothing | bookings + extras, inquiries, events (incl. drafts) |
| `rezervacijos` | bookings, booking_extras | sauna_blocks, sauna_upsells |
| `uzimtumas` | sauna_blocks | bookings + extras |
| `uzklausos` | inquiries, inquiry_notes | — |
| `keturraciai` | quad_types, quad_settings, quad_rentals; quad_rental_items (read only); tickets of `keturratis` events | events |
| `kuponai` | coupon_products, coupons, coupon_redemptions; `activate_coupon()` | — |
| `nuolaidos` | discount_codes; `discount_code_usage()` | — (uses are counted across bookings, quad rentals and tickets inside the function) |
| `renginiai` | events, event_tickets, sauna_event_templates; `materialize_sauna_events()` | — |
| `pirtis` | saunas, sauna_upsell_links, sauna_upsells, `sauna-photos` objects | — (saunas are also read by `rezervacijos`, `uzimtumas`, `apzvalga`) |
| `kainos` | price_items | — |
| `apyrankes` | ride_plans, riders, rider_cards, purchases (read/insert), rider_comments, rider_documents, rider_waivers (read, ADR-0043) | — |
| `klientai` (ADR-0042) | riders, rider_comments, rider_documents, rider_waivers (read, ADR-0043) | purchases, bookings, quad_rentals, event_tickets, coupons |
| `instruktorius` (ADR-0045) | rider_sessions (read/insert/update, no delete — audit log) | riders, ride_plans, rider_cards |
| owner only | staff, staff_roles, stay_types, stay_type_seasons | everything |

Public reads (anon) are unchanged. The capacity and `sold` triggers are
`security definer` so every role gets the same checks whatever rows it can see.
Guards: the last active owner can't be removed, demoted or switched off
(`last_owner`); the owner role can't be edited or deleted (`owner_role`).

Map `23P01` to a form error with `setError` (the trigger `hint` says which:
`sauna_blocked`, `sauna_booked`, `sauna_session`, `stay_full`, `event_full`).

### Functions

| Function | Who | Purpose |
|----------|-----|---------|
| `sauna_taken(from, to)` | anon, authenticated | Booked and closed hours per sauna, including published sessions at Pirtis Marse after the priority migration. No customer data |
| `sauna_taken_hours(from, to)` | anon, authenticated | **Deprecated**: hours taken in any sauna; kept for the deploy window |
| `stay_occupancy(from, to)` | anon, authenticated | Units reserved vs stock per stay type per night, without contact data |
| `private.is_staff()` | authenticated | Used by every staff policy. Lives in the non-exposed `private` schema, so it isn't an RPC |
| `materialize_sauna_events(from, days)` | `renginiai` | Creates events from active templates; idempotent |
| `create_coupon_order(product, name, email, recipient, message)` | anon, authenticated | `security definer`. Creates an order awaiting payment; amount from the product row; refuses at 100 pending orders per hour |
| `check_coupon(code)` | anon, authenticated | `security definer`. Balance, scope and expiry for an active code; nothing for unknown, unpaid, spent, cancelled or expired ones |
| `quad_taken(from, to)` | anon, authenticated | `security definer`. Quads taken per type and hour (counts only); range capped at 60 days |
| `create_quad_rental(type, date, start, hours, units, riders, name, email, phone, note)` | anon, authenticated | `security definer`. Files a `laukia` request; price, opening hours, max hours and rider limit come from the fleet/settings rows; refuses at 100 pending per hour |
| `create_mixed_quad_rental(allocations, date, start, hours, riders, name, email, phone, note)` | anon, authenticated | `security definer`. Reserves up to 20 quads across distinct active types in one slot. The database checks total seats and live hourly stock, prices each type and inserts all rows in one transaction |
| `create_tour_ticket(event, people, name, email, phone)` | anon, authenticated | `security definer`. Only for published `keturratis` events with capacity; `laukia`, `KZ-` reference; seats enforced by the existing ticket trigger |
| `create_sauna_booking(sauna, date, start, hours, party, extras jsonb, name, email, phone, note, coupon)` | anon, authenticated | `security definer`. Active sauna only (`sauna_unavailable`); prices from its `saunas` row + linked, active `sauna_upsells`; the old signature without `sauna` books the first active sauna (deprecated); `laukia` booking + `booking_extras`; overlap and closed hours enforced by the existing triggers; a valid coupon is recorded in the note for staff to redeem |
| `create_stay_booking(stay_type, date, nights, guests, name, email, phone, note, coupon)` | anon, authenticated | `security definer`. Single-unit entry point with a required guest count, shared with older forms |
| `create_stay_booking_with_units(stay_type, date, nights, units, name, guests, email, phone, note, coupon)` | anon, authenticated | `security definer`. One `laukia` booking for 1–20 units of one stay type. Prices each night through `private.stay_price()` / `stay_night_rate()`: the season (`stay_type_seasons`) the night falls in, else the `stay_types` prices, tiered by the whole stay's length (1 night / 2 nights / 3+ nights, ADR-0123, ADR-0126). `accept_inquiry_stays` uses the same function. Known guests must fit the selected units. Phone, pending requests, and nightly stock are enforced by the existing triggers |
| `create_event_ticket(event, people, name, email, phone)` | anon, authenticated | `security definer`. Published capacity events except `keturratis`; `laukia`, `PR-` reference |
| `register_for_event(event, people, name, email, phone, message)` | anon, authenticated | `security definer`. Published events without capacity; stored as an `inquiries` row (source `renginys`) |
| `create_inquiry(...)` | anon, authenticated | `security definer`. Calculator quote with its input; source `skaiciuokle`. |
| `private.has_permission(key)` / `has_any_permission(keys)` / `is_owner()` / `is_staff()` | authenticated (private schema, not RPCs) | The checks behind every staff policy; all require an **active** staff row |
| `set_external_feed(calendar, url)` | owner (`authenticated`, raises `42501` otherwise) | Stores or, with an empty url, clears a room's Sirvoy feed (and its blocks); only `https://secured.sirvoy.com/ical/<id>` is accepted (`23514`, hint `feed_url`) because the server fetches it |
| `external_sync_feeds()` / `sync_external_blocks(calendar, blocks jsonb)` / `external_sync_failed(calendar, error)` | `service_role` only | The cron sync: which feeds to read; replace one room's blocks in one transaction (`[{uid, starts_on, nights}]`); record why a read failed (the old blocks stay) |
| `activate_coupon(id)` | `kuponai` (`security invoker`) | Issues the code and a 12-month expiry; only for `laukia_apmokejimo` |
| `private.generate_coupon_code()` | internal | 12 symbols of `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` from `gen_random_uuid()` bytes |
| `check_discount_code(code)` | anon, authenticated | `security definer`. Kind, value and services of an active code that is in its dates and not used up; nothing otherwise. A preview only (ADR-0036) |
| `discount_code_usage()` | `nuolaidos` (`security definer`, raises `42501` otherwise) | Uses and euro total per code, from non-cancelled bookings, quad rentals and tickets |
| `private.apply_discount_code(code, service, subtotal)` | internal (booking RPCs) | Locks the code row, raises `discount_invalid` (unknown, off, wrong service, outside dates) or `discount_used_up`, returns the euros off (percent rounded to cents, fixed capped at the subtotal). The seven checkout RPCs (`create_sauna_booking` with `p_sauna_id`, `create_stay_booking`, `create_stay_booking_with_units`, `create_quad_rental`, `create_mixed_quad_rental`, `create_program_booking`, `create_program_ticket`) take `p_discount_code` and return `code_discount`; the deprecated sauna overload, `create_event_ticket` and `create_tour_ticket` do not |

Both availability functions cap the range at 370 days. Supabase grants
EXECUTE on new `public` functions to `anon`/`authenticated` directly, so any new
function that isn't meant to be an RPC needs an explicit `revoke … from anon, authenticated`.

## Pay-on-site selection in /rezervacija

ADR-0035 adds a client-side payOnSite choice, not a schema change. After the existing verified-account and name checks, cash submission uses the normal submitReservation/fileRequest path. Requests are stored as ordinary unpaid requests; this path does not set awaitingPayment or create a Stripe payment or session. Server-side capacity, pricing and ownership checks still apply.

There is no new payment-method column, migration or cash-specific notification. The cash choice is retained only in the current reservation UI state and its receipt copy. It is not a universal persisted marker across bookings, quad rentals and event tickets (event tickets have no note field). Existing unpaid-request records and normal notifications must not be interpreted as a reliable cash-method flag. Supplier tour previews remain local and call none of these request/payment paths, regardless of the chosen action.

## Migrations

| File | Date | What it does |
|------|------|--------------|
| `20261116183439_registration_locks_best_match.sql` | 2026-11-16 | ADR-0108, PR review follow-up, applied to the live project. `register_rider_public` takes all its advisory locks in one sorted order (no deadlock when two calls swap phone and phone2), also locks the e-mail's `rider:` key (lines up with `find_or_create_rider` for e-mail-only orders), and holds a shared lock over the park-wide hourly cap. Each contact is matched on its own and a fully registered match wins, so a registered customer behind phone2 still gets `already_registered` with no id. Column comments renamed to "ADR-0107" (the ADR is now ADR-0108). **Types hand-edit:** `register_rider_public` returns `rider_id: string \| null` (the generator says `string`); reapply after regenerating. Verified as `anon` in a rolled-back transaction. |
| `20261116182834_registration_needs_review.sql` | 2026-11-16 | ADR-0108, second review follow-up, applied to the live project. `on delete restrict` let an anonymous caller block staff from deleting any customer by registering with that customer's phone, so the quarantine moved to a new `riders.needs_review` flag (backfilled from `duplicate_of`); `find_rider` and `my_riders()` filter on it, and `duplicate_of` is back to `on delete set null`. The per-contact throttle counts the second phone too. Verified as `anon` in a rolled-back transaction: deleting the original works and the duplicate stays quarantined. |
| `20261116182546_registration_duplicate_phone2.sql` | 2026-11-16 | ADR-0108 follow-up from review, applied to the live project. `register_rider_public` also checks `phone2` against existing customers (with its own advisory lock), so a known number entered only as the second phone still makes a `duplicate_of` row. `riders.duplicate_of` was made `on delete restrict` (replaced by `needs_review` in `20261116182834`). Verified as `anon` in a rolled-back transaction. |
| `20261116181848_registration_no_anon_merge.sql` | 2026-11-16 | ADR-0108, applied to the live project. Security fix: `register_rider_public` (anon) never writes onto an existing customer. A known phone/e-mail creates a new row with `riders.duplicate_of` = the match, for staff to merge; a fully registered match returns `(null, already_registered = true)`, no id. `private.find_rider` and `my_riders()` skip `duplicate_of` rows. The validation and throttles of `20261111174736` (dropped by `20261112175237`) are back. Verified in a rolled-back transaction as `anon`: a matching phone left the existing row and its waivers unchanged. Types: only the `riders` block taken from the generated file (the live DB carries other branches' schema). |
| `20261111174736_security_hardening.sql` | 2026-11-12 | ADR-0064, applied to the live project. `register_rider_public` throttled (3 unfinished per contact per 24 h, 100 per hour) and validated; `finalize_rider_registration_public` accepts only the rider's own existing Storage paths; `rls_auto_enable()` revoked from API roles; `anon` table privileges reduced to SELECT on the 13 tables with an anon read policy; indexes on 7 foreign keys. |
| `20261021230415_init_schema.sql` | 2026-10-22 | Enums, all tables, checks, indexes, `updated_at` triggers |
| `20261021230446_business_rules.sql` | 2026-10-22 | Reference sequences, overlap/capacity triggers, `sold` sync, availability RPCs |
| `20261021230515_rls.sql` | 2026-10-22 | `is_staff()`, RLS on every table, policies, `materialize_sauna_events()` |
| `20261021230538_reference_data.sql` | 2026-10-22 | Sauna settings, 3 upsells, 3 stay types, 3 sauna templates, 39 price items |
| `20261021230629_harden_function_grants.sql` | 2026-10-22 | Moves `is_staff()` to `private`, revokes RPC access to trigger functions, covering index for the stay-type FK |

| `20261027203000_coupons.sql` | 2026-10-27 | Coupon enums, `coupon_products` / `coupons` / `coupon_redemptions`, redemption trigger, code generator, the three RPCs, RLS and grants |
| `20261027203100_coupon_products.sql` | 2026-10-27 | 7 starter products (3 euro values, ride 2 h / day, sauna, cabin) priced from the live tables |

> [!info] Coupon migrations: applied
> Written and verified on PGlite (34 checks: anon can't read coupons, activation is staff-only, balance maths, expiry, snapshots, RLS on every table), then applied to the live "Vanduo" project by the owner on 2026-10-27 (the Supabase MCP session available while building them pointed at a different project and was left untouched). `lib/supabase/database.types.ts` was regenerated with `supabase gen types` and matched the hand-written draft. Checked live as anon: 7 products readable, `coupons` / `coupon_redemptions` / `activate_coupon` denied (`42501`), `check_coupon` returns nothing for an unknown code, and a real order through `/kuponai` stored as `KP-1001`. Still open: run both advisors, and cancel the test order `KP-1001` ("TESTAS", 50 €) in /admin/kuponai.

| `20261028090000_quad_event_category.sql` | 2026-10-28 | `event_category` gains `keturratis` (own file: a new enum value can't be used in the transaction that adds it) |
| `20261028090100_quads.sql` | 2026-10-28 | `quad_types`, `quad_settings`, `quad_rentals`, hourly capacity trigger, `quad_taken` / `create_quad_rental` / `create_tour_ticket`, RLS and grants |
| `20261028130000_public_requests.sql` | 2026-10-28 | `create_sauna_booking`, `create_stay_booking`, `create_event_ticket`, `register_for_event`, `create_inquiry` (public bookings, tickets and inquiries are stored instead of staying in the browser) |
| `20261028150024_pending_request_limits.sql` | 2026-10-28 | `expire_pending_requests()` + pg_cron job (48 h expiry of unanswered web requests), per-contact pending caps via triggers |
| `20261028150255_contact_limit_hardening.sql` | 2026-10-28 | canonical phone compare, 8-digit minimum, advisory locks on the per-contact caps |
| `20261111211026_private_event_calendar.sql` | 2026-11-11 | Adds explicit private visibility to events and a date-only public calendar RPC. Drafts remain hidden. |
| `20261111211012_wake_season_passes.sql` | 2026-11-11 | Adds two WAKE season passes to `coupon_products` for staff fulfillment from paid coupon codes. See ADR-0069. |
| `20261030100000_saunas.sql` | 2026-10-30 | `saunas`, `sauna_upsell_links`, `sauna_id` on bookings + blocks (backfilled into "Pirtis Marse"), per-sauna overlap/closed-hour rules, `sauna_taken()`, new `create_sauna_booking` overload, RLS, `sauna-photos` bucket + policies |
| `20261028090200_quad_reference_data.sql` | 2026-10-28 | **Placeholder** fleet (2 types) and settings (10-20 h, max 3 h, no deposit, 18+, no rules text) |
| `20261028120000_staff_roles.sql` | 2026-10-28 | `staff_roles`, `staff.role_id/email/active` (existing staff become owners), permission helpers, last-owner and owner-role guards, 35 policies replaced by per-page ones, definer triggers, permission checks in `activate_coupon` / `materialize_sauna_events` |
| `20261030120000_phone_verification.sql` | 2026-10-30 | `private.phone_verifications` (HMAC'd codes, hashed IPs; RLS on, no policies), `request_phone_code` (60 s cooldown, 3/h + 5/day per phone, 10/h + 20/day per IP, 200/h site-wide; one site-wide advisory lock), `verify_phone_code` (10 min, 5 tries) and `cancel_phone_code` (failed SMS: expire the code, lift the cooldown), all service-role only; purge cron; `require_verified_phone` insert trigger on bookings / event_tickets / quad_rentals (`svetaine`), inquiries (`renginys`) and coupons: an insert by **anon or a signed-in non-staff user** needs a phone verified in the last 65 min (hint `phone_unverified`); `coupons.buyer_phone`; `create_coupon_order` gains `p_buyer_phone` (5-arg version dropped). ADR-0018 |
| `20261104100000_phone_verification_skip.sql` | 2026-11-04 | `record_skipped_phone(p_phone)`: security definer, service role only; inserts an already-verified `private.phone_verifications` row so the `require_verified_phone` triggers accept a skipped number. Only called while `PHONE_VERIFICATION_SKIP=1`. ADR-0023 |
| `20261104130000_stay_booking_units.sql` | 2026-11-04 | Multi-unit stays and optional guest count for stays, with unit-based occupancy and a compatible single-unit RPC. Verified in an isolated PostgreSQL runtime with local Supabase service stubs. Apply to Supabase before deploying the quantity-first reservation flow. ADR-0024 |
| `20261104150000_customer_accounts.sql` | 2026-11-04 | `user_id uuid default auth.uid()` on `bookings`, `quad_rentals`, `event_tickets`; `private.account_owns_contact(phone, email)` (caller's confirmed Supabase Auth phone or email); `require_verified_phone` now also lets a signed-in customer file requests under their own confirmed phone or email (anon + SMS-token path unchanged); `account_owns_contact` requires EVERY contact on the row (phone and email) to be the account's own, so a confirmed email cannot vouch for a stranger's phone. ADR-0027. Applied 2026-11-04 (via Supabase MCP, ledger repaired to the file version) |
| `20261104180000_payment_session_guards.sql` | 2026-11-04 | `attach_payment_session(…, p_expected_session_id)` only replaces the session it expects; `complete_payment(…, p_payment_id)` finds the payment by id when the paying session is not the current one, records that session as the paid one and reports `duplicate` (a second payment intent on a paid payment, flagged `needs_review`). Tested in a rolled-back transaction. Applied 2026-11-04 via Supabase MCP (ledger repaired, types regenerated and unchanged). ADR-0026 |
| `20261105120000_notify_account_email.sql` | 2026-11-05 | `account_notify_email(p_user)` and `payment_notify_email(p_payment_id)`: the account's confirmed email from `auth.users` (null otherwise), service role only. The admin confirm/cancel email (`account_notify_email`) and the Stripe payment email (`payment_notify_email`) use them instead of the row's `customer_email`, which `user_id` alone does not prove. New-request emails take the confirmed address from the session user (`lib/customer.ts`) instead. Applied 2026-11-05 via Supabase MCP to `mwngljhcvqkvncwbmgeo` (ledger version aligned; both functions security definer, execute for service_role only; returns null for unconfirmed accounts). The two entries in `database.types.ts` match the generated output; the full regenerated file was not adopted because it also drops `graphql_public` and narrows `create_inquiry.p_date` (unrelated drift). ADR-0028 |
| `20261107180329_rider_profiles.sql` | 2026-11-07 | Rider profiles + sales history (ADR-0039): `riders` gains `phone`, `phone2`, `email`, `birthdate`, `avatar_path`; `ride_plans` gains `category` (the till's tabs); new `purchases` (sales log, snapshotted, insert/read only), `rider_comments`, `rider_documents` tables, all RLS-keyed to `apyrankes`; two new private storage buckets `rider-photos` and `rider-documents` (unlike public `sauna-photos`, these are personal data — served through signed URLs via the `getRiderFileUrl` action). Replaces the four placeholder starter plans with the real 13-item "Plaukimas" price list; the one rider on the old placeholder "Dienos bilietas" was moved onto its real replacement before the placeholders were deleted. Applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`); security advisor showed no new findings; generated types matched the hand-written draft exactly. |
| `20261107174515_bracelet_passes.sql` | 2026-11-07 | `ride_plans`, `riders`, `rider_cards` (ADR-0038): a staff-only bracelet pass system for `/admin/apyrankes`. New `apyrankes` page permission added to `staff_roles_permissions_known`. Anon has no grants on any of the three tables; staff RLS keyed to `private.has_permission('apyrankes')`. Seeded with four starter plans (Dienos bilietas 35 €, 10 kartų 120 €, Sezono bilietas 450 €, Darbuotojas free). Applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`); security advisor showed no new findings; generated types matched the hand-written draft exactly. |
| `20261107190251_rider_grabby_import.sql` | 2026-11-07 | `riders.plan_id` made nullable; new unique `riders.grabby_id` (ADR-0041). Bulk-imported ~8,940 Grabby contacts as plan-less riders. Applied to the live project. |
| `20261107193757_klientai.sql` | 2026-11-07 | ADR-0042, applied to the live project. New `klientai` permission; additive RLS on `riders`/`rider_comments`/`rider_documents`/`purchases` + the `rider-photos`/`rider-documents` buckets (existing `apyrankes` policies untouched); nullable `rider_id` on `bookings`/`quad_rentals`/`event_tickets`/`coupons` with a read-only `klientai` policy on each; one-time backfill matched all 12 existing rows to a rider by phone/email, creating 2 new ones. Security advisor clean; types regenerated (known `create_inquiry.p_date` hand-edit reapplied). |
| `20261107212126_fix_rider_upload_privileges.sql` | 2026-11-07 | Bugfix, applied to the live project. The real blocker behind both `/registracija` upload policies: `anon` has no `SELECT` grant on `riders`/`rider_waivers` at all (`permission denied for table riders`, confirmed with `set local role anon`), not just an RLS gap — so their `EXISTS` subqueries could never see the row, silently rejecting **both** the photo and the signature upload from the start. Added two `public` `security definer` helper functions (`rider_awaiting_photo`, `rider_waiver_awaiting_signature`, same pattern as `private.has_permission`) that the two Storage policies now call instead of querying the tables directly. Verified by calling both functions `set local role anon`. |
| `20261107211034_fix_rider_photo_upload_policy.sql` | 2026-11-07 | Bugfix, applied to the live project (superseded in effect by `20261107212126` above, but still correct and needed). The `public rider photo upload` policy's `EXISTS` subquery had a bare `name`, which resolved to `riders.name` (the rider's first name) instead of `storage.objects.name` because `riders` has its own `name` column — every photo upload from `/registracija` was silently rejected. Redefined with explicit `objects.name`; the sibling waiver-upload policy had no such collision (`rider_waivers` has no `name` column) but was broken for the separate, bigger reason fixed next. |
| `20261107205756_public_rider_registration.sql` | 2026-11-07 | ADR-0043, applied to the live project. `riders.self_registered boolean`; new `rider_waivers` table (read-only to `apyrankes`/`klientai`); new private `rider-waivers` storage bucket (PNG signatures only); two narrowly-scoped anon `insert`-only Storage policies on `rider-photos`/`rider-waivers` (only matches a self-registered row with no path set yet); two new `security definer` RPCs granted to `anon` only — `register_rider_public` (creates the rider + waiver row) and `finalize_rider_registration_public` (links the two uploaded file paths). Security advisor showed only the expected new anon-RPC WARN entries (same category as every other public booking/coupon RPC). Types regenerated (known `create_inquiry.p_date` hand-edit reapplied again). |
| `20261111222115_quad_tours_any_time.sql` | 2026-11-12 | ADR-0071. Grants `create_quad_tour_rental` to `anon` / `authenticated` again (the departures hardening revoked it) so a tour is booked at any start the fleet covers, and sets every route's `min_units` to 5. **APPLIED to the live project `mwngljhcvqkvncwbmgeo` on 2026-11-12 after checking `get_project_url`; verified: `anon` and `authenticated` can execute `create_quad_tour_rental`, every route has `min_units` 5.** |
| `20261110130000_quad_tour_departures_hardening.sql` | 2026-11-10 | ADR-0055 hardening: revoke direct execute on `create_quad_tour_rental` (only the departure wrapper may book a tour) and trigger `event_tickets_no_departures` (private.reject_departure_tickets) so per-person tickets cannot target a departure. Tested in a rolled-back transaction, then applied 2026-11-10 and verified. |
| `20261110120000_quad_tour_departures.sql` | 2026-11-10 | ADR-0055. `events.tour_route_id` (a dated departure of a quad tour product; only category keturratis), `quad_rentals.tour_event_id`, trigger `private.sync_tour_event_sold` (events.sold = quads in non-cancelled bookings), `keturraciai` insert/update/delete policies on keturratis events, `create_quad_tour_departure_rental(event, units, gear, contact…)` (locks the departure, checks its quad capacity, then calls `create_quad_tour_rental`). Tested in a rolled-back transaction, then applied to the live project 2026-11-10 (verified); `database.types.ts` regenerated. |
| `20261109142104_drop_inquiry_won_lost.sql` | 2026-11-09 | ADR-0047, applied to the live project via the Supabase MCP. Narrowed `inquiry_status` from 5 values to 3 (dropped `laimeta`/`prarasta` — confirmed zero live rows used either), standard rename/recreate/cast/drop enum swap, guarded `do $$ if not exists $$` so the file is a no-op on replay. Security advisor: no new findings. Types regenerated (known `create_inquiry.p_date` hand-edit reapplied). |
| `20261113105915_event_held_spots.sql` | 2026-11-13 | `events.held` (places staff set aside, default 0); `enforce_ticket_capacity` counts it (kept security definer, empty search_path); `private.check_event_held` trigger refuses `held + sold > capacity` and held on an unlimited event. APPLIED via project-3 MCP, verified by a rolled-back test. Types by hand. ADR-0090 |
| `20261113143142_confirm_cash_request.sql` | 2026-11-13 | `confirm_cash_request(reference)`: confirms the caller's own pending, unpaid website request when their phone is confirmed (pay on site) |
| `20261113011243_staff_notifications_feed.sql` | 2026-11-13 | `staff_notifications` (feed of the admin bell: kind, `permissions text[]`, title, body, reference, href; select policy by `private.has_permission`, no write policy, service role writes) and `staff_notification_reads` (one `read_at` per staff, own-row policies); `staff_notifications` added to `supabase_realtime`. APPLIED via project-3 MCP and verified (RLS on, grants, publication). Types by hand. ADR-0088 |
| `20261113004919_notification_recipient_emails.sql` | 2026-11-13 | `notification_recipients.email` (unique case-insensitively), `phone` nullable, check that one of them is set, topics add pirtis/keturraciai/nakvyne; `staff_notify_phones_for(text[])` and `staff_notify_emails_for(text[])` (null when no active row has that channel; service role only); `staff_notify_phones(text)` kept as a wrapper. APPLIED via project-3 MCP, verified by a rolled-back test. Types by hand. ADR-0086 |
| `20261112223203_paid_staff_details.sql` | 2026-11-13 | `paid_staff_details(payment_id)`: per request customer name/e-mail/phone, people, units, total, discount code, note for the staff payment notification; security definer, service role only. APPLIED via project-3 MCP and verified on MM-1103. Types added by hand. ADR-0084 |
| `20261112221321_page_content.sql` | 2026-11-13 | `page_content` (`slug` pk, `content jsonb` object, `updated_at`): owner overrides of public service pages; anyone SELECTs, owners insert/update/delete (`private.is_owner()`), anon read-only grant. Public bucket `page-photos` (5 MB, jpeg/png/webp/avif), owner-only storage policies. APPLIED via project-3 MCP and verified. Types added by hand. ADR-0083 |
| `20261111204051_site_settings.sql` | 2026-11-12 | `site_settings` singleton (`id boolean` pk forced true, `coming_soon` default true, seeded ON because production is gated); anyone (incl. anon, for the proxy) can SELECT, only owners UPDATE (`private.is_owner()`), no insert/delete policy. APPLIED 2026-11-12 via the project-3 MCP slot and verified. Follow-up `20261111204155_site_settings_grants.sql` (revoke anon write grants, authenticated insert/delete) APPLIED and verified. Types added by hand. ADR-0068 |
| `20261110140000_notification_recipients.sql` | 2026-11-10 | `notification_recipients` (name, E.164 `phone` unique, `topics` visi/rezervacijos/uzklausos/mokejimai, active) with owner-only RLS (`private.is_owner()`); `staff_notify_phones(p_topic)` returns the active numbers for a topic, null when none are set up (security definer, service role only). Applied 2026-11-10 by the owner and verified (RLS on; anon cannot run the function). Types merged by hand (full regeneration also drifts elsewhere). ADR-0056 |
| `20261105150000_discount_codes.sql` | 2026-11-05 | `discount_codes` (code unique, upper case; `discount_kind` procentai/suma; value; services pirtis/nakvyne/keturraciai; valid from/until; max uses; active; note) with RLS for the new `nuolaidos` page permission; `discount_code_id`, `discount_code`, `discount_amount` on `bookings`, `quad_rentals`, `event_tickets`; `check_discount_code`, `discount_code_usage`, private `apply_discount_code` / `discount_code_uses` / `normalize_discount_code`; the eight booking RPCs recreated with `p_discount_code` (code first, then gift coupon). Tested on `mwngljhcvqkvncwbmgeo` in a rolled-back transaction (totals for sauna, stay, quads, mixed quads, program; one-use code refused then freed by a cancel; wrong service and expired refused; anon cannot read the table or usage). Applied 2026-11-05 via `supabase db push --include-all` together with `20261104190000` and `20261104191000` (ledger shows all three; one `create_program_ticket` signature; grants as intended). Types merged by hand. ADR-0036 |
| `20261104170000_customer_own_requests.sql` | 2026-11-04 | Extra permissive select policies so a signed-in customer reads only their own rows (`user_id = auth.uid()`) in `bookings`, `quad_rentals`, `event_tickets`, `payments` and (through their rental) `quad_rental_items`; no write access. Tested in a rolled-back transaction (own rows only, nothing from other users, update changes 0 rows, anon blocked). Applied 2026-11-04 via Supabase MCP. ADR-0027 |
| `20261104160000_stripe_payments.sql` | 2026-11-04 | `payments` (status laukia / apmoketa / pasibaige / nepavyko / grazinta, amount, refunded, Stripe session and intent ids, `needs_review`) with RLS read for staff pages (`rezervacijos`, `uzimtumas`, `apzvalga`, `keturraciai`, `renginiai`); `payment_id` FK on `bookings`, `quad_rentals`, `event_tickets`; `payments.user_id`; service-role-only functions `start_payment(p_user, refs)`, `attach_payment_session`, `complete_payment` (idempotent, reports `newly_paid`), `expire_payment`, `abandon_payment`, `cancel_unpaid_requests`, `record_refund`, `payment_state`; private helpers `payment_paid`, `payment_refs`, `payment_items`, `close_payment`, `expire_stale_payments` (cron every 10 min); `pending_web_requests` and `expire_pending_requests` now skip paid requests. ADR-0026. Applied 2026-11-04 (via Supabase MCP, ledger repaired to the file version) |
| `20261104140000_mixed_quad_rentals.sql` | 2026-11-04 | Mixed fleet requests with one reference, protected allocation rows, a shared per-type capacity check, and the same public occupancy response. Verified in an isolated PostgreSQL runtime. Apply before deploying mixed quad selection. ADR-0025 |

The data-only migration `20261112170000_correct_seeded_sauna_copy.sql` corrects the original seeded Finnish sauna name and copy when the stored name and description still match the seed. Public booking and calculator loaders read the stored record (ADR-0071).

> [!warning] Phone verification migration: apply together with the deploy
> Verified on a local Supabase stack together with `20261030100000_saunas.sql` (direct RPCs by anon and by a signed-in non-staff user refused without a verified phone; active staff and the service role pass; code functions closed to anon; cooldown / caps / lockout). Note: since the saunas migration, `seed.sql` fails on a fresh stack (`bookings_sauna`: seeded sauna bookings lack `sauna_id`). **Not applied to the live project.** Apply it in the same window as the code: before it, the old site cannot book (trigger), and the old 5-arg `create_coupon_order` is gone. Set `PHONE_VERIFICATION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` and Twilio first.

> [!info] Published sauna session priority and legacy tickets
> `20261104190000_published_sauna_session_priority.sql` and
> `20261104191000_reservation_legacy_sauna_tickets.sql` were applied to the live
> project on 2026-11-05, before `20261105150000_discount_codes.sql` (which
> replaces `create_program_ticket` again, so it must stay after them). The first migration adds published sessions to `sauna_taken`
> and protects their hours from private reservations at `pirtis-marse`.
> The second lets `create_program_ticket` accept legacy published sauna
> events with capacity. Those use the event's price and per-person tickets.
> Linked sessions retain program pricing and family tickets.
> Both passed a full local migration replay and booking conflict, boundary,
> capacity, and account checkout checks. Live Supabase still needs both migrations.

> [!info] Saunas migration: applied
> `20261030100000_saunas.sql` passed 41 checks on PGlite with all migrations and the demo seed (backfill, per-sauna overlap and closed hours, both RPC signatures, anon/`pirtis`/`rezervacijos`/`kainos` RLS, storage policies, RLS on every table), then the owner applied it to the live project on 2026-10-30. Live check: one sauna "Pirtis Marse" (rates from `sauna_settings`), 3 extras linked, all 5 sauna bookings and every closed hour carry `sauna_id`, the `sauna-photos` bucket is public with 4 policies; the advisors list only the intended public RPCs. `supabase gen types` was regenerated (keeping the existing hand-edit `create_inquiry.p_date: string | null`). An end-to-end run through /admin (create, photos, reorder, closed hour, picker on /pirtis and /embed/pirtis, delete) left no rows or objects behind. **Open:** `supabase migration list` doesn't record `20261030100000` as applied remotely (applied outside `db push`); run `supabase migration repair --status applied 20261030100000` so a later `db push` doesn't try it again.

> [!info] Roles migration: applied
> `20261028120000_staff_roles.sql` was verified on PGlite (112 permission checks plus the 80 coupon and quad checks as regression), then applied to the live project by the owner on 2026-10-28. Live check: `staff_roles` exists, the public role reads nothing from it, the one existing staff row is active with the Owner role, and `supabase gen types` is identical to the hand-written staff types. **Deploy order for any new environment:** apply this migration before the app code, because the admin layout reads `staff_roles`; and set `SUPABASE_SERVICE_ROLE_KEY` to create staff logins.

> [!warning] Quad migrations: not applied yet
> Written and verified on PGlite (46 checks: anon boundary, request validation hints, per-hour capacity incl. cancel/reopen, `quad_taken` numbers, tour seats and `sold`, spam brake, RLS on every table), but **not applied to the live project** until the owner pushes them. `lib/supabase/database.types.ts` holds a hand-written match; regenerate it with `supabase gen types` after the push. The seeded fleet and prices are placeholders: correct them in /admin/keturraciai before promoting the page.

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

## Plan passes: bracelet plans bought without registering (ADR-0109)

Migration `20261117180903_plan_passes.sql`, APPLIED 2026-11-17. `public.plan_passes` is a paid (or pending) plan that belongs to
no rider yet: buyer name and e-mail, plan snapshot, the price actually paid (after the discount), `gift`, `recipient_name`,
a 12-character `code` (issued on payment, same alphabet as coupon codes), `status`
(`laukia_apmokejimo` → `apmoketa` → `priskirtas`, or `atsauktas`), Stripe session / intent, and once attached `rider_id`,
`redeemed_at`, `redeemed_by`, `purchase_id`. The Black Friday code check constraint from `rider_plan_orders` is repeated on it; since migration `20261127120000_wake_black_friday_any_percent.sql` both checks only keep `WAKEBLACKFRIDAY2026` on the WAKE season pass (no fixed 10 %: the amount comes from the live code row, the owner sets the percentage in /admin/nuolaidos).
RLS: staff with the `apyrankes` permission can read. Every RPC below is service-role only except `redeem_plan_pass`, which signed-in staff call (it checks the permission itself).

| Function | Who | What |
|----------|-----|------|
| `create_plan_pass` | service role | new unpaid pass; prices the discount, best-effort caps on unpaid passes (counted before the insert, so concurrent requests can slightly exceed them): 5 per IP hash per hour, 300 across all IPs per hour |
| `attach_plan_pass_session`, `abandon_plan_pass` | service role | remember the Stripe session; drop a pass whose Checkout could not open |
| `complete_plan_pass_payment` | service role (webhook) | marks paid and issues the code once; a wrong amount changes nothing and reports `amount_ok = false` |
| `expire_plan_pass_session`, `refund_plan_pass_payment` | service role (webhook) | cancel an unpaid pass; a full refund cancels an unattached pass (and a pending pass whose payment did not match the price) and reports it; for an attached pass it only reports (`was_attached = true`) and the rider keeps the plan until staff change it |
| `plan_order_state` | service role | now also answers for a pass session (`kind = 'pass'`, `pass_code`); an attached pass reads as `apmoketa` |
| `redeem_plan_pass(pass, rider, replace)` | staff (`apyrankes`) | attaches the pass: the rider needs a profile photo and a signed waiver, an existing plan needs `replace`; sets `riders.plan_id` and logs a card purchase |

`private.discount_code_uses` and `discount_code_usage()` count passes too, so a code's use limit and the Nuolaidos report include them.

Follow-up migration `20261117183124_plan_passes_refund_gift.sql` (APPLIED 2026-11-17): `complete_plan_pass_payment` stores the Stripe payment intent on a pending pass whose paid amount differs from the price (no code is issued), so `refund_plan_pass_payment` can find and cancel it; `plan_order_state` gained a `gift` column (false for plan orders).

Follow-up migration `20261117183602_plan_passes_refunded_at.sql` (APPLIED 2026-11-17): `plan_passes.refunded_at` is set by `refund_plan_pass_payment` for every refunded pass; a refunded attached pass keeps status `priskirtas`, so the Meta / GA purchase check (`verifyPlanPass`) refuses any pass with `refunded_at`.

Migration `20261118090000_staff_payments.sql` (APPLIED 2026-11-18, ADR-0112): `bookings` and `event_tickets` get `payment_method` (`kortele` / `grynais`) and `paid_at` (set by staff for a request paid at entry); `payments.staff_created`; `start_staff_payment(p_refs)` (service role only) groups an unpaid staff-source (`telefonu` / `vietoje`) booking or ticket into a payment; `payment_notify_email` returns the typed address of a staff-created payment.

Migration `20261118120000_staff_payment_followups.sql` (APPLIED 2026-11-18, ADR-0113): `quad_rentals.payment_method` / `paid_at`; `start_staff_payment` now covers quad rentals, returns the open staff payment when called again and starts a new one when the earlier expired; `void_staff_payment(p_payment_id)` (service role) retires an unpaid staff payment and detaches its requests.

## Points / kreditai (ADR-0121)

Migration `20261119120000_points_credits.sql`, APPLIED 2026-11-19. Balance per customer record: `riders.points_balance` (>= 0), every change in `public.points_ledger` (`delta`, `kind` earn | admin | redeem | release | clawback | return, `reason`, `source_kind` + `source_id` unique per `kind` so an event never credits twice, `balance_after`, `created_by`). `private.apply_points` is the only writer (advisory lock per rider, rejects overdraw with hint `points_insufficient`). `public.adjust_rider_points(rider, delta, reason)` (needs the `klientai` permission) is what /admin calls. `public.loyalty_settings` (single row; owners write, everyone reads): `enabled`, `earn_points_per_euro` (default 5), `point_value_eur` (default 0.01, used when spending arrives in phase 2). Earning is a trigger, not a change to the payment functions: `payments_earn_points` (status becomes `apmoketa`, not `needs_review`, not `staff_created`; credits `floor(amount x rate)` to the rider of the payment's bookings / quad rentals / tickets) and `rider_plan_orders_earn_points` (plan order paid). `public.my_points()` returns the account's riders (confirmed e-mail or phone, same rule as `my_riders`) with balance and the latest 50 movements. Checked with rolled-back SQL: earn once, replay does not double, `needs_review` earns nothing, overdraw blocked.

Follow-up migration `20261119140000_points_integrity.sql` (APPLIED 2026-11-19, security review of PR #147): `riders.points_balance` can only change inside `private.apply_points` (BEFORE INSERT/UPDATE trigger `riders_guard_points_balance` checks a transaction-local setting `app.points_write`; staff with `klientai` / `apyrankes` can edit riders but no longer the balance directly). Refunds take earned points back: `payments_claw_back_points` (refunded amount grew or status `grazinta`: pro rata of the earned points, summed over `points_ledger.parent_source_id`, one `payment_refund` clawback row per step) and `rider_plan_orders_claw_back_points` (`apmoketa` to `atsauktas`: all earned points). Clawbacks are capped at the balance the customer still holds. Checked with rolled-back SQL: direct update/insert blocked, partial then full refund (210 to 160 to 10), replay does not double, spent points not chased, plan order refund.

Follow-up migration `20261119150000_my_points_phone2.sql` (APPLIED 2026-11-19): `my_points()` also matches a rider through `phone2`, like `my_riders()`.

Follow-up migration `20261119160000_my_points_primary_match.sql` (APPLIED 2026-11-19): `my_points()` uses `my_riders()`'s primary-match split: a match through `phone2` only returns the balance with an empty log.

Follow-up migration `20261119190000_my_points_primary_flag.sql` (APPLIED 2026-11-19): `my_points()` also returns `primary_match`, so `/paskyra` shows a note instead of "no movements" when the log is withheld.

## Points spending (ADR-0122)

Migrations `20261119170000_points_spend.sql` and `20261119180000_my_spendable_points.sql`, APPLIED 2026-11-19. `payments` gains `points_spent`, `points_discount` (euros) and `points_rider_id`; `payments.amount` stays the **cash** charge (so `complete_payment`'s amount check, the earn trigger and the Meta `Purchase` value use cash) while the requests keep their gross totals. `public.redeem_points_on_payment(payment, user, points)` (service role; the app calls it after `start_payment` with "as many as fit") caps at the balance and so the cash charge stays at least 0.50 EUR, takes the points through `apply_points` (key `payment_redeem`), lowers `payments.amount` and records the rider chosen by `private.rider_for_user(user)` (primary match by confirmed e-mail or main phone, most points first). Trigger `payments_points_lifecycle`: a waiting payment that expires or fails gives the points back (`release`); one paid after that takes them again (`payment_retake`) or is flagged `needs_review` when they are gone. Trigger `payments_return_spent_points`: cash refunded returns the same share of the points (cumulative `return` rows). `begin_request_refund` now refunds a request's cash share (total x cash / (cash + points), capped at the cash left). `public.my_spendable_points()` gives the checkout the balance, point value and on/off for the signed-in customer. Checked with rolled-back SQL: redeem capped by balance, repeat does nothing, expiry returns, late payment takes again, partial and full refund return pro rata, another user's payment untouched, 0.50 EUR floor.

## Space bookings (ADR-0124)

Migration `20261119200000_space_bookings.sql`, APPLIED 2026-11-19. `space_bookings`: date, start/end time, `spaces text[]` (ids of `public.spaces` since 2026-11-26, checked by trigger `space_bookings_spaces_known`; was a CHECK listing the sheet's ids), customer name / surname / phone / optional e-mail, guests, agreed price, status (`booking_status`), note. RLS: read for `rezervacijos` / `uzimtumas` / `apzvalga`, write for `rezervacijos`. Hire-against-hire clashes are checked by `createSpaceBooking`; clashes with events held in a space (`events.space_id`, ADR-0136) by triggers in both directions. `database.types.ts` was edited by hand.

## Event presets (ADR-0125)

Migration `20261119210000_event_presets.sql`, APPLIED 2026-11-19. `event_presets`: slug id, label, `per_guest_min` / `per_guest_max`, `adults`, `kids`, `sort_order`, `active`. RLS: public read, write for `kainos`. Seeded with the eight types that used to be `PRESETS`. `database.types.ts` edited by hand.

`20261119220000_space_booking_date_range.sql` (APPLIED 2026-11-19) adds `end_date` (last day, inclusive; `start_time` is on the first day, `end_time` on the last) and replaces the times check with `end_date >= date and (end_date > date or end_time > start_time)`.

## Stay seasons (ADR-0126)

- `20261124120000_stay_type_seasons.sql` (APPLIED 2026-11-24): table `stay_type_seasons` (inclusive date ranges, exclusion constraint against overlap per type, public read, owner write), `private.stay_night_rate()` / `private.stay_price()`, and `create_stay_booking_with_units` / `accept_inquiry_stays` re-created to price per night by season. Requires extension `btree_gist`.
- `20261124130000_save_stay_type.sql` (APPLIED 2026-11-24): RPC `save_stay_type(p_type jsonb, p_seasons jsonb)`, security invoker (owner RLS applies), upserts the type and replaces its seasons in one transaction; a season id already used by another type fails on the primary key.

## Owner requests 2026-11-26 (ADR-0131 – ADR-0134)

| Migration | State | What |
|-----------|-------|------|
| `20261126100000_stay_bookable_until.sql` | APPLIED 2026-11-26 | `stay_types.bookable_until` (exclusive) + trigger `bookings_stay_bookable_until` (website inserts only, hint `stay_closed`); `save_stay_type` keeps the stored date when the key is missing; `private.stay_night_rate()` picks the shortest season of a night. Both cabin types set to 2027-05-01. |
| `20261126110000_stay_season_nesting.sql` | **PENDING, owner's go-ahead** | drops `stay_type_seasons_no_overlap`, adds `unique (stay_type_id, starts_on, ends_on)`. Until applied, a nested season fails with 23P01 and the admin says so. |
| `20261126120000_sauna_session_master.sql` | APPLIED | `events.sauna_master_id text` → `sauna_masters` (on delete set null). |
| `20261126130000_spaces.sql` | APPLIED | table `spaces` (seeded with the 8 sheet ids), trigger `space_bookings_spaces_known`, CHECK `space_bookings_spaces` dropped. |
| `20261126160000_event_space.sql` | APPLIED | `events.space_id` (ADR-0136), CHECK `events_space_needs_duration`, triggers `events_space_free` and `space_bookings_events_free` (23P01 `space_taken`), `renginiai` may read `spaces`. |
| `20261126170000_page_content_hidden.sql` | APPLIED | `page_content.hidden boolean not null default false` (ADR-0137): owner switches a service page off; a row may hold `content = {}` just to carry the flag. Existing RLS covers it. Types edited by hand. |
| `20261126140000_stay_room_export.sql` | APPLIED | `stay_room_assignments`, `external_calendar_exports` (tokens), `assign_stay_rooms()` (service role), `private.external_units_on()` ignores a room's Sirvoy blocks on nights that room holds one of our confirmed bookings (echo of our export). Checked in a rolled-back block: 3 bookings assigned, stock unchanged after simulated echoes, re-run stable. |
| `20261126150000_stay_room_feed_functions.sql` | APPLIED | `stay_room_feed(token)` (service role, assigns then returns the room's events as jsonb, null for an unknown token), `stay_room_export_links()` (owner check inside). |
| `20261127140000_quad_tour_group_rules.sql` | NOT APPLIED (owner runs it in the SQL editor) | ADR-0139. `quad_tour_routes` gets `max_units` (15), `group_from` / `group_price` (from 10 quads every quad 72 €), `guides_from` / `guide_units` (from 11 customer quads 2 guide quads); `quad_rentals.guide_units` (included in `units`, `riders` = customer quads). Midi: 80 €, 72 € from 10, max 15, guides from 11 (+2), badge removed; Mini and Maxi inactive. `create_quad_tour_rental` re-created: checks `max_units`, allocates customer + guide quads, prices with the group price. Types edited by hand. |

`database.types.ts` regenerated from the live DB (it now also lists `coupon_refunds` / `request_refunds` and other objects applied from other branches); the `create_inquiry.p_date` nullable hand edit is kept.
