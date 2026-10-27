---
tags: [frontend, stable]
updated: 2026-10-22
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
| `/` | `app/page.tsx` (homepage sections, live-brand theme) | stable |
| `/keturraciai` | `BookingPage` + `BookingHero` + `QuadReservation` (tabs: hourly rental / guided tours; `?skirtukas=zygiai` opens tours); data from `getQuadPageData()`; rules block only when set in admin | stable |
| `/kuponai` | `BookingPage` + `CouponIntro` + `CouponShop` (picker, order form, confirmation); products from `getCouponProducts()`; orders wait for staff to confirm payment | stable |
| `/pirtis` | `BookingPage` + `BookingHero` + `SaunaReservation`; `?skirtukas=renginiai` opens the events tab; data from `getSaunaPageData()` | stable |
| `/miegas` | `BookingPage` + `BookingHero` + `CabinBooking`; data from `getCabinPageData()` | stable |
| `/renginiai` | `BookingPage` + `EventsBoard`; data from `getParkEvents()` | stable |
| `/skaiciuokle` | `BookingPage` + `EventCalculator` | stable |
| `/admin` (+ `/rezervacijos`, `/uzimtumas`, `/uzklausos`, `/keturraciai`, `/kuponai`, `/renginiai`, `/pirtis`, `/kainos`) | `app/admin/layout.tsx` (noindex metadata) → `app/admin/(panel)/layout.tsx` (staff check, `loadAdminData`, sidebar shell, `AdminStoreProvider`) + one view per page | Supabase, staff login (ADR-0007); each page checks its role permission (`requirePermission`, ADR-0012) and bounces to the first page the role allows |
| `/admin/darbuotojai` | `StaffView` (tabs Darbuotojai / Rolės). Owner-only: `requirePermission("owner")` | stable |
| `/admin/prisijungti` | `AuthCard` + `LoginForm` (outside the panel group) | stable |


## Conventions

- Route groups `(name)/` for layout grouping without a URL segment.
- `loading.tsx` / `error.tsx` / `not-found.tsx` at every meaningful boundary.
- Navigation via `next/link` and `next/navigation` `useRouter`.

## Related

[[folder-structure]] · [[component-conventions]] · [[seo-metadata]]
