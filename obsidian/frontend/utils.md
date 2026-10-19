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
| `sessionPrice` / `maxHoursFrom` | `lib/sauna.ts` | see file | Hourly sauna pricing and bookable run length |
| `openEventCount` / `startOfToday` | `lib/sauna-events.ts` | `(events) => number` / `() => Date` | Bookable session count for the tab badge; local midnight |
| `estimate` / `formatMoney` / `saunaPrice` | `lib/event-pricing.ts` | `(input: EstimateInput) => Estimate` / `(m: Money) => string` | Event price estimate as min–max ranges from the 2026–27 sheet |
| `parkEvents` / `monthHeading` | `lib/park-events.ts` | `(from: Date, days?: number) => ParkEvent[]` / `(date) => string` | Merged park + sauna event feed; "Spalis 2026" headings |
| `upcomingEvents` | `lib/sauna-events.ts` | `(from: Date, days: number) => SaunaEvent[]` | Expand weekly public sessions into dated events |

## Related

[[folder-structure]]
