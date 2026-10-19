---
tags: [frontend, stable]
updated: 2026-10-19
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
| `/pirtis` | `BookingPage` + `BookingHero` + `SaunaReservation`; `?skirtukas=renginiai` opens the events tab | stable |
| `/miegas` | `BookingPage` + `BookingHero` + `CabinBooking` | stable |
| `/renginiai` | `BookingPage` + `EventsBoard` | stable |
| `/skaiciuokle` | `BookingPage` + `EventCalculator` | stable |
| `/admin` (+ `/rezervacijos`, `/uzimtumas`, `/uzklausos`, `/renginiai`, `/pirtis`, `/kainos`) | `app/admin/layout.tsx` (sidebar shell, `AdminStoreProvider`, noindex) + one view per page | UI-first, mock data, **no auth** (ADR-0005) |


## Conventions

- Route groups `(name)/` for layout grouping without a URL segment.
- `loading.tsx` / `error.tsx` / `not-found.tsx` at every meaningful boundary.
- Navigation via `next/link` and `next/navigation` `useRouter`.

## Related

[[folder-structure]] · [[component-conventions]] · [[seo-metadata]]
