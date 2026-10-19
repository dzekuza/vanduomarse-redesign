---
tags: [architecture, stable]
updated: 2026-10-19
---

# Data Flow

## Server data

None yet. Pages are static (except `/pirtis`, which reads `searchParams`).
Dates that must be "today" (booking days, events) are computed on the client
so static pages never go stale.

## Client data

- **Public site:** prices and rules are imported from `lib/` (`sauna.ts`,
  `sauna-upsells.ts`, `event-pricing.ts`, `cabin.ts`); availability and events
  are generated deterministically (`lib/sauna.ts` `maxHoursFrom`,
  `lib/park-events.ts`) so server and client render the same thing.
- **Admin:** `AdminStoreProvider` seeds from `lib/admin/mock-data.ts` and the
  same `lib/` constants; every screen reads and writes through `useAdmin()`.
  Changes reset on reload and do not reach the public site (ADR-0005).

TanStack Query is not used yet; it arrives with the Supabase backend.

## Client state

Local `useState` per flow (booking steps, calculator input). Cross-screen
admin state lives in the admin store (reducer + named actions). Browser
storage is not used.

## Forms

React Hook Form + Zod. Schemas live next to their form
(`components/admin/**/**-schema.ts`). Shape rules go in the schema; checks
against live data (slot still free, cabin capacity, group size) run on submit
and report with `setError`.

## Loading / error / empty

No async loading yet. Empty states exist for lists (bookings, inquiries,
events, upsells). Add loading/error states with the backend.

## Related

[[system-overview]] · [[api-architecture]] · [[decisions-log]]
