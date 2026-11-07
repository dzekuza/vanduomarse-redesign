---
tags: [frontend, catalog, stable]
updated: 2026-11-07
---

# Hooks Catalog

Shared hooks live in `hooks/`; feature-only hooks sit next to their feature. Add a row **and** a note (from
[[templates/hook-note]]) when you add a hook.

| Hook | File | Purpose | Client only? |
|------|------|---------|--------------|
| `useIsMobile(breakpoint = 768)` | `hooks/use-mobile.ts` | Media-query flag via `useSyncExternalStore`; admin sidebar passes 1024 | yes |
| `usePhoneVerification()` / `setPhoneVerification()` | `hooks/use-phone-verification.ts` | The tab's verified phone + signed token (`{ phone, token, expiresAt }` or null). One `useSyncExternalStore` store shared by every gate and contact form, persisted in `sessionStorage` (works in the `/embed` iframe; storage errors are swallowed), cleared a minute before expiry. ADR-0018 | yes |
| `useAdmin()` | `components/admin/admin-store.tsx` | Admin data + actions over Supabase server actions (ADR-0007) | yes |
| `useNavCounts()` | `components/admin/use-nav-counts.ts` | Pending bookings / new inquiries for nav badges | yes |
| `useBookingStatus()` | `components/admin/bookings/booking-actions.tsx` | Change a booking's status with a toast | yes |
| `useCardScanner()` | `hooks/use-card-scanner.ts` | USB keyboard-wedge IC/RFID reader: one `document` keydown listener, active while `enabled`, over the framework-agnostic `lib/card-scanner.ts` (`CardScanner`). Ends a scan on Enter or a 500ms idle gap, ≥6 digits, decodes digits from `event.code` so it works under any keyboard layout. `/admin/apyrankes` (ADR-0038) | yes |
| `useElapsed(startedAt, endedAt)` | `hooks/use-elapsed.ts` | Live `"H:MM:SS"`/`"MM:SS"` between two ISO timestamps; ticks every second via `setInterval` while `endedAt` is null, otherwise returns the fixed duration once. `/admin/instruktorius` (ADR-0045) | yes |

## Related

[[component-conventions]] · [[data-flow]]
