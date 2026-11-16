---
tags: [backend, plan]
updated: 2026-11-16
---

# Booking.com / Sirvoy calendar sync (plan)

**Status: planned, nothing built.** Decision record: ADR-0102 in [[decisions-log]].

## Goal

Apartments listed on Booking.com show their Booking.com reservations on the admin
calendar, and a night that Booking.com has sold can no longer be booked on
/rezervacija. **One way only: Booking.com → our app.** We never publish our own
bookings back (the reverse iCal feed was declined).

## Source: Sirvoy, not Booking.com (found 2026-11-16)

Booking.com's extranet shows the property has an **XML connection to Sirvoy**
(active since 2023-05-02), so Booking.com's own iCal export is not the source and
inventory is only editable in Sirvoy. Sirvoy is the channel manager and the one
place that holds every booking (Booking.com, front desk, other channels). We read
from it. Sirvoy has **no open API** (help.sirvoy.com), but two Pro-plan features:

| Feature | What it gives | Notes |
|---------|---------------|-------|
| **iCal export per room** (Settings → Channels → iCal → Connect property → Generate export URL) | Blocked dates per room: bookings and restrictions. One year ahead. | Pull, self-healing (each poll replaces the state). No guest name, price or contact. Dates only. Channels (and so we) may poll about hourly. **Chosen for v1.** |
| **Booking event webhook** (Settings → Sirvoy account → Booking event webhook → Add) | JSON on every new / modified / cancelled / restored booking: guest name, phone, e-mail, rooms (`RoomTypeName`, `RoomName`), dates, price, `channelBookingId`, `bookingSource` | Push, near real time. Needs an https endpoint answering 200 and GET health checks; events can arrive out of order (use `generatedAt`); 10 retries then the webhook is removed; only events from setup on (needs a backfill); IP allow-list. Up to 10 per account. A later upgrade if names are wanted. |

Both need **Sirvoy Pro** (check Settings → Subscription). Sirvoy's iCal covers all
sources, so blocks are not tagged "Booking.com" in the UI: label them "Sirvoy".

There are **14 rooms** in Sirvoy, so 14 per-room export URLs, one unit each. The
Booking.com extranet confirms two room types: Dvivietis (8 rooms to sell,
room id 960519601) and Ketурvietis (6, id 960519602).

## Data model (one migration, `external_calendars` + `external_blocks`)

| Table | Columns | Notes |
|-------|---------|-------|
| `external_calendars` | `id`, `stay_type_id` → `stay_types`, `label` (e.g. "Apartamentai 7"), `feed_url` (secret), `active`, `last_synced_at`, `last_error` | One row per Booking.com feed. Many feeds may point at one stay type. Owner-only (feed URLs are secrets). |
| `external_blocks` | `id`, `calendar_id` → `external_calendars` (cascade), `uid`, `starts_on`, `nights`, unique (`calendar_id`, `uid`) | One row per reservation. Replaced wholesale on each sync (insert new, update changed, delete vanished = cancelled on Booking.com). Staff read via the `rezervacijos` permission; writes only by the sync (service role). |

RLS on both. Feed URLs must never reach the browser: the admin store gets
`external_calendars` without `feed_url` (a view or a column-limited select), and
the URL is entered through a server action.

### Stock

Each block takes **1 unit** of its stay type for every night, like a booking
with `stay_units = 1`. Changes:

- `stay_occupancy()` adds the sum of blocks covering the night to `taken`, so
  /rezervacija greys out the dates (it already reads this function).
- The stay capacity trigger counts blocks too, so a direct insert or a staff
  booking on a taken night fails with `stay_full` (`23P01`).
- Cancelled-on-Booking.com reservations disappear from the feed, so the sync
  deletes the block and the unit frees up.

