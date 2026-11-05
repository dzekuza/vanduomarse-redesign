---
tags: [backend, wip]
updated: 2026-11-05
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
| `staff` | — | `user_id` → `auth.users`, `display_name`, `email`, `role_id`, `active`. A row = an admin login; its role says which pages (ADR-0012) | own row, or all for an owner; owners write |
| `staff_roles` | `StaffRole` | `name` (unique, case-insensitive), `is_owner` (exactly one: "Savininkas", all pages + staff), `permissions text[]` of page keys, check-constrained to the known keys | active staff read; owners write |
| `saunas` | `Sauna` | Slug id; name, description, `features text[]`, `photos text[]` (paths in the public `sauna-photos` bucket, array order = display order), the rate/limit columns with the `rates-schema.ts` cross-checks, `active`, `sort_order` (ADR-0017) | anon reads `active`; `pirtis` writes |
| `sauna_programs` | `SaunaProgram` (not built yet) | Slug id; name, label, description, `kind` (session/private), `pricing` (person/family/group), price, child price, duration, capacity, `sauna_id` (private only), `active`, `sort_order`; seeded with six programs. `events.program_id`, `bookings.program_id`, `event_tickets.children`; RPCs `create_program_ticket`, `create_program_booking` (ADR-0022). Applied 2026-11-03 | anon reads `active`; `pirtis` writes |
| `sauna_upsell_links` | `Sauna.upsellIds` | (`sauna_id`, `upsell_id`): which extras a sauna offers | public read; `pirtis` writes |
| `sauna_settings` | — | **Superseded** by `saunas` (20261030100000); no longer read by the app | public read; staff update |
| `sauna_upsells` | `Upsell` | Slug id (`pirtininkas`, `vantos`, …) | anon reads `active`; staff all |
| `stay_types` | `CABIN_SIZES` + camper | `namelis-2` (8 units), `namelis-4` (6), `kemperis` (units null = unlimited) | public read; staff write |
| `bookings` | `Booking` | Customer columns inline; `stay_type_id` and `stay_units` for stays (existing bookings default to one unit). Stays may leave `guests` unknown. Sauna bookings require it. `reference` auto `PM-`/`MM-` | staff only |
| `booking_extras` | `Booking.extras` | Snapshot of name, unit, price, qty, line total | staff only |
| `sauna_blocks` | `Block` | `sauna_id`; unique (`sauna_id`, `date`, `hour`) | staff only (public via RPC) |
| `inquiries` + `inquiry_notes` | `Inquiry` | `estimate_min/max` both null or both set; `calculator_input jsonb` | staff only |
| `sauna_event_templates` | `lib/sauna-events.ts` templates | weekday, start, duration, price/person, capacity | staff only |
| `events` | `ManagedEvent` | `start_time` (`time`), `duration_minutes`, `sold` kept by trigger, `template_id` + `date` unique | anon reads `published`; staff all |
| `event_tickets` | `TourTicket` | Per-person tickets for scheduled events: sauna sessions (`PR-`) and quad tours (`KZ-`, public ones start `laukia`) | staff only |
| `coupon_products` | `CouponProduct` | Catalogue: `kind` (`verte` / `paslauga`), `service` (`visi` iff `verte`), `value`; seeded from sauna rate x min hours and the cabin price | anon reads `active`; staff all |
| `coupons` | `Coupon` | One row per order and issued coupon. `code` (12 chars, 60 bits) null until paid; snapshots of product name/kind/service/value; `balance` 0..`face_value`; `KP-` reference; status `laukia_apmokejimo` → `aktyvus` → `panaudotas` / `atsauktas` | staff only |
| `coupon_redemptions` | `Coupon.redemptions` | One row per spend; a `before insert` trigger locks the coupon, checks status/expiry/balance and updates `balance` + status | staff only |
| `quad_types` | `QuadType` | Fleet: `seats` 1-2, `units` owned, `price_per_hour`, `active`. Placeholder seed: 4 singles (30 €/h), 2 doubles (45 €/h) | anon reads `active`; staff all |
| `quad_settings` | `QuadSettings` | Singleton (`id = true`): `open_hour`, `close_hour`, `max_hours`, `deposit` (0 hides it), `min_age`, `rules` (empty hides the block) | public read; staff update |
| `quad_rentals` | `QuadRental` | Hourly rental request with one slot, contact, total and `KT-` reference. `units` and `riders` cover the entire request. `quad_type_id` is set for single-type requests and empty for mixed requests. Public requests start `laukia` | staff only |
| `quad_rental_items` | `QuadRental.items` | For a mixed request, one row per fleet type and its unit count. Deleting the rental deletes its items | Staff with `keturraciai` read. The mixed rental RPC writes |
| `price_items` | `PriceItem` | Column `"group"` is quoted (reserved word) | public read; staff write |

