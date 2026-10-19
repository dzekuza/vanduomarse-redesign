---
tags: [frontend, catalog, stable]
updated: 2026-10-19
---

# Utils Catalog

Helpers and business rules live in `lib/` (`lib/admin/` for the dashboard). Keep
them pure and typed; anything with client state belongs in a hook instead.

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
| `bookingsToCsv` / `toCsv` / `csvCell` / `exportFileName` | `lib/admin/export.ts` | `(bookings: Booking[]) => string` / `(prefix, dayKey) => string` | Excel-ready CSV (UTF-8 BOM, `;`, decimal comma, Lithuanian headers); quotes `;` `"` and line breaks, defuses formula-like cells |
| `downloadText` | `lib/download.ts` | `(text, fileName, type?) => void` | Client-only: save a string as a file via a Blob link |
| `seedBookings` / `seedInquiries` / `seedEvents` / `seedPrices` | `lib/admin/mock-data.ts` | `(today: Date) => T[]` | Deterministic demo data for the admin store |
| `useNavCounts` | `components/admin/use-nav-counts.ts` | `() => { pendingBookings, newInquiries }` | Badge counts shared by sidebar and bottom bar |
| `useIsMobile` | `hooks/use-mobile.ts` | `(breakpoint = 768) => boolean` | Media-query hook (`useSyncExternalStore`) |
| `saunaBookingAt` / `staysOn` / `freeStartHours` / `freeHoursFrom` / `fullCabinNights` / `nextReference` | `lib/admin/occupancy.ts` | `(bookings, blocks?, rates?, day, …)` | Admin availability: who holds a slot, free starts and run length, full cabin nights, next PM-/MM- number |
| `upsellTotal` / `upsellMax` / `upsellSummary` | `lib/sauna-upsells.ts` | `(upsell, qty, {partySize, hours}) => number` etc. | Price and describe sauna extras by unit |
| `roomPrice` / `roomLabel` / `freeCabins` / `cabinReference` | `lib/cabin.ts` | `(roomId, size) => number` / `(roomId, size) => string` / `(checkIn, nights, size) => number` / `(dateK, roomId, nights) => string` | Cabin sizes (`CABIN_SIZES`: 8 × 2 asm. at 50 €, 6 × 4 asm. at 60 €), camper rate, pseudo-availability for the public flow |
| `CONTACTS` / `MAIN_CONTACT` / `MAPS_URL` / `telHref` | `lib/contacts.ts` | `(phone: string) => string` | Park contact details shared by `ContactBar`, `SiteFooter` and `FindUs`; `telHref` strips spaces for `tel:` links |
| `upcomingEvents` | `lib/sauna-events.ts` | `(from: Date, days: number) => SaunaEvent[]` | Expand weekly public sessions into dated events |

## Related

[[folder-structure]]