**Resolved (2026-11-16): the 14 apartments are the existing cabins.** 8 for 2
guests = `namelis-2` (`units = 8`), 6 for 4 guests = `namelis-4` (`units = 6`).
No new stay types: 8 feeds point at `namelis-2`, 6 feeds at `namelis-4`. Because
the units within a type are interchangeable, a block takes "one of the type's
units"; /rezervacija shows a type as sold out only when blocks plus bookings
reach `units`. **Sirvoy room map (from Settings → Accommodations, 2026-11-16):**
Double (2 guests, Booking.com room 960519601) = rooms 1, 2, 3, 4, 11, 12, 13, 14 → `namelis-2`.
Quadruple (4 guests, Booking.com room 960519602) = rooms 5, 6, 7, 8, 9, 10 → `namelis-4`.
A third, **internal** room type "Perkelimui" (room `perkelimui`, not sold on Booking.com)
is a parking spot for moving bookings: it gets no feed and is ignored. Seed label
= the Sirvoy room number, so the owner pastes URL 1 against room 1, and so on.

Seed `external_calendars` with 14 empty inactive rows (label = Sirvoy room
number, stay type from the map above) so the owner only pastes URLs.

## Sync job

- Route `app/api/cron/booking-sync/route.ts`, `Authorization: Bearer $CRON_SECRET`
  checked, runs on Vercel Cron every 15 min (add `vercel.json`; none exists yet).
- For each active calendar: `fetch(feed_url)` with a timeout, parse `VEVENT`s
  (a small parser in `lib/ical.ts` with unit tests: all-day `VALUE=DATE`, line
  folding, `STATUS:CANCELLED`, ignore events that end in the past), then upsert
  via a `security definer` function `sync_external_blocks(calendar_id, blocks jsonb)`
  granted to `service_role` only. It runs in one transaction, so a failed fetch
  leaves the old blocks in place and only sets `last_error`.
- A feed that returns an empty body or a non-iCal page must **not** wipe the
  blocks: require `BEGIN:VCALENDAR` before replacing anything.
- New env vars: `CRON_SECRET` (tell the owner what to add; `.env.example` stays
  in sync). `SUPABASE_SERVICE_ROLE_KEY` is already server-only.

## Admin UI

- **Calendar:** blocks render in the existing stay lanes in a distinct token
  colour with a "Sirvoy" badge, read-only, no customer panel (nothing to
  show). Reuse the existing occupancy rendering; do not add a new calendar.
- **Settings screen** (`/admin/...`, owner): table of the 14 feeds with label,
  apartment (stay type), URL field, last synced, last error, "Sinchronizuoti
  dabar" button (calls the same sync for one calendar). Lithuanian copy, tokens
  only, 44 px targets, React Hook Form + Zod for the URL (must be https and a
  `booking.com` host).
- Data flows through `useAdmin()` and server actions in `app/admin/actions/`
  like every other admin screen (ADR-0007).

## Build order

1. Sirvoy Pro confirmed (2026-11-16; an existing booking webhook to a Google Apps Script is in use, do not touch it; limit is 10). Owner generates the 14 export URLs (8 x Dvivietis, 6 x Ketурvietis).
2. Migration: tables, RLS, `stay_occupancy()` + capacity trigger, `sync_external_blocks`.
   Apply, regenerate `lib/supabase/database.types.ts`.
3. `lib/ical.ts` + tests (`pnpm test`).
4. Cron route + `vercel.json` + `CRON_SECRET`.
5. Admin settings screen, then calendar rendering.
6. Verify in the browser at 375 / 768 / 1024 px, and check /rezervacija greys out a synced night.
7. Docs: [[database]], [[api-architecture]], changelog, catalogs.

## Risks

- Booking.com's refresh delay (15–60 min) allows a short double-booking window. Accepted; staff see the clash in the calendar and resolve it by phone.
- A feed URL leak lets anyone read reservation dates; keep it out of the client bundle and logs.
- Booking.com may rotate a feed URL when sync is re-enabled; the screen shows `last_error` so a dead feed is noticed.