### Rules the database enforces (SQLSTATE `23P01` on conflict)

- No two live sessions in the **same sauna** overlap (`exclude using gist` on `sauna_id`, date, hours; needs `btree_gist`). A sauna booking needs a `sauna_id`; stays have none.
- A live sauna session can't cover a staff-closed hour of its sauna, and staff can't close a booked hour.
- Stays never exceed `stay_types.units` on any night. The advisory-locked trigger sums reserved units rather than booking rows.
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
| owner only | staff, staff_roles, stay_types | everything |

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
| `create_stay_booking_with_units(stay_type, date, nights, units, name, guests, email, phone, note, coupon)` | anon, authenticated | `security definer`. One `laukia` booking for 1–20 units of one stay type. Prices from `stay_types` per unit per night. Known guests must fit the selected units. Phone, pending requests, and nightly stock are enforced by the existing triggers |
| `create_event_ticket(event, people, name, email, phone)` | anon, authenticated | `security definer`. Published capacity events except `keturratis`; `laukia`, `PR-` reference |
| `register_for_event(event, people, name, email, phone, message)` | anon, authenticated | `security definer`. Published events without capacity; stored as an `inquiries` row (source `renginys`) |
| `create_inquiry(...)` | anon, authenticated | `security definer`. Calculator quote with its input; source `skaiciuokle`. |
| `private.has_permission(key)` / `has_any_permission(keys)` / `is_owner()` / `is_staff()` | authenticated (private schema, not RPCs) | The checks behind every staff policy; all require an **active** staff row |
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
| `20261030100000_saunas.sql` | 2026-10-30 | `saunas`, `sauna_upsell_links`, `sauna_id` on bookings + blocks (backfilled into "Pirtis Marse"), per-sauna overlap/closed-hour rules, `sauna_taken()`, new `create_sauna_booking` overload, RLS, `sauna-photos` bucket + policies |
| `20261028090200_quad_reference_data.sql` | 2026-10-28 | **Placeholder** fleet (2 types) and settings (10-20 h, max 3 h, no deposit, 18+, no rules text) |
| `20261028120000_staff_roles.sql` | 2026-10-28 | `staff_roles`, `staff.role_id/email/active` (existing staff become owners), permission helpers, last-owner and owner-role guards, 35 policies replaced by per-page ones, definer triggers, permission checks in `activate_coupon` / `materialize_sauna_events` |
| `20261030120000_phone_verification.sql` | 2026-10-30 | `private.phone_verifications` (HMAC'd codes, hashed IPs; RLS on, no policies), `request_phone_code` (60 s cooldown, 3/h + 5/day per phone, 10/h + 20/day per IP, 200/h site-wide; one site-wide advisory lock), `verify_phone_code` (10 min, 5 tries) and `cancel_phone_code` (failed SMS: expire the code, lift the cooldown), all service-role only; purge cron; `require_verified_phone` insert trigger on bookings / event_tickets / quad_rentals (`svetaine`), inquiries (`renginys`) and coupons: an insert by **anon or a signed-in non-staff user** needs a phone verified in the last 65 min (hint `phone_unverified`); `coupons.buyer_phone`; `create_coupon_order` gains `p_buyer_phone` (5-arg version dropped). ADR-0018 |
| `20261104100000_phone_verification_skip.sql` | 2026-11-04 | `record_skipped_phone(p_phone)`: security definer, service role only; inserts an already-verified `private.phone_verifications` row so the `require_verified_phone` triggers accept a skipped number. Only called while `PHONE_VERIFICATION_SKIP=1`. ADR-0023 |
| `20261104130000_stay_booking_units.sql` | 2026-11-04 | Multi-unit stays and optional guest count for stays, with unit-based occupancy and a compatible single-unit RPC. Verified in an isolated PostgreSQL runtime with local Supabase service stubs. Apply to Supabase before deploying the quantity-first reservation flow. ADR-0024 |
| `20261104150000_customer_accounts.sql` | 2026-11-04 | `user_id uuid default auth.uid()` on `bookings`, `quad_rentals`, `event_tickets`; `private.account_owns_contact(phone, email)` (caller's confirmed Supabase Auth phone or email); `require_verified_phone` now also lets a signed-in customer file requests under their own confirmed phone or email (anon + SMS-token path unchanged); `account_owns_contact` requires EVERY contact on the row (phone and email) to be the account's own, so a confirmed email cannot vouch for a stranger's phone. ADR-0027. Applied 2026-11-04 (via Supabase MCP, ledger repaired to the file version) |
| `20261104180000_payment_session_guards.sql` | 2026-11-04 | `attach_payment_session(…, p_expected_session_id)` only replaces the session it expects; `complete_payment(…, p_payment_id)` finds the payment by id when the paying session is not the current one, records that session as the paid one and reports `duplicate` (a second payment intent on a paid payment, flagged `needs_review`). Tested in a rolled-back transaction. Applied 2026-11-04 via Supabase MCP (ledger repaired, types regenerated and unchanged). ADR-0026 |
| `20261105120000_notify_account_email.sql` | 2026-11-05 | `account_notify_email(p_user)` and `payment_notify_email(p_payment_id)`: the account's confirmed email from `auth.users` (null otherwise), service role only. The admin confirm/cancel email (`account_notify_email`) and the Stripe payment email (`payment_notify_email`) use them instead of the row's `customer_email`, which `user_id` alone does not prove. New-request emails take the confirmed address from the session user (`lib/customer.ts`) instead. Applied 2026-11-05 via Supabase MCP to `mwngljhcvqkvncwbmgeo` (ledger version aligned; both functions security definer, execute for service_role only; returns null for unconfirmed accounts). The two entries in `database.types.ts` match the generated output; the full regenerated file was not adopted because it also drops `graphql_public` and narrows `create_inquiry.p_date` (unrelated drift). ADR-0028 |
| `20261105150000_discount_codes.sql` | 2026-11-05 | `discount_codes` (code unique, upper case; `discount_kind` procentai/suma; value; services pirtis/nakvyne/keturraciai; valid from/until; max uses; active; note) with RLS for the new `nuolaidos` page permission; `discount_code_id`, `discount_code`, `discount_amount` on `bookings`, `quad_rentals`, `event_tickets`; `check_discount_code`, `discount_code_usage`, private `apply_discount_code` / `discount_code_uses` / `normalize_discount_code`; the eight booking RPCs recreated with `p_discount_code` (code first, then gift coupon). Tested on `mwngljhcvqkvncwbmgeo` in a rolled-back transaction (totals for sauna, stay, quads, mixed quads, program; one-use code refused then freed by a cancel; wrong service and expired refused; anon cannot read the table or usage). Applied 2026-11-05 via `supabase db push --include-all` together with `20261104190000` and `20261104191000` (ledger shows all three; one `create_program_ticket` signature; grants as intended). Types merged by hand. ADR-0036 |
| `20261104170000_customer_own_requests.sql` | 2026-11-04 | Extra permissive select policies so a signed-in customer reads only their own rows (`user_id = auth.uid()`) in `bookings`, `quad_rentals`, `event_tickets`, `payments` and (through their rental) `quad_rental_items`; no write access. Tested in a rolled-back transaction (own rows only, nothing from other users, update changes 0 rows, anon blocked). Applied 2026-11-04 via Supabase MCP. ADR-0027 |
| `20261104160000_stripe_payments.sql` | 2026-11-04 | `payments` (status laukia / apmoketa / pasibaige / nepavyko / grazinta, amount, refunded, Stripe session and intent ids, `needs_review`) with RLS read for staff pages (`rezervacijos`, `uzimtumas`, `apzvalga`, `keturraciai`, `renginiai`); `payment_id` FK on `bookings`, `quad_rentals`, `event_tickets`; `payments.user_id`; service-role-only functions `start_payment(p_user, refs)`, `attach_payment_session`, `complete_payment` (idempotent, reports `newly_paid`), `expire_payment`, `abandon_payment`, `cancel_unpaid_requests`, `record_refund`, `payment_state`; private helpers `payment_paid`, `payment_refs`, `payment_items`, `close_payment`, `expire_stale_payments` (cron every 10 min); `pending_web_requests` and `expire_pending_requests` now skip paid requests. ADR-0026. Applied 2026-11-04 (via Supabase MCP, ledger repaired to the file version) |
| `20261104140000_mixed_quad_rentals.sql` | 2026-11-04 | Mixed fleet requests with one reference, protected allocation rows, a shared per-type capacity check, and the same public occupancy response. Verified in an isolated PostgreSQL runtime. Apply before deploying mixed quad selection. ADR-0025 |

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
