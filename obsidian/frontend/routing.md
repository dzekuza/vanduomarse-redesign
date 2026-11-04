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
| `/rezervacija` | `BookingPage` + `BookingHeader` + `ReservationGate` + `ReservationFlow`. Date, then sauna, quads or stay, then contact. Stays use a quantity of one cabin size or camper pitch per request. Quad rentals can combine vehicle types for one shared slot. The sauna group is configured separately. All three public availability loaders share a 60-day Vilnius booking window. The calendar can browse 12 months, with dates outside the booking window disabled. Cabin occupancy also covers the nights after the last check-in. Availability rows use stable paging. See ADR-0021. | stable |
| `/renginiai` | `BookingPage` + `EventsBoard`; data from `getParkEvents()` | stable |
| `/skaiciuokle` | `BookingPage` + `.theme-reservation` wrapper + `BookingHeader` + `EventCalculator` (header and questions left, sticky `EstimateSummary` right). Supplies the current Vilnius date at request time. The event date is optional, with a 60-day strip and a calendar for any future date | stable |
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
