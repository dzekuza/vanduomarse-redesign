---
tags: [backend, wip]
updated: 2026-10-19
---

# Database

## Rules

- **RLS on every table** — no exceptions, including join and lookup tables.
- **Never modify an applied migration.** A schema change is always a new migration.
- Server-side auth uses `@supabase/ssr`; never the browser client on the server.
- The service-role key is server-only and never reaches the client bundle.
- Regenerate types after a schema change and commit them.

## Schema

No database yet (ADR-0005). Planned tables, mirroring `lib/admin/types.ts`:

| Table | Purpose | RLS policy summary |
|-------|---------|--------------------|
| `bookings` | Sauna sessions and stays (kind, customer, date, start/hours or nights, extras, total, status, source: svetaine/telefonu/vietoje, note) | public insert via server action only; admin read/write |
| `sauna_blocks` | Hours closed by staff | public read (availability); admin write |
| `inquiries` + `inquiry_notes` | Event inquiries and follow-ups | public insert via server action; admin read/write |
| `events` | Park events and public sauna sessions | public read where `published`; admin write |
| `prices` | Price list items (value, optional max) | public read; admin write |
| `sauna_settings` | Single row: `SaunaRates` (rates, threshold, package, party/hour limits, opening hours) | public read; admin write |
| `sauna_upsells` | Extras: name, description, price, unit, max_qty, active | public read where `active`; admin write |

## Migrations

| File | Date | What it does |
|------|------|--------------|
| — | — | No migrations yet |

## Related

[[api-architecture]] · [[environment-variables]] · [[decisions-log]]
