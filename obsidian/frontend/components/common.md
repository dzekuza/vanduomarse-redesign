---
tags: [frontend, catalog, wip]
updated: 2026-10-19
---

# Common Components Catalog

Shared composed components in `components/common/` — built from [[components/ui]]
primitives, reused across features.

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `BrandLogo` | `components/brand-logo.tsx` | Astronaut badge SVG linking home; height via `className` (header h-14/16, footer h-24) | stable |
| `BookingPage` | `components/booking/booking-page.tsx` | Booking route shell: header, content, footer inside `theme-marse` | stable |
| `BookingHero` | `components/booking/booking-hero.tsx` | Eyebrow, uppercase title, intro, facts, bento gallery on the left; booking form (`children`) sticky on the right | stable |
| `StepLabel` | `components/booking/step-label.tsx` | Numbered step heading (`01 PASIRINK DIENĄ`) | stable |
| `BookingTabs` | `components/booking/booking-tabs.tsx` | Accessible segmented tabs (arrow keys, `tablist`/`tabpanel`) above a booking card; optional per-tab count `badge` | stable |
| `SaunaReservation` | `components/booking/sauna-reservation.tsx` | Pirtis tabs: private hire (`SaunaBooking`) or join an event (`SaunaEventBooking`); `initialMode` from `?skirtukas=renginiai` | stable |
| `SaunaEventBooking` | `components/booking/sauna-event-booking.tsx` | Pick a public session (`EventList`), choose tickets, confirm | stable |
| `EventList` | `components/booking/event-list.tsx` | Radio-group rows of upcoming sessions with spots left and price | stable |
| `BookingCard` / `BookingTotal` | `components/booking/booking-card.tsx` | Outlined form shell with summary + action footer bar | stable |
| `Receipt` | `components/booking/receipt.tsx` | Ticket-style confirmation used by every booking flow; takes a `calendar` entry | stable |
| `AddToCalendar` | `components/booking/add-to-calendar.tsx` | Google Calendar link + `.ics` download for a booking | stable |
| `EventsBoard` | `components/events/events-board.tsx` | Renginiai feed: category filter chips with counts, month-grouped `EventRow`s | stable |
| `EventRow` | `components/events/event-row.tsx` | Date block, category tag, details, spots left, price and CTA link | stable |
| `CategoryTag` | `components/events/category-tag.tsx` | Coloured uppercase chip per event category | stable |
| `BentoGallery` | `components/booking/bento-gallery.tsx` | Up to 5 photos: 2x2 lead tile plus four small tiles, hover zoom; one image goes full width | stable |
| `MasterPicker` | `components/booking/master-picker.tsx` | Pirtininkas needed or not; shows add-on total for the chosen hours | stable |
| `StartTimeGrid` | `components/booking/start-time-grid.tsx` | Hourly start times; disabled when the 2 h minimum does not fit | stable |
| `DurationPicker` | `components/booking/duration-picker.tsx` | 2-6 h options from the start, each with end time and price | stable |
| `ChoiceTile` | `components/booking/choice-tile.tsx` | Two-line selectable tile (active / idle / disabled) | stable |
| `ArrowButton` | `components/booking/arrow-button.tsx` | Live-site CTA: dark block, thin arrow, uppercase label | stable |

## Related

[[component-conventions]] · [[components/ui]]
