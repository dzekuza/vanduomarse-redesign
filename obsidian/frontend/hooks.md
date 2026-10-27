---
tags: [frontend, catalog, stable]
updated: 2026-10-22
---

# Hooks Catalog

Shared hooks live in `hooks/`; feature-only hooks sit next to their feature. Add a row **and** a note (from
[[templates/hook-note]]) when you add a hook.

| Hook | File | Purpose | Client only? |
|------|------|---------|--------------|
| `useIsMobile(breakpoint = 768)` | `hooks/use-mobile.ts` | Media-query flag via `useSyncExternalStore`; admin sidebar passes 1024 | yes |
| `useAdmin()` | `components/admin/admin-store.tsx` | Admin data + actions over Supabase server actions (ADR-0007) | yes |
| `useNavCounts()` | `components/admin/use-nav-counts.ts` | Pending bookings / new inquiries for nav badges | yes |
| `useBookingStatus()` | `components/admin/bookings/booking-actions.tsx` | Change a booking's status with a toast | yes |

## Related

[[component-conventions]] · [[data-flow]]
