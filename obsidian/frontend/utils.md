---
tags: [frontend, catalog, wip]
updated: 2026-10-19
---

# Utils Catalog

Pure helpers in `src/utils/`. A util is pure, typed, and unit-testable; anything
with I/O or client state belongs in `lib/` or a hook instead.

| Util | File | Signature | Purpose |
|------|------|-----------|---------|
| `googleCalendarUrl` | `lib/calendar.ts` | `(ev: CalendarEvent) => string` | Google Calendar "add event" template link |
| `icsContent` | `lib/calendar.ts` | `(ev: CalendarEvent, uid: string) => string` | RFC 5545 `.ics` body (UTC or all-day) |
| `at` | `lib/calendar.ts` | `(day: Date, hour: number, minute?: number) => Date` | Local date-time on a given day |
| `sessionPrice` / `hourRate` / `maxHoursFrom` | `lib/sauna.ts` | `(hours, partySize, rates?) => number` / `(partySize, rates?) => number` / `(dateKey, start) => number` | Sheet sauna rates (group-size based, 2 h min, 4 h package) and bookable run length |
| `openEventCount` / `startOfToday` | `lib/sauna-events.ts` | `(events) => number` / `() => Date` | Bookable session count for the tab badge; local midnight |
| `estimate` / `formatMoney` | `lib/event-pricing.ts` | `(input: EstimateInput) => Estimate` / `(m: Money) => string` | Event price estimate as min–max ranges from the 2026–27 sheet |
| `parkEvents` / `monthHeading` | `lib/park-events.ts` | `(from: Date, days?: number) => ParkEvent[]` / `(date) => string` | Merged park + sauna event feed; "Spalis 2026" headings |
| `formatDay` / `formatDateTime` / `formatEur` / `bookingWhen` | `lib/admin/format.ts` | `(yyyy-mm-dd) => string` etc. | Admin date and money formatting in site wording |
| `seedBookings` / `seedInquiries` / `seedEvents` / `seedPrices` | `lib/admin/mock-data.ts` | `(today: Date) => T[]` | Deterministic demo data for the admin store |
| `useIsMobile` | `hooks/use-mobile.ts` | `(breakpoint = 768) => boolean` | Media-query hook (`useSyncExternalStore`) |
| `upsellTotal` / `upsellMax` / `upsellSummary` | `lib/sauna-upsells.ts` | `(upsell, qty, {partySize, hours}) => number` etc. | Price and describe sauna extras by unit |
| `upcomingEvents` | `lib/sauna-events.ts` | `(from: Date, days: number) => SaunaEvent[]` | Expand weekly public sessions into dated events |

## Related

[[folder-structure]]
