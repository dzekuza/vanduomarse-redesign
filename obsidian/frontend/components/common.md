---
tags: [frontend, catalog, stable]
updated: 2026-10-22
---

# Common Components Catalog

Composed components across the site and admin: site sections in `components/`,
feature components in `components/<feature>/`. Admin screens build on
[[components/ui]] primitives.

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `MobileMenu` | `components/mobile-menu.tsx` | Below `lg`: 44 px menu button + full-width link panel under the sticky header; Escape closes | stable |
| `ArrowLink` | `components/arrow-link.tsx` | Link version of the live-site CTA (dark block, thin arrow, uppercase); `sm`/`md` | stable |
| `Hero` | `components/hero.tsx` | Home hero: 7/5 split from `lg` (stacked below). Rust-tick eyebrow, H1, short lede, `ArrowLink` + 44 px "Visos zonos" link; blocks fade up on load in a `delay-*` cascade (`motion-safe:` only) | stable |
| `TrackPanel` | `components/track-panel.tsx` | Ink figure beside the hero copy: `CableLoop` in foam + the park numbers (620 m, 6 bokštai, 17 kliūčių, 8 raiteliai) as a `dl`, 2 cols on phones and `lg`, 4 cols `sm`–`md` | stable |
| `CableLoop` | `components/cable-loop.tsx` | 6-tower loop SVG with the orbiting rider (`.cable-rider` in `globals.css`); lines use `currentColor`, rider `fill-rust` | stable |
| `ContactBar` | `components/contact-bar.tsx` | Dark strip above `SiteHeader` (rendered by it): main phone (`tel:`), email (icon-only below `sm`), map link ("Žemėlapis" / address from `md`); scrolls away, header stays sticky | stable |
| `StickerDock` | `components/sticker-dock.tsx` | Zone stickers (Vanduo, Akademija, Skoniai, Miegas) from `public/brand/sticker-*.svg`: frosted glass (`bg-foam/50` + `backdrop-blur-xl backdrop-saturate-150`); full-width bottom bar below `lg`, floating hug-width dock 24 px above the edge from `lg`; active page raised; hidden in `/admin` and, below `lg`, on `/skaiciuokle` (own bottom bar). Rendered in the root layout | stable |
| `BrandLogo` | `components/brand-logo.tsx` | Astronaut badge SVG linking home; height via `className` (header h-14/16, footer h-24) | stable |
| `AdminStoreProvider` / `useAdmin` | `components/admin/admin-store.tsx` | Admin data from the layout (`initial`) + optimistic actions over server actions; resets when the layout re-renders (ADR-0007) | stable |
| `AuthCard` / `LoginForm` / `NoAccess` | `components/admin/auth/` | Login page card, RHF + Zod email/password form (`signIn` action), "no access" screen for non-staff with sign-out | stable |
| `AppSidebar` / `AdminHeader` / `AdminPage` | `components/admin/` | Admin shell: desktop sidebar with live badges, staff name and „Atsijungti", sticky top bar (badge logo below `lg`), page heading | stable |
| `AdminBottomNav` | `components/admin/admin-bottom-nav.tsx` | Below `lg`: fixed bottom tab bar (items with `primary` in `ADMIN_NAV`) + "Daugiau" bottom sheet for the rest, incl. „Atsijungti" | stable |
| `BookingsView` / `BookingSheet` / `BookingActions` | `components/admin/bookings/` | Filters, table, status transitions, details, „Eksportuoti" CSV of the filtered rows | stable |
| `NewBookingDialog` | `components/admin/bookings/new-booking-dialog.tsx` | Staff-entered booking: free slots only, live price, override; saves via `createBooking`, DB conflicts land on the slot field | stable |
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
| `SaunaReservation` | `components/booking/sauna-reservation.tsx` | Pirtis tabs: private hire (`SaunaBooking`) or join an event (`SaunaEventBooking`); `initialMode` from `?skirtukas=renginiai`; takes `SaunaPageData` (rates, extras, taken hours, sessions) from the page | stable |
| `SaunaEventBooking` | `components/booking/sauna-event-booking.tsx` | Pick a public session (`EventList`), choose tickets, confirm | stable |
| `EventList` | `components/booking/event-list.tsx` | Radio-group rows of upcoming sessions with spots left and price | stable |
| `BookingCard` / `BookingTotal` | `components/booking/booking-card.tsx` | Outlined form shell with summary + action footer bar | stable |
| `Receipt` | `components/booking/receipt.tsx` | Ticket-style confirmation used by every booking flow; takes a `calendar` entry | stable |
| `AddToCalendar` | `components/booking/add-to-calendar.tsx` | Google Calendar link + `.ics` download for a booking | stable |
| `EventsBoard` | `components/events/events-board.tsx` | Renginiai feed (published `events`, next 30 days, via `getParkEvents()`): category filter chips with counts, month-grouped `EventRow`s | stable |
| `EventRow` | `components/events/event-row.tsx` | Date block, category tag, details, spots left, price and CTA link | stable |
| `CategoryTag` | `components/events/category-tag.tsx` | Coloured uppercase chip per event category | stable |
| `EventCalculator` | `components/calculator/event-calculator.tsx` | Price calculator form + sticky estimate; mobile total bar | stable |
| `EstimateSummary` | `components/calculator/estimate-summary.tsx` | Grouped estimate lines, range total, per-guest, warnings, mailto inquiry | stable |
| `SpacePicker` | `components/calculator/space-picker.tsx` | Venue cards with capacity/price for the day type; disables too-small spaces | stable |
| `PresetPicker` | `components/calculator/preset-picker.tsx` | Event-type chips that pre-fill a typical setup | stable |
| `OptionToggle` | `components/calculator/option-toggle.tsx` | Full-width on/off add-on row (`role="switch"`) with price hint | stable |
| `BentoGallery` | `components/booking/bento-gallery.tsx` | Up to 5 photos: 2x2 lead tile plus four small tiles, hover zoom; one image goes full width | stable |
| `UpsellPicker` | `components/booking/upsell-picker.tsx` | Active sauna extras: on/off rows or steppers (capped at group size) with live cost | stable |
| `StartTimeGrid` | `components/booking/start-time-grid.tsx` | Hourly start times from the live rates showing the longest bookable run (taken hours from `sauna_taken_hours()`); disabled when the minimum does not fit | stable |
| `DurationPicker` | `components/booking/duration-picker.tsx` | Min–max hour options from the live rates, each with end time and price for the group size | stable |
| `DayPicker` | `components/booking/day-picker.tsx` | Sideways date strip; optional `note` adds a third line (e.g. "liko 3") and can disable a day | stable |
| `CabinSizePicker` | `components/booking/cabin-size-picker.tsx` | Namelis 2 / 4 asmenims with nightly price and cabins left for the stay; booked-out size disabled | stable |
| `ChoiceTile` | `components/booking/choice-tile.tsx` | Two-line selectable tile (active / idle / disabled) | stable |
| `ArrowButton` | `components/booking/arrow-button.tsx` | Live-site CTA: dark block, thin arrow, uppercase label | stable |

## Related

[[component-conventions]] · [[components/ui]]
