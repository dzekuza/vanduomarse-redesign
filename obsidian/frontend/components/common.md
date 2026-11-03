---
tags: [frontend, catalog, stable]
updated: 2026-11-03
---

# Common Components Catalog

Composed components across the site and admin: site sections in `components/`,
feature components in `components/<feature>/`. Admin screens build on
[[components/ui]] primitives.

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `ArrowLink` | `components/arrow-link.tsx` | Link flavour of the dark `Cta` (`size` sm/md); used in the events feed | stable |
| `Wordmark` | `components/wordmark.tsx` | "VANDUO MARSE" in Big Shoulders Black, coral, fitted to its container (`wordmark-fit` + `wordmark-size`). **Unused since the 2026-11 redesign**; kept for reference | stable |
| `LandingProvider` / `useLanding` | `components/landing/landing-provider.tsx` | Client context on `/`: `openService(id)`; owns `ServiceDrawer`. Server sections open it through `ServiceCta` / `ServiceTextCta` (`service-triggers.tsx`); header, hero sticker and footer CTAs are plain `#kryptys` links | stable |
| Home sections | `components/landing/landing-{header,hero,ticker,activities,night,all-in,moments,faq,place,footer}.tsx` | The 2026-11 "Užsuk į Marsą" landing: dark hero (cut photo, orbits, spin star), coral ticker, filterable activity cards (`ActivityBoard`/`ActivityTile`), night photo, coral "viskas vienoje orbitoje" + accordion, snap-scroll gallery (`MomentsGallery`), FAQ, teal location block, footer. Copy lives in `landing/content.ts` (no prices) | stable |
| `Reveal` | `components/reveal.tsx` | Scroll reveal: fades + lifts its children in once via IntersectionObserver. Content already on screen at mount is never hidden; reduced motion never hides anything. Stagger with `delay-*` | stable |
| `MODAL_*` | `components/landing/dialog-motion.ts` | Class strings that give the home dialogs a real enter/exit (the base `ui/dialog` `data-open:` classes do not match Radix's `data-state`) and switch it off under reduced motion | stable |
| `SiteHeader` | `components/site-header.tsx` | Client shell shared by home and inner pages, **fixed to the top** on every page: logo, section links (`lg`+), coral CTA, 44 px menu button, Escape + body scroll lock. Transparent over the hero, solid `bg-ink/95` with blur and a hairline once scrolled 8 px (not while the menu is open). `placement="overlay"` floats over the hero; `"bar"` also reserves its own ink strip in the page flow | stable |
| `PageHeader` | `components/page-header.tsx` | `SiteHeader` for inner pages: `PAGE_NAV` links, "Dovanų kuponai" CTA, menu = `NAV_LINKS` + home anchors | stable |
| `CalculatorDrawer` | `components/landing/calculator-drawer.tsx` | The event price calculator as a drawer, opened from the party drawer's "Apskaičiuok šventės kainą" (`openCalculator()` in `useLanding`, which closes the activity drawer). Ink header pins the live total (`aria-live`) with guests and per-guest price; six question steps + a "Suvestinė" step (breakdown + `InquiryForm`) run through `BookingCard` steps inside `SteppedBooking`. State resets on every open | stable |
| `useEventCalculator` / `CALCULATOR_SECTIONS` | `components/calculator/use-event-calculator.ts`, `calculator-sections.tsx` | Calculator state + estimate, and the six question sections, shared by the `/skaiciuokle` page (all at once, `EventCalculator`) and the drawer (one per step). `EstimateSummary` takes `showTotal` | stable |
| `ServiceDrawer` / `ServiceBooking` | `components/landing/service-drawer.tsx`, `service-booking.tsx` | Activity drawer on the home page (`ui/drawer`, vaul): right-hand panel with 16 px margins from `sm`, bottom sheet with 8 px margins and drag handle on phones. Rounded (`rounded-tile`). Swipeable photo carousel (`ServiceGallery`), copy, facts, then the **real booking form** for sauna (`SaunaReservation`), cabins (`CabinBooking`), quads (`QuadReservation` + rules), behind `PhoneGate` and wrapped in `SteppedBooking`, so each form runs as a stepper. Availability loads when it opens through `loadBookingData` (`app/actions/booking-data.ts`), so `/` stays static. Party, wake and food: contacts (+ calculator for parties). The form area is `data-vaul-no-drag` so day strips scroll without closing it | stable |
| `MenuPanel` | `components/menu-panel.tsx` | Full-screen coral menu: numbered big links, smaller secondary list, email; fades in, links stagger | stable |
| `PageIntro` | `components/page-intro.tsx` | Dark intro band under the header on every inner page: status-dot eyebrow, uppercase title (2nd line coral), intro, optional facts row and extra children, over the hero's grid + orbit; load-in cascade | stable |
| `SiteFooter` / `FooterWord` / `FooterBar` | `components/site-footer.tsx` | Inner-page footer: contact grid (`CONTACTS`), giant "Susitinkam Marse", logo + link row. `FooterWord`/`FooterBar` are reused by the home footer | stable |
| `SectionKicker`, `StarMark`, `Reveal`, `Cta` | `components/` | Shared primitives of the redesign (moved out of `components/landing/`) | stable |
| `Cta` / `textCtaClass` | `components/cta.tsx` | Label-left/arrow-right block button (`coral`/`cream`/`dark`, `small`), link when `href` is set | stable |
| `MenuPanel` | `components/menu-panel.tsx` | Full-screen coral menu: four on-page sections + the booking pages (`BOOKING_LINKS`) | stable |
| `LandingAccordion` | `components/landing/landing-accordion.tsx` | `events` / `faq` variants over `ui/accordion` (`single` or `multiple`) | stable |
| `QuadReservation` | `components/quads/quad-reservation.tsx` | `/keturraciai` tabs (`BookingTabs`): hourly rental / guided tours (badge = tours with seats) | stable |
| `QuadRules` | `components/quads/quad-rules.tsx` | Bordered "Taisyklės" block with the admin rules text; renders nothing when empty. Used on `/keturraciai` and `/embed/keturraciai` | stable |
| `EmbedFrame` | `components/embed/embed-frame.tsx` | `/embed/*` wrapper (no side padding below `sm`, so it fills narrow blocks; all widgets fit from 285 px): posts `{ type: "vm-embed:height", height }` to the parent on every resize (ResizeObserver); internal links to a booking route open its `/embed` twin in place, any other internal link opens in a new tab | stable |
| `EmbedTheme` | `components/embed/embed-theme.tsx` | Server component on each `/embed` page: renders the validated appearance overrides as a `<style>` plus Google Fonts `<link>`s; nothing when the URL has none | stable |
| `QuadRental` / `QuadTypeStep` / `StartGrid` / `DurationGrid` | `components/quads/` | Day strip (free count per day) → quad type + count + riders → start hours (only while `units` stay free; today's past hours off) → length → contact (RHF + `quadContactSchema`). Submits a request via `createQuadRental`; availability comes from `quad_taken` | stable |
| `TourBooking` | `components/quads/tour-booking.tsx` | Reuses `EventList` (tours mapped to `SaunaEvent`), seats stepper, contact; empty state when no tours | stable |
| `ContactFields` / `RequestConfirmation` | `components/quads/` | Name/phone/email (+ honeypot) via `useFormContext`; behind a `PhoneGate` the phone is the verified one (`VerifiedPhoneField`). Ticket-style "request received" panel that says staff still confirm | stable |
| `PhoneGate` | `components/booking/phone-gate.tsx` | Wraps every public booking flow (sauna, cabins, quads, event registration, coupon order form; same in `/embed/*`): until `usePhoneVerification()` has a phone it shows the number → SMS code steps instead of `children` | stable |
| `PhoneNumberStep` / `PhoneCodeStep` | `components/booking/phone-verify-steps.tsx` | The two gate steps in a `BookingCard` (RHF + `phoneNumberSchema` / `phoneCodeSchema`): `requestPhoneCode`, then `confirmPhoneCode` → `setPhoneVerification`. Resend countdown, "Keisti numerį", `autocomplete="one-time-code"` | stable |
| `VerifiedPhoneField` | `components/booking/verified-phone-field.tsx` | Read-only verified phone + "Keisti" (drops the verification) + hidden `verificationToken`; fills the form's phone field (`customerPhone` / `buyerPhone`) so `...contact` spreads carry the token to the action | stable |
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
| `AvailabilityView` / `SaunaGrid` / `StaysStrip` | `components/admin/availability/` | Week (or day, on phones) grid for one sauna (picker when there are several) with close/reopen; cabin occupancy | stable |
| `InquiriesView` / `InquirySheet` / `NoteForm` | `components/admin/inquiries/` | Status chips, cards, sheet with status + notes | stable |
| `EventsView` / `EventDialog` / `DeleteEventDialog` | `components/admin/events/` | Events table, RHF+Zod create/edit, delete confirm | stable |
| `SaunaView` / `SaunasCard` | `components/admin/sauna/` | Sauna list: cover, from-rate, on/off, up/down order, edit link, delete (refused while bookings exist) | stable |
| `SaunaEditor` / `SaunaForm` | `components/admin/sauna/` | `/admin/pirtis/nauja` and `/[id]`: `SaunaDetailsFields` (name, description, features field array, visibility), `SaunaRatesFields` + `PricePreview`, `SaunaUpsellsField` (offered extras); `saunaSchema` | stable |
| `SaunaPhotosCard` | `components/admin/sauna/sauna-photos-card.tsx` | Upload (resized to WebP), reorder, remove; first photo is the cover; saves immediately | stable |
| `SaunaSelect` | `components/admin/sauna/sauna-select.tsx` | Sauna dropdown (hidden ones marked) for Užimtumas and the manual booking form | stable |
| `UpsellsCard` / `UpsellDialog` | `components/admin/sauna/` | Shared extras catalogue: add/edit/hide/delete, unit and max items; shows which saunas offer each | stable |
| `PricingView` / `PriceGroupForm` | `components/admin/pricing/` | Grouped price editor, range validation | stable |
| `BookingStatusBadge` / `InquiryStatusBadge` | `components/admin/status-badge.tsx` | Status chips with brand tones | stable |
| `BookingPage` | `components/booking/booking-page.tsx` | Page shell: header, content, footer (theme now comes from `<body>`) | stable |
| `BookingHero` | `components/booking/booking-hero.tsx` | Dark `PageIntro` (eyebrow, title, intro, 4 facts) then a 2-col section: sticky `BentoGallery` left, booking form right (form first on phones) | stable |
| `StepLabel` | `components/booking/step-label.tsx` | Numbered step heading (`01 PASIRINK DIENĄ`) | stable |
| `BookingCard` steps / `SteppedBooking` | `components/booking/booking-card.tsx`, `stepped.tsx` | `BookingCard` takes `steps` (`id`, `label`, `content`, `ready`). On the booking pages all steps show together as before; inside `SteppedBooking` (the home drawer) one step shows at a time with a progress bar, Back/Next ("Toliau" is disabled while `ready === false`) and the confirm button on the last step. `StepLabel` hides inside a step (the header names it). Cabin, sauna and quad rental flows are built from steps; contact fields stack when their container is narrow (`@xl`) | stable |
| `BookingTabs` | `components/booking/booking-tabs.tsx` | Accessible segmented tabs (arrow keys, `tablist`/`tabpanel`) above a booking card; optional per-tab count `badge` (wraps under the label in narrow widths); colours from the `--tab*` tokens | stable |
| `SaunaReservation` | `components/booking/sauna-reservation.tsx` | Pirtis tabs: private hire (`SaunaBooking`) or join an event (`SaunaEventBooking`); `initialMode` from `?skirtukas=renginiai`; `initialSaunaId` from `?pirtis=`; takes `SaunaPageData` (saunas, extras, taken hours per sauna, sessions) from the page | stable |
| `SaunaHire` | `components/booking/sauna-hire.tsx` | Private hire: `SaunaPicker` as step 1 when 2+ saunas are active, then `SaunaBooking` keyed by sauna (state resets on switch); empty state without saunas | stable |
| `SaunaPicker` | `components/booking/sauna-picker.tsx` | Sauna cards: cover photo (or icon), name, description, feature chips, "nuo X €/val." | stable |
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
| `BentoGallery` | `components/booking/bento-gallery.tsx` | Up to 5 photos. From `md`: a 2x2 lead tile (cut top-left corner) with four tiles beside it. On phones: one wide lead photo with the other four as a row of thumbnails. `quality={90}`, lead is `priority`, `sizes` match each tile's real width; hover zoom is `motion-safe:` | stable |
| `Stepper` | `components/booking/stepper.tsx` | Label + −/value/+ (44 px buttons) between `min` and `max`; the controls wrap under a long label in narrow widths | stable |
| `UpsellPicker` | `components/booking/upsell-picker.tsx` | Active sauna extras: on/off rows or steppers (capped at group size) with live cost; one column below `sm` that shrinks to fit (`grid-cols-1`) | stable |
| `StartTimeGrid` | `components/booking/start-time-grid.tsx` | Hourly start times from the live rates showing the longest bookable run (taken hours from `sauna_taken_hours()`); disabled when the minimum does not fit ("Užimta") or, today, when the hour has passed (`pastHour`, "Praėjo") | stable |
| `DurationPicker` | `components/booking/duration-picker.tsx` | Min–max hour options from the live rates, each with end time and price for the group size | stable |
| `DayPicker` | `components/booking/day-picker.tsx` | Sideways date strip; optional `note` adds a third line (e.g. "liko 3") and can disable a day | stable |
| `CabinSizePicker` | `components/booking/cabin-size-picker.tsx` | Namelis 2 / 4 asmenims with nightly price and cabins left for the stay; booked-out size disabled | stable |
| `ChoiceTile` | `components/booking/choice-tile.tsx` | Two-line selectable tile (active / idle / disabled) | stable |
| `ArrowButton` | `components/booking/arrow-button.tsx` | Primary form button = dark small `Cta` (label left, arrow right); `type`, `disabled`, `onClick` | stable |

## Related

[[component-conventions]] · [[components/ui]]
