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
| `/netrukus` | Coming-soon gate page (`ComingSoon`, `GateCodeForm`). While `site_settings.coming_soon` is on (owners switch it at `/admin/svetaine`, ADR-0068) the proxy rewrites every public path here with a 503 (URL unchanged); `/admin`, `/api`, static files stay open; a browser with the preview-code cookie passes. With the gate off it redirects to `/`. Not indexed. ADR-0037. | stable |
| `/kuponai` | `BookingPage` + `.theme-reservation` + `BookingHeader` + `CouponShop` (steps, picker, sticky order form, confirmation). The intro describes one-time use of paper coupons and suggests several smaller denominations for larger gifts. Products come from `getCouponProducts()` and orders wait for staff to confirm payment. | stable |
| `/registracija` | `BookingPage` + `.theme-reservation` + `BookingHeader` + `RegistrationFlow` (`components/registration/`): 3 steps (contacts, a required camera/file photo, both rule documents + a canvas signature pad), then `registerRider` (`app/actions/registration.ts`). Public self-registration ahead of a till visit (ADR-0043); no phone verification, a honeypot field like the other public forms | new |
| `/kuponai/apmoketa` | Where Stripe returns a coupon buyer (`?sid=` Checkout Session id): `CouponPaymentStatus` shows paid (code emailed), still checking (`PaymentPoller`) or cancelled. Reads only; the webhook issues the code. Not indexed. ADR-0075. | stable |
| `/paskyra` | Nav label and title "Mano rezervacijos". `BookingPage` + `BookingHeader` + `AccountLogin` (signed out) or `RequestList` (left, two columns) + `ProfileCard` (right) when signed in. Code sign-in, own reservations with status and payment, name, sign out. Not indexed. ADR-0027. | stable |
| `/rezervacija/mokejimas` | Return page of the Stripe Checkout (`PaymentStatus`): paid, being checked, cancelled (the slots are freed at once, ADR-0077; "pay again" only if that release failed), expired or refunded. Not indexed. ADR-0026. | stable |
| `/keturraciai` | Noindex quad tour showcase with a link to the live booking panel at `/keturraciu-nuoma#rezervuoti`. | stable |
| `/rezervacija` | `BookingPage` and streamed `ReservationFlow`. The plan combines sauna, stays and scheduled quad tours from the live catalogues, then opens verified contact and checkout. WAKE offers use the same coupon order panel as `/vandenlentes`. | stable |
| `/renginiai` | `BookingPage` + `EventsBoard`; data from `getParkEvents()`. Sauna ticket links open the selected session on `/pirtis`. | stable |
| `/pirtis`, `/nakvyne`, `/keturraciu-nuoma`, `/restoranas`, `/vandenlentes`, `/sventes`, `/vestuves`, `/imoniu-renginiai`, `/gimtadieniai` | Allowlisted `ServicePage` with gallery, details, pricing, schedule, FAQ and a booking or contact sidebar. `/pirtis` uses admin-managed durations and attendants. `/nakvyne` opens the calendar after the guest chooses a stay type and shows availability for that type before checkout. `/keturraciu-nuoma` books scheduled tour departures. `/vandenlentes` orders rides and season passes through the coupon catalogue. `/sventes` shows the sidebar calculator and 60-day celebration calendar, with generic markers for private dates. | stable |
| `/skaiciuokle` | Permanent redirect (308) to `/sventes`, set in `next.config.ts`. The standalone calculator page and `EventCalculator` were removed; the calculator lives on the celebrations page (`CelebrationCalculator`, in the `#rezervuoti` panel). |
| `/embed/pirtis`, `/embed/keturraciai`, `/embed/miegas`, `/embed/renginiai`, `/embed/kuponai` | `app/embed/layout.tsx` (`EmbedFrame`, noindex) + the bare booking component of the matching page (same data reads, same `?skirtukas=`); no header, footer, hero or sticker dock. Framed by the WordPress plugin; only `EMBED_ALLOWED_ORIGINS` may frame them (ADR-0014) | stable |
| `/admin` (+ `/rezervacijos`, `/uzklausos`, `/keturraciai`, `/kuponai`, `/nuolaidos`, `/renginiai`, `/pirtis`, `/kainos`, `/apyrankes`, `/klientai`, `/klientai/[id]`, `/instruktorius`) | `app/admin/layout.tsx` (noindex metadata) → `app/admin/(panel)/layout.tsx` (staff check, `loadAdminData`, sidebar shell, `AdminStoreProvider`) + one view per page. Pirtis/Namukai/Keturračiai are expandable sidebar **domains**, not single routes — each expands to a Kalendorius and a Valdymas child page (`admin-nav.ts`'s `ADMIN_NAV_DOMAIN`, ADR-0046) | Supabase, staff login (ADR-0007); each page checks its role permission (`requirePermission`, ADR-0012, now also accepts an array of permissions for merged pages) and bounces to the first page the role allows |
| `/admin/keturraciai?tab=parkas` | `QuadsView`'s "Inventorius" tab (`QuadTypesCard` + `QuadSettingsCard`) — the sidebar's Keturračiai → Valdymas destination (ADR-0046) | `keturraciai` permission |
| `/admin/rezervacijos` | `BookingsView`: "Sąrašas" (table, filters, CSV export) and "Kalendorius" tabs (`BookingCalendarTab` — sauna week grid, nightly cabin/camper strip, now also a quad fleet-load strip, `QuadsStrip`). `?view=kalendorius` opens the Kalendorius tab directly. Replaces the old standalone `/admin/uzimtumas` page, which now 307-redirects here (ADR-0044) | `rezervacijos` or `uzimtumas` permission |
| `/admin/uzimtumas` | Redirect only, to `/admin/rezervacijos?view=kalendorius` (ADR-0044) | `uzimtumas` permission |
| `/admin/apyrankes/[id]` | Redirect only, to `/admin/klientai/[id]` — the Naudotojai tab and its rider profile merged into Klientai (ADR-0044) | `apyrankes` permission |
| `/admin/klientai` | `KlientaiView` (`components/admin/klientai/klientai-view.tsx`): every `riders` row (8,945, mostly Grabby-imported contacts), search, paginated 25/page. Chip filters (Apyrankės/Namukai/Keturračiai, OR'd). Each row also shows the plan badge and a "Priskirti/Pakeisti apyrankę" scan action, absorbed from the old Apyrankės → Naudotojai tab (ADR-0044). Listed under its own "Klientai" sidebar heading | `klientai` or `apyrankes` permission |
| `/admin/klientai/[id]` | `CustomerPage` — profile, a unified Veikla activity timeline, documents, comments; also the canonical rider profile for bracelet/plan data (ADR-0044) | `klientai` or `apyrankes` permission |
| `/admin/klientai/[id]` | `CustomerPage` (`components/admin/klientai/customer-page.tsx`), own page like `/admin/apyrankes/[id]`: Profilis, Veikla (a unified timeline of purchases/bookings/quad rentals/event tickets/coupons), Dokumentai, Komentarai. Profile/documents/comments tabs are the shared `RiderProfileTab`/`RiderDocumentsTab`/`RiderCommentsTab` from `components/admin/rider-profile-tabs.tsx`, also used by `/admin/apyrankes/[id]` | `klientai` permission Owners also get a Rolė tab (make the customer an admin / assign a role, ADR-0051). |
| `/admin/instruktorius` | `InstruktoriusView` (`components/admin/instruktorius/`): scan a bracelet to check a rider in/out of the water (`scanRiderSession`), plus a live "Šiuo metu vandenyje" list of everyone currently out (ADR-0045). Not yet browser-checked | `instruktorius` permission |
| `/admin/darbuotojai` | `StaffView` (tabs Darbuotojai / Rolės). Owner-only: `requirePermission("owner")` | stable |
| `/admin/svetaine` | `SiteSettingsView` (`components/admin/site-settings/`): switch for the public "coming soon" gate; owner-only: `requirePermission("owner")` (ADR-0068) | built, not browser-checked (needs the migration applied) |
| `/admin/pranesimai` | `NotificationsView` (`components/admin/notifications/`): staff SMS recipients, each with topics; owner-only: `requirePermission("owner")` (ADR-0056) | built, not browser-checked |
| `/admin/prisijungti` | `AuthCard` + `LoginForm` (outside the panel group) | stable |


## Conventions

- Route groups `(name)/` for layout grouping without a URL segment.
- `loading.tsx` / `error.tsx` / `not-found.tsx` at every meaningful boundary.
- Navigation via `next/link` and `next/navigation` `useRouter`.
- Public sauna session links use `/pirtis?seansas=<event-id>#rezervuoti` or `/rezervacija?veikla=pirtis&seansas=<event-id>`. Direct visits select the session date and open its details. The browser history changes the dialog URL in place so the reservation plan stays in memory. See ADR-0048 and ADR-0050.

## Related

[[folder-structure]] · [[component-conventions]] · [[seo-metadata]]
