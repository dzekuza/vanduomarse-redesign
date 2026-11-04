---
tags: [frontend, stable]
updated: 2026-11-04
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
| `/rezervacija` | `BookingPage` + `BookingHeader` + `ReservationFlow` (no phone gate any more, ADR-0027). Date, then sauna, quads or stay, then sign in or create an account with a phone or email code, then review and pay. Stays use a quantity of one cabin size or camper pitch per request. Quad rentals can combine types for one shared slot. All three public availability loaders share a 60-day Vilnius booking window. The calendar can browse 12 months, with dates outside the booking window disabled. Cabin occupancy also covers the nights after the last check-in. Availability rows use stable paging. See ADR-0021. | stable |
| `/renginiai` | `BookingPage` + `EventsBoard`; data from `getParkEvents()` | stable |
| `/skaiciuokle` | `BookingPage` + `.theme-reservation` wrapper + `BookingHeader` + `EventCalculator` (header and questions left, sticky `EstimateSummary` right) | stable |
| `/embed/pirtis`, `/embed/keturraciai`, `/embed/miegas`, `/embed/renginiai`, `/embed/kuponai` | `app/embed/layout.tsx` (`EmbedFrame`, noindex) + the bare booking component of the matching page (same data reads, same `?skirtukas=`); no header, footer, hero or sticker dock. Framed by the WordPress plugin; only `EMBED_ALLOWED_ORIGINS` may frame them (ADR-0014) | stable |
| `/admin` (+ `/rezervacijos`, `/uzimtumas`, `/uzklausos`, `/keturraciai`, `/kuponai`, `/renginiai`, `/pirtis`, `/kainos`) | `app/admin/layout.tsx` (noindex metadata) → `app/admin/(panel)/layout.tsx` (staff check, `loadAdminData`, sidebar shell, `AdminStoreProvider`) + one view per page | Supabase, staff login (ADR-0007); each page checks its role permission (`requirePermission`, ADR-0012) and bounces to the first page the role allows |
| `/admin/darbuotojai` | `StaffView` (tabs Darbuotojai / Rolės). Owner-only: `requirePermission("owner")` | stable |
| `/admin/prisijungti` | `AuthCard` + `LoginForm` (outside the panel group) | stable |


## Conventions

- Route groups `(name)/` for layout grouping without a URL segment.
- `loading.tsx` / `error.tsx` / `not-found.tsx` at every meaningful boundary.
- Navigation via `next/link` and `next/navigation` `useRouter`.

## Related

[[folder-structure]] · [[component-conventions]] · [[seo-metadata]]
