---
tags: [frontend, catalog, stable]
updated: 2026-10-19
---

# Common Components Catalog

Composed components across the site and admin: site sections in `components/`,
feature components in `components/<feature>/`. Admin screens build on
[[components/ui]] primitives.

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `MobileMenu` | `components/mobile-menu.tsx` | Below `lg`: 44 px menu button + full-width link panel under the sticky header; Escape closes | stable |
| `ArrowLink` | `components/arrow-link.tsx` | Link version of the live-site CTA (dark block, thin arrow, uppercase); `sm`/`md` | stable |
| `BrandLogo` | `components/brand-logo.tsx` | Astronaut badge SVG linking home; height via `className` (header h-14/16, footer h-24) | stable |
| `AdminStoreProvider` / `useAdmin` | `components/admin/admin-store.tsx` | In-memory admin data + actions (ADR-0005) | stable |
| `AppSidebar` / `AdminHeader` / `AdminPage` | `components/admin/` | Admin shell: desktop sidebar with live badges, sticky top bar (badge logo below `lg`), page heading | stable |
| `AdminBottomNav` | `components/admin/admin-bottom-nav.tsx` | Below `lg`: fixed bottom tab bar (items with `primary` in `ADMIN_NAV`) + "Daugiau" bottom sheet for the rest | stable |
| `BookingsView` / `BookingSheet` / `BookingActions` | `components/admin/bookings/` | Filters, table, status transitions, details | stable |
| `NewBookingDialog` | `components/admin/bookings/new-booking-dialog.tsx` | Staff-entered booking: free slots only, live price, override, conflict checks | stable |
| `BookingWhenFields` / `BookingCustomerFields` / `BookingExtrasFields` | `components/admin/bookings/` | Sections of the manual booking form (slot or nights; contact/status/note; sauna extras) | stable |
| `FormField` | `components/admin/form-field.tsx` | Label + control + inline error/hint for admin forms | stable |
| `AvailabilityView` / `SaunaGrid` / `StaysStrip` | `components/admin/availability/` | Week (or day, on phones) sauna grid with close/reopen; cabin occupancy | stable |
| `InquiriesView` / `InquirySheet` / `NoteForm` | `components/admin/inquiries/` | Status chips, cards, sheet with status + notes | stable |
| `EventsView` / `EventDialog` / `DeleteEventDialog` | `components/admin/events/` | Events table, RHF+Zod create/edit, delete confirm | stable |
| `SaunaView` / `SaunaRatesForm` / `PricePreview` | `components/admin/sauna/` | Sauna rates + rules (Zod cross-checks) with live price table | stable |
| `UpsellsCard` / `UpsellDialog` | `components/admin/sauna/` | Manage sauna extras: add/edit/hide/delete, unit and max items | stable |
| `PricingView` / `PriceGroupForm` | `components/admin/pricing/` | Grouped price editor, range validation | stable |
| `BookingStatusBadge` / `InquiryStatusBadge` | `components/admin/status-badge.tsx` | Status chips with brand tones | stable |
| `BookingPage` | `components/booking/booking-page.tsx` | Page shell: header, content, footer (theme now comes from `<body>`) | stable |
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
| `EventCalculator` | `components/calculator/event-calculator.tsx` | Price calculator form + sticky estimate; mobile total bar | stable |
| `EstimateSummary` | `components/calculator/estimate-summary.tsx` | Grouped estimate lines, range total, per-guest, warnings, mailto inquiry | stable |
| `SpacePicker` | `components/calculator/space-picker.tsx` | Venue cards with capacity/price for the day type; disables too-small spaces | stable |
| `PresetPicker` | `components/calculator/preset-picker.tsx` | Event-type chips that pre-fill a typical setup | stable |
| `OptionToggle` | `components/calculator/option-toggle.tsx` | Full-width on/off add-on row (`role="switch"`) with price hint | stable |
| `BentoGallery` | `components/booking/bento-gallery.tsx` | Up to 5 photos: 2x2 lead tile plus four small tiles, hover zoom; one image goes full width | stable |
| `UpsellPicker` | `components/booking/upsell-picker.tsx` | Active sauna extras: on/off rows or steppers (capped at group size) with live cost | stable |
| `StartTimeGrid` | `components/booking/start-time-grid.tsx` | Hourly start times showing the longest bookable run; disabled when the 2 h minimum does not fit | stable |
| `DurationPicker` | `components/booking/duration-picker.tsx` | 2-6 h options from the start, each with end time and price for the group size | stable |
| `ChoiceTile` | `components/booking/choice-tile.tsx` | Two-line selectable tile (active / idle / disabled) | stable |
| `ArrowButton` | `components/booking/arrow-button.tsx` | Live-site CTA: dark block, thin arrow, uppercase label | stable |

## Related

[[component-conventions]] · [[components/ui]]
