---
tags: [frontend, stable]
updated: 2026-11-05
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
| `/` | `app/page.tsx`: `LandingProvider` + `components/landing/` sections (hero, ticker, activities, night, all-in, gallery, FAQ, place, footer). Activity cards open the `ServiceDrawer` (real booking forms, availability via `loadBookingData`), which can open the `CalculatorDrawer`; static page | stable |
| `/apie-marsa` | `BookingPage` + `PageIntro` + `TeamSection`. Introduces the park and its people, with links to public sauna booking. Linked from the desktop header and mobile menu | stable |
| `/kuponai` | `BookingPage` + `.theme-reservation` + `BookingHeader` + `CouponShop` (steps, picker, sticky order form, confirmation); products from `getCouponProducts()`; orders wait for staff to confirm payment | stable |
| `/paskyra` | Nav label and title "Mano rezervacijos". `BookingPage` + `BookingHeader` + `AccountLogin` (signed out) or `RequestList` (left, two columns) + `ProfileCard` (right) when signed in. Code sign-in, own reservations with status and payment, name, sign out. Not indexed. ADR-0027. | stable |
| `/rezervacija/mokejimas` | Return page of the Stripe Checkout (`PaymentStatus`): paid, being checked, cancelled ("pay again"), expired or refunded. Not indexed. ADR-0026. | stable |
| `/keturraciai` | Explicit noindex design preview. `BookingPage`, date-first Mini/Midi/Maxi route cards with individual route-information dialogs, start time and editable quantity, per-route preview totals, Marse information and 15 temporary supplier photos. Shares the three-card group (three columns from lg) with the reservation quad tab and is linked from the information dialog. ADR-0033. | preview |
| `/rezervacija` | `BookingPage` + `BookingHeader` + `ReservationFlow` (no phone gate any more, ADR-0027). Date, then sauna, quads or stay, then Rezervuoti or Atsiskaitysiu vietoj grynais opens ReservationAccountDialog directly for final phone/email registration, with the activity selection unchanged behind it. The warm-white (`bg-popover`) popup has clearly labelled contact and plan sections, the existing OTP account form and final submit. There is no additional-activity offer, separate confirmation or inline page account step. Real picks use Stripe when configured unless cash on site is selected; cash uses the existing unpaid request path after verified sign-in. Cash choice is UI state without a universal persisted payment-method marker. Supplier quad previews finish locally without creating reservations, regardless of this choice (ADR-0033, ADR-0034, ADR-0035). Closing or editing returns to selection without reserving; active submission blocks dismissal. Stays use a quantity of one cabin size or camper pitch per request. The supplier quad preview shows three Mini/Midi/Maxi route cards after the date, each with its own route-information dialog, time and quantity. Selecting a card replaces the single picked tour, with independent unselected drafts and live selected-card/sidebar synchronization. The sauna group is configured separately. All three public availability loaders share a 60-day Vilnius booking window. The calendar can browse 12 months, with dates outside the booking window disabled. Cabin occupancy also covers the nights after the last check-in. Availability rows use stable paging. See ADR-0021. | stable |
| `/renginiai` | `BookingPage` + `EventsBoard`; data from `getParkEvents()` | stable |
| `/skaiciuokle` | `BookingPage` + `.theme-reservation` wrapper + `BookingHeader` + `EventCalculator` (header and questions left, sticky `EstimateSummary` right). Supplies the current Vilnius date at request time. The event date is optional, with a 60-day strip and a calendar for any future date | stable |
| `/embed/pirtis`, `/embed/keturraciai`, `/embed/miegas`, `/embed/renginiai`, `/embed/kuponai` | `app/embed/layout.tsx` (`EmbedFrame`, noindex) + the bare booking component of the matching page (same data reads, same `?skirtukas=`); no header, footer, hero or sticker dock. Framed by the WordPress plugin; only `EMBED_ALLOWED_ORIGINS` may frame them (ADR-0014) | stable |
| `/admin` (+ `/rezervacijos`, `/uzimtumas`, `/uzklausos`, `/keturraciai`, `/kuponai`, `/nuolaidos`, `/renginiai`, `/pirtis`, `/kainos`) | `app/admin/layout.tsx` (noindex metadata) → `app/admin/(panel)/layout.tsx` (staff check, `loadAdminData`, sidebar shell, `AdminStoreProvider`) + one view per page | Supabase, staff login (ADR-0007); each page checks its role permission (`requirePermission`, ADR-0012) and bounces to the first page the role allows |
| `/admin/darbuotojai` | `StaffView` (tabs Darbuotojai / Rolės). Owner-only: `requirePermission("owner")` | stable |
| `/admin/prisijungti` | `AuthCard` + `LoginForm` (outside the panel group) | stable |


## Conventions

- Route groups `(name)/` for layout grouping without a URL segment.
- `loading.tsx` / `error.tsx` / `not-found.tsx` at every meaningful boundary.
- Navigation via `next/link` and `next/navigation` `useRouter`.

## Related

[[folder-structure]] · [[component-conventions]] · [[seo-metadata]]
