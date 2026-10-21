---
tags: [architecture, stable]
updated: 2026-10-22
---

# Data Flow

## Server data (Supabase, ADR-0007)

- **Public pages** (`/pirtis`, `/miegas`, `/renginiai`) are async Server
  Components that call `lib/data/public.ts` (cookieless anon client,
  `connection()` so they render per request). They pass plain props — dates as
  `yyyy-mm-dd` — to the Client Components, which turn them into `Date`s with
  `toSaunaEvent` / `toParkEvent` / `nextDays`. "Today" is the Vilnius date
  from the server (`todayKey()`), so server and client agree.
  - Sauna: `sauna_settings`, active `sauna_upsells`, `sauna_taken_hours()`,
    ticketed `pirtis` events (`spotsLeft = capacity − sold`).
  - Cabins: `stay_occupancy()` → free cabins per night and size.
  - Events: published `events` for the next 30 days.
- **Admin:** `app/admin/(panel)/layout.tsx` checks the session and
  `public.staff`, then `loadAdminData()` (`lib/admin/repository.ts`) reads
  everything as that user (RLS) and maps rows with `lib/admin/mappers.ts`.
  `AdminStoreProvider` receives it as `initial`.

## Writes

Admin only, via server actions in `app/admin/actions.ts`. `useAdmin()` applies
the change optimistically, awaits the action, and the action's
`revalidatePath("/admin", "layout")` re-renders the layout; the provider then
resets to the fresh `initial`. Failures toast and are undone by that reset.
`createBooking` is not optimistic: the reference comes from the database.
Public booking forms do **not** write yet (no contact step — see [[database]]).

The event calculator (`lib/event-pricing.ts`) still prices from the sheet
constants, not the database. TanStack Query is not used.

## Client state

Local `useState` per flow (booking steps, calculator input). Cross-screen
admin state lives in the admin store (reducer over the server data + named
actions). Browser storage is not used; the Supabase session is a cookie
refreshed by `proxy.ts`.

## Forms

React Hook Form + Zod. Schemas live next to their form
(`components/admin/**/**-schema.ts`). Shape rules go in the schema; checks
against live data (slot still free, cabin capacity, group size) run on submit
and report with `setError`.

## Loading / error / empty

Pages render after their reads finish (no `loading.tsx` yet). A failed read
throws to the nearest error boundary (none custom yet: add `error.tsx` for
`/admin` and the booking pages). Empty states exist for lists.

## Related

[[system-overview]] · [[api-architecture]] · [[decisions-log]]
