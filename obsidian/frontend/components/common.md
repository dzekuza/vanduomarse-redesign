---
tags: [frontend, catalog, stable]
updated: 2026-10-30
---

# Common Components Catalog

Composed components across the site and admin: site sections in `components/`,
feature components in `components/<feature>/`. Admin screens build on
[[components/ui]] primitives.

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `MobileMenu` | `components/mobile-menu.tsx` | Below `lg`: 44 px menu button + full-width link panel under the sticky header; Escape closes | stable |
| `ArrowLink` | `components/arrow-link.tsx` | Link version of the live-site CTA (dark block, thin arrow, uppercase); `sm`/`md`; `pill` makes the ends fully rounded (landing page) | stable |
| `Hero` | `components/hero.tsx` | Home hero (Max Bennet look): giant `DistortWordmark` H1, three-column uppercase meta row, pill `ArrowLink` + outline "Visos zonos" pill; blocks fade up on load in a `delay-*` cascade (`motion-safe:` only) | stable |
| `DistortWordmark` | `components/distort-wordmark.tsx` + `lib/distort-gl.ts` | Hero wordmark: real `Wordmark` h1 stays in the DOM; on fine-pointer devices a WebGL canvas (colour read from `text-rust`) redraws it and melts the letters around the cursor (streaky smear + stippled edges). Plain text on touch, `prefers-reduced-motion` or no WebGL; render loop only runs while the pointer is over it | stable |
| `Wordmark` | `components/wordmark.tsx` | "VANDUO MARSE" in Big Shoulders Black, coral, fitted to its container (`wordmark-fit` + `wordmark-size`, cqw units): two lines below `md`, one line from `md`. `as="h1"` on the hero, `aria-hidden` repeat in the footer | stable |
| `SectorTiles` | `components/sector-tiles.tsx` | `#zonos`: the six sectors as rounded photo tiles (wide / 2-up / 2-up / wide from `md`, stacked below) with tag pill, name, blurb on an ink gradient; tiles with `id` keep the `/#akademija` and `/#skoniai` anchors. Photos are placeholder Unsplash images until real ones exist | stable |
| `TrackStats` | `components/track-stats.tsx` | Park numbers (620 m, 6, 17, 8) as oversized coral figures in a `dl`, 2 cols below `lg`, 4 from `lg` (numerals `7xl` → `8xl` at `md` → `9xl` at `xl`, so "620 m" never collides with the next figure) | stable |
| `StatusBar` | `components/status-bar.tsx` | Rounded `bg-card` block: pulsing status line (half width from `lg`) + one labelled day/time list per season (`dl`, tabular numbers); stacks below `md` | stable |
| `ContactBar` | `components/contact-bar.tsx` | Thin blush strip above `SiteHeader` (rendered by it): main phone (`tel:`), email (icon-only below `sm`), map link ("Žemėlapis" / address from `md`); scrolls away, header stays sticky | stable |
| `StickerDock` | `components/sticker-dock.tsx` | Zone stickers (Vanduo, Akademija, Skoniai, Miegas) from `public/brand/sticker-*.svg`: frosted glass (`bg-foam/50` + `backdrop-blur-xl backdrop-saturate-150`); full-width bottom bar below `lg`, floating hug-width dock 24 px above the edge from `lg`; active page raised; hidden in `/admin` and `/embed`, and below `lg`, on `/skaiciuokle` (own bottom bar). Rendered in the root layout | stable |
| `BrandLogo` | `components/brand-logo.tsx` | Astronaut badge SVG linking home; height via `className` (header h-11/12; no longer in the footer) | stable |
| `QuadReservation` | `components/quads/quad-reservation.tsx` | `/keturraciai` tabs (`BookingTabs`): hourly rental / guided tours (badge = tours with seats) | stable |
| `QuadRules` | `components/quads/quad-rules.tsx` | Bordered "Taisyklės" block with the admin rules text; renders nothing when empty. Used on `/keturraciai` and `/embed/keturraciai` | stable |
| `EmbedFrame` | `components/embed/embed-frame.tsx` | `/embed/*` wrapper (no side padding below `sm`, so it fills narrow blocks; all widgets fit from 285 px): posts `{ type: "vm-embed:height", height }` to the parent on every resize (ResizeObserver); internal links to a booking route open its `/embed` twin in place, any other internal link opens in a new tab | stable |
| `EmbedTheme` | `components/embed/embed-theme.tsx` | Server component on each `/embed` page: renders the validated appearance overrides as a `<style>` plus Google Fonts `<link>`s; nothing when the URL has none | stable |
| `QuadRental` / `QuadTypeStep` / `StartGrid` / `DurationGrid` | `components/quads/` | Day strip (free count per day) → quad type + count + riders → start hours (only while `units` stay free; today's past hours off) → length → contact (RHF + `quadContactSchema`). Submits a request via `createQuadRental`; availability comes from `quad_taken` | stable |
| `TourBooking` | `components/quads/tour-booking.tsx` | Reuses `EventList` (tours mapped to `SaunaEvent`), seats stepper, contact; empty state when no tours | stable |
| `ContactFields` / `RequestConfirmation` | `components/quads/` | Name/phone/email (+ honeypot) via `useFormContext`; ticket-style "request received" panel that says staff still confirm | stable |
| `QuadsView` + `RentalsTab` / `RentalSheet` / `ToursTab` | `components/admin/quads/` | `/admin/keturraciai`: tabs Nuoma / Žygiai / Parkas, status chips, details sheet, tour seat confirmations | stable |
| `StatusActions` | `components/admin/quads/status-actions.tsx` | Confirm/reject, mark done, cancel, reopen buttons by status | stable |
| `NewRentalDialog` | `components/admin/quads/new-rental-dialog.tsx` | Phone/on-site rental: live price, DB refuses full hours (shown inline) | stable |
| `QuadTypesCard` / `QuadTypeDialog` / `QuadSettingsCard` | `components/admin/quads/` | Fleet (units, price, on/off, delete refused once rented) and opening hours, max length, deposit, min age, rules text | stable |
| `CouponIntro` / `CouponShop` | `components/coupons/` | `/kuponai`: intro with 3 steps; `CouponShop` holds the selected product and the ordered state (empty state when nothing is sold) | stable |
| `ProductPicker` | `components/coupons/product-picker.tsx` | Radio tiles grouped into "Vertės kuponai" / "Patirtys" (real radio inputs, `peer-checked` styling, focus ring) | stable |
| `OrderForm` / `OrderConfirmation` | `components/coupons/` | RHF + `couponOrderSchema`; honeypot; server error on `root`. Confirmation says payment is arranged by the team (no online payment yet) | stable |
| `CouponField` | `components/booking/coupon-field.tsx` | "Turite dovanų kuponą?" in the sauna and cabin flows: `checkCoupon`, applied row with discount and what stays on the coupon. `BookingTotal` takes `discount`; `Receipt` shows the code and says the balance is deducted on arrival | stable |
| `CouponsView` / `CouponCard` / `CouponSheet` / `CouponActions` | `components/admin/coupons/` | `/admin/kuponai`: status chips + search (code, ref, name, email), cards, details sheet; actions by status: mark paid + email, redeem, resend, cancel (inline confirm) | stable |
| `RedeemForm` | `components/admin/coupons/redeem-form.tsx` | Amount (≤ balance) + note, remounted when the balance changes | stable |
| `CouponProductsCard` / `ProductDialog` | `components/admin/coupons/` | Catalogue editor: price, on/off, kind + service, delete (refused once sold) | stable |
| `CouponStatusBadge` | `components/admin/status-badge.tsx` | Coupon status pill (pending pulses) | stable |
| `AdminStoreProvider` / `useAdmin` | `components/admin/admin-store.tsx` | Admin data from the layout (`initial`) + optimistic actions over server actions; resets when the layout re-renders (ADR-0007) | stable |
| `AuthCard` / `LoginForm` / `NoAccess` | `components/admin/auth/` | Login page card, RHF + Zod email/password form (`signIn` action), "no access" screen for non-staff with sign-out | stable |
| `AppSidebar` / `AdminHeader` / `AdminPage` | `components/admin/` | Admin shell: desktop sidebar with live badges, staff name, **role name**, change-password key and „Atsijungti", sticky top bar (badge logo below `lg`; "Nauja rezervacija" only with `rezervacijos`), page heading. Menu items come from `visibleNav(me)`: only the pages the role opens | stable |
| `AdminBottomNav` | `components/admin/admin-bottom-nav.tsx` | Below `lg`: fixed bottom tab bar (visible items with `primary`; the centre "+" only with `rezervacijos`) + "Daugiau" bottom sheet for the rest, incl. „Keisti slaptažodį" and „Atsijungti" | stable |
| `ChangePasswordDialog` | `components/admin/change-password-dialog.tsx` | Any staff member sets their own password (8-72 chars, confirm field); opened from the sidebar key and the more sheet | stable |
| `StaffView` / `StaffList` / `AddStaffDialog` / `CredentialsPanel` | `components/admin/staff/` | `/admin/darbuotojai` (owner-only): staff cards with role select, active switch, reset password, remove; the add dialog creates the login and shows the temporary password once with copy buttons | stable |
| `RolesTab` / `RoleDialog` | `components/admin/staff/` | Roles with their page chips and member counts; dialog = name, description and one switch per admin page with a plain-language hint. The Owner role is fixed; deleting a role in use is refused | stable |
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
| `BookingTabs` | `components/booking/booking-tabs.tsx` | Accessible segmented tabs (arrow keys, `tablist`/`tabpanel`) above a booking card; optional per-tab count `badge` (wraps under the label in narrow widths); colours from the `--tab*` tokens | stable |
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
| `Stepper` | `components/booking/stepper.tsx` | Label + −/value/+ (44 px buttons) between `min` and `max`; the controls wrap under a long label in narrow widths | stable |
| `UpsellPicker` | `components/booking/upsell-picker.tsx` | Active sauna extras: on/off rows or steppers (capped at group size) with live cost; one column below `sm` that shrinks to fit (`grid-cols-1`) | stable |
| `StartTimeGrid` | `components/booking/start-time-grid.tsx` | Hourly start times from the live rates showing the longest bookable run (taken hours from `sauna_taken_hours()`); disabled when the minimum does not fit ("Užimta") or, today, when the hour has passed (`pastHour`, "Praėjo") | stable |
| `DurationPicker` | `components/booking/duration-picker.tsx` | Min–max hour options from the live rates, each with end time and price for the group size | stable |
| `DayPicker` | `components/booking/day-picker.tsx` | Sideways date strip; optional `note` adds a third line (e.g. "liko 3") and can disable a day | stable |
| `CabinSizePicker` | `components/booking/cabin-size-picker.tsx` | Namelis 2 / 4 asmenims with nightly price and cabins left for the stay; booked-out size disabled | stable |
| `ChoiceTile` | `components/booking/choice-tile.tsx` | Two-line selectable tile (active / idle / disabled) | stable |
| `ArrowButton` | `components/booking/arrow-button.tsx` | Live-site CTA: dark block, thin arrow, uppercase label | stable |

## Related

[[component-conventions]] · [[components/ui]]
