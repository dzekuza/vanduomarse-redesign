---
tags: [frontend, catalog, stable]
updated: 2026-10-22
---

# Utils Catalog

Helpers and business rules live in `lib/` (`lib/admin/` for the dashboard). Keep
them pure and typed; anything with client state belongs in a hook instead.

| Util | File | Signature | Purpose |
|------|------|-----------|---------|
| `googleCalendarUrl` | `lib/calendar.ts` | `(ev: CalendarEvent) => string` | Google Calendar "add event" template link |
| `icsContent` | `lib/calendar.ts` | `(ev: CalendarEvent, uid: string) => string` | RFC 5545 `.ics` body (UTC or all-day) |
| `at` | `lib/calendar.ts` | `(day: Date, hour: number, minute?: number) => Date` | Local date-time on a given day |
| `sessionPrice` / `hourRate` | `lib/sauna.ts` | `(hours, partySize, rates?) => number` / `(partySize, rates?) => number` | Sauna price (group-size rate, minimum billed, package when cheaper). Pass the DB `rates`; the default is the sheet snapshot used by the calculator |
| `startHours` / `sessionLengths` / `maxHoursFrom` | `lib/sauna.ts` | `(rates) => number[]` / `(rates) => number[]` / `(taken, start, rates) => number` | Public sauna picker: valid starts, lengths, longest free run given the day's taken hours |
| `todayKey` / `nextDays` / `dateKey` | `lib/sauna.ts` | `(now?) => string` / `(fromKey, count) => Date[]` / `(date) => string` | Vilnius "today" on any server; day strips from a server date; local yyyy-mm-dd |
| `openEventCount` / `toSaunaEvent` / `eventReference` | `lib/sauna-events.ts` | `(events) => number` / `(SaunaEventData) => SaunaEvent` | Tab badge count; server data → `Date`; display-only ticket reference |
| `estimate` / `formatMoney` | `lib/event-pricing.ts` | `(input: EstimateInput) => Estimate` / `(m: Money) => string` | Event price estimate as min–max ranges from the 2026–27 sheet |
| `toParkEvent` / `monthHeading` | `lib/park-events.ts` | `(ParkEventData) => ParkEvent` / `(date) => string` | Server data → `Date`; "Spalis 2026" headings |
| `getSaunaPageData` / `getCabinPageData` / `getParkEvents` | `lib/data/public.ts` (server-only) | `() => Promise<…>` | Public page reads from Supabase (anon, per request) |
| `loadAdminData` / `currentStaff` | `lib/admin/repository.ts` (server-only) | `(supabase) => Promise<AdminData>` / `(supabase) => { user, staff }` | Dashboard reads as the signed-in user; staff check |
| `toBooking` / `toInquiry` / `toManagedEvent` / `toPriceItem` / `toSaunaRates` / `toUpsell` / `toBlock` / `toHHMM` | `lib/admin/mappers.ts` | `(row) => model` | Supabase rows → app models (null → optional, `HH:MM:SS` → `HH:MM`, extras → labels) |
| `createClient` / `createPublicClient` / `supabaseEnv` | `lib/supabase/server.ts` / `public.ts` / `env.ts` | — | Cookie client (acts as the user) / cookieless anon client / env reader |
| `formatDay` / `formatDateTime` / `formatEur` / `bookingWhen` | `lib/admin/format.ts` | `(yyyy-mm-dd) => string` etc. | Admin date and money formatting in site wording |
| `bookingsToCsv` / `toCsv` / `csvCell` / `exportFileName` | `lib/admin/export.ts` | `(bookings: Booking[]) => string` / `(prefix, dayKey) => string` | Excel-ready CSV (UTF-8 BOM, `;`, decimal comma, Lithuanian headers); quotes `;` `"` and line breaks, defuses formula-like cells |
| `downloadText` | `lib/download.ts` | `(text, fileName, type?) => void` | Client-only: save a string as a file via a Blob link |
| `useNavCounts` | `components/admin/use-nav-counts.ts` | `() => { pendingBookings, newInquiries }` | Badge counts shared by sidebar and bottom bar |
| `useIsMobile` | `hooks/use-mobile.ts` | `(breakpoint = 768) => boolean` | Media-query hook (`useSyncExternalStore`) |
| `saunaBookingAt` / `staysOn` / `freeStartHours` / `freeHoursFrom` / `fullCabinNights` | `lib/admin/occupancy.ts` | `(bookings, blocks?, rates?, day, …)` | Admin availability pre-checks before submit (the database has the final say) |
| `upsellTotal` / `upsellMax` / `upsellSummary` | `lib/sauna-upsells.ts` | `(upsell, qty, {partySize, hours}) => number` etc. | Price and describe sauna extras by unit |
| `roomPrice` / `roomLabel` / `freeCabins` / `cabinStayType` / `cabinReference` | `lib/cabin.ts` | `(roomId, size) => number` / `(roomId, size) => string` / `(availability, checkIn, nights, size) => number` / `(size) => string` / `(dateK, roomId, nights) => string` | Cabin sizes (`CABIN_SIZES`: 8 × 2 asm. at 50 €, 6 × 4 asm. at 60 €), camper rate, free cabins from `stay_occupancy()` data |
| `CONTACTS` / `MAIN_CONTACT` / `MAPS_URL` / `telHref` | `lib/contacts.ts` | `(phone: string) => string` | Park contact details shared by `ContactBar`, `SiteFooter` and `FindUs`; `telHref` strips spaces for `tel:` links |

## Related

[[folder-structure]]
