---
tags: [frontend, stable]
updated: 2026-11-07
---

# Routing

App Router conventions for this project.

## The rule

`app/**/page.tsx` stays small: `metadata` plus composition of feature
components. Interactive parts are client components imported by the page; the
page itself stays a Server Component. Shared page chrome is a component
(`BookingPage` = header + content + footer). Admin pages render one view each
(`<BookingsView />`, `<SaunaView />`, …) inside `app/admin/layout.tsx`.

```tsx
// app/renginiai/page.tsx
export const metadata: Metadata = { title: "Renginiai Marse", description: "…" };
export default function RenginiaiPage() {
  return <BookingPage><EventsBoard /></BookingPage>;
}
```

Every new route: add a row below, set `title` and `description` ([[seo-metadata]]).

## Route map

| Route | View | Status |
|-------|------|--------|
| `/` | `app/page.tsx`: `LandingProvider` + `components/landing/` sections (hero, ticker, activities, night, all-in, gallery, FAQ, place, footer). Activity cards link to their service pages. The all-in section can open the `CalculatorDrawer`; static page | stable |
| `/netrukus` | Coming-soon gate page (`ComingSoon`, `GateCodeForm`). With `SITE_GATE=1` the proxy rewrites every public path here with a 503 (URL unchanged); `/admin`, `/api`, static files stay open; a browser with the preview-code cookie passes. Without the flag it redirects to `/`. Not indexed. ADR-0037. | stable |
| `/kuponai` | `BookingPage` + `.theme-reservation` + `BookingHeader` + `CouponShop` (steps, picker, sticky order form, confirmation). The intro describes one-time use of paper coupons and suggests several smaller denominations for larger gifts. Products come from `getCouponProducts()` and orders wait for staff to confirm payment. | stable |
| `/registracija` | `BookingPage` + `.theme-reservation` + `BookingHeader` + `RegistrationFlow` (`components/registration/`): 3 steps (contacts, a required camera/file photo, both rule documents + a canvas signature pad), then `registerRider` (`app/actions/registration.ts`). Public self-registration ahead of a till visit (ADR-0043); no phone verification, a honeypot field like the other public forms | new |
| `/paskyra` | Nav label and title "Mano rezervacijos". `BookingPage` + `BookingHeader` + `AccountLogin` (signed out) or `RequestList` (left, two columns) + `ProfileCard` (right) when signed in. Code sign-in, own reservations with status and payment, name, sign out. Not indexed. ADR-0027. | stable |
| `/rezervacija/mokejimas` | Return page of the Stripe Checkout (`PaymentStatus`): paid, being checked, cancelled ("pay again"), expired or refunded. Not indexed. ADR-0026. | stable |
| `/keturraciai` | Explicit noindex design preview. `BookingPage`, date-first Mini/Midi/Maxi route cards with individual route-information dialogs, start time, editable quantity and optional accessory dialog, per-route preview totals including accessories, Marse information and 15 temporary supplier photos. Shares the three-card group (three columns from lg) with the reservation quad tab and is linked from the information dialog. ADR-0033. | preview |
| `/rezervacija` | `BookingPage` + `BookingHeader` + `ReservationFlow` (no phone gate any more, ADR-0027). Date, then sauna, quads or stay, then Rezervuoti or Atsiskaitysiu vietoj grynais opens ReservationAccountDialog directly for final phone/email registration, with the activity selection unchanged behind it. The warm-white (`bg-popover`) popup has clearly labelled contact and plan sections, the existing OTP account form and final submit. There is no additional-activity offer, separate confirmation or inline page account step. Real picks use Stripe when configured unless cash on site is selected; cash uses the existing unpaid request path after verified sign-in. Cash choice is UI state without a universal persisted payment-method marker. Supplier quad previews finish locally without creating reservations, regardless of this choice (ADR-0033, ADR-0034, ADR-0035). Closing or editing returns to selection without reserving; active submission blocks dismissal. Stays use a quantity of one cabin size or camper pitch per request. The supplier quad preview shows three Mini/Midi/Maxi route cards after the date, each with its own route-information dialog, time, quantity and optional accessory dialog. Accessory quantities and catalogue prices feed the same preview plan and checkout total. Selecting a card replaces the single picked tour, with independent unselected drafts and live selected-card/sidebar synchronization. The activity strip has a complete outside border. The desktop plan and mobile plan sheet are labelled Rezervuoti and include an active-activity photo carousel; sauna uploads and the Marse sauna gallery are combined without duplicate sources. The sauna group is configured separately. All three public availability loaders share a 60-day Vilnius booking window. The calendar can browse 12 months, with dates outside the booking window disabled. Cabin occupancy also covers the nights after the last check-in. Availability rows use stable paging. See ADR-0021. | stable |
| `/renginiai` | `BookingPage` + `EventsBoard`; data from `getParkEvents()`. Sauna ticket links open the selected session on `/pirtis`. | stable |
| `/pirtis`, `/nakvyne`, `/keturraciu-nuoma`, `/restoranas`, `/vandenlentes`, `/sventes`, `/vestuves`, `/imoniu-renginiai`, `/gimtadieniai` | Allowlisted `app/[service]/page.tsx`. `ServicePage` shows a gallery with thumbnails alongside a sticky booking or contact panel from `lg`, then activity content, pricing, a photo mosaic, schedule, inline reviews and FAQ. `/pirtis` starts with a 2:1 desktop hero. Its booking panel puts the booking type before the inline calendar and time picker. The published session schedule has its own browsing date. Sauna and stay use the existing checkout. The quad panel follows route, date, time and extras, and shares its date with the Vanduo Marse fleet schedule. The quad service sidebar prepares a prefilled email inquiry for staff confirmation. The other pages use contact or event inquiry actions. See ADR-0049 and ADR-0050. | stable |
| `/skaiciuokle` | `BookingPage` + `.theme-reservation` wrapper + `BookingHeader` + `EventCalculator` (header and questions left, sticky `EstimateSummary` right). Supplies the current Vilnius date at request time. The event date is optional, with a 60-day strip and a calendar for any future date | stable |
| `/embed/pirtis`, `/embed/keturraciai`, `/embed/miegas`, `/embed/renginiai`, `/embed/kuponai` | `app/embed/layout.tsx` (`EmbedFrame`, noindex) + the bare booking component of the matching page (same data reads, same `?skirtukas=`); no header, footer, hero or sticker dock. Framed by the WordPress plugin; only `EMBED_ALLOWED_ORIGINS` may frame them (ADR-0014) | stable |
| `/admin` (+ `/rezervacijos`, `/uzklausos`, `/keturraciai`, `/kuponai`, `/nuolaidos`, `/renginiai`, `/pirtis`, `/kainos`, `/apyrankes`, `/klientai`, `/klientai/[id]`, `/instruktorius`) | `app/admin/layout.tsx` (noindex metadata) → `app/admin/(panel)/layout.tsx` (staff check, `loadAdminData`, sidebar shell, `AdminStoreProvider`) + one view per page. Pirtis/Namukai/Keturračiai are expandable sidebar **domains**, not single routes — each expands to a Kalendorius and a Valdymas child page (`admin-nav.ts`'s `ADMIN_NAV_DOMAIN`, ADR-0046) | Supabase, staff login (ADR-0007); each page checks its role permission (`requirePermission`, ADR-0012, now also accepts an array of permissions for merged pages) and bounces to the first page the role allows |
| `/admin/keturraciai?tab=parkas` | `QuadsView`'s "Parkas" tab (`QuadTypesCard` + `QuadSettingsCard`) — the sidebar's Keturračiai → Valdymas destination (ADR-0046) | `keturraciai` permission |
| `/admin/rezervacijos` | `BookingsView`: "Sąrašas" (table, filters, CSV export) and "Kalendorius" tabs (`BookingCalendarTab` — sauna week grid, nightly cabin/camper strip, now also a quad fleet-load strip, `QuadsStrip`). `?view=kalendorius` opens the Kalendorius tab directly. Replaces the old standalone `/admin/uzimtumas` page, which now 307-redirects here (ADR-0044) | `rezervacijos` or `uzimtumas` permission |
| `/admin/uzimtumas` | Redirect only, to `/admin/rezervacijos?view=kalendorius` (ADR-0044) | `uzimtumas` permission |
| `/admin/apyrankes/[id]` | Redirect only, to `/admin/klientai/[id]` — the Naudotojai tab and its rider profile merged into Klientai (ADR-0044) | `apyrankes` permission |
| `/admin/klientai` | `KlientaiView` (`components/admin/klientai/klientai-view.tsx`): every `riders` row (8,945, mostly Grabby-imported contacts), search, paginated 25/page. Chip filters (Apyrankės/Namukai/Keturračiai, OR'd). Each row also shows the plan badge and a "Priskirti/Pakeisti apyrankę" scan action, absorbed from the old Apyrankės → Naudotojai tab (ADR-0044). Listed under its own "Klientai" sidebar heading | `klientai` or `apyrankes` permission |
| `/admin/klientai/[id]` | `CustomerPage` — profile, a unified Veikla activity timeline, documents, comments; also the canonical rider profile for bracelet/plan data (ADR-0044) | `klientai` or `apyrankes` permission |
| `/admin/klientai/[id]` | `CustomerPage` (`components/admin/klientai/customer-page.tsx`), own page like `/admin/apyrankes/[id]`: Profilis, Veikla (a unified timeline of purchases/bookings/quad rentals/event tickets/coupons), Dokumentai, Komentarai. Profile/documents/comments tabs are the shared `RiderProfileTab`/`RiderDocumentsTab`/`RiderCommentsTab` from `components/admin/rider-profile-tabs.tsx`, also used by `/admin/apyrankes/[id]` | `klientai` permission Owners also get a Rolė tab (make the customer an admin / assign a role, ADR-0051). |
| `/admin/instruktorius` | `InstruktoriusView` (`components/admin/instruktorius/`): scan a bracelet to check a rider in/out of the water (`scanRiderSession`), plus a live "Šiuo metu vandenyje" list of everyone currently out (ADR-0045). Not yet browser-checked | `instruktorius` permission |
| `/admin/darbuotojai` | `StaffView` (tabs Darbuotojai / Rolės). Owner-only: `requirePermission("owner")` | stable |
| `/admin/pranesimai` | `NotificationsView` (`components/admin/notifications/`): staff SMS recipients, each with topics; owner-only: `requirePermission("owner")` (ADR-0056) | built, not browser-checked |
| `/admin/prisijungti` | `AuthCard` + `LoginForm` (outside the panel group) | stable |


## Conventions

- Route groups `(name)/` for layout grouping without a URL segment.
- `loading.tsx` / `error.tsx` / `not-found.tsx` at every meaningful boundary.
- Navigation via `next/link` and `next/navigation` `useRouter`.
- Public sauna session links use `/pirtis?seansas=<event-id>#rezervuoti` or `/rezervacija?veikla=pirtis&seansas=<event-id>`. Direct visits select the session date and open its details. The browser history changes the dialog URL in place so the reservation plan stays in memory. See ADR-0048 and ADR-0050.

## Related

[[folder-structure]] · [[component-conventions]] · [[seo-metadata]]
