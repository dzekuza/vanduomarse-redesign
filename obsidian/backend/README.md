---
tags: [backend, stable]
updated: 2026-10-22
---

# Backend Overview

What backend surface `vanduomarse-redesign` has, and what it deliberately does not.

## Surface

| Concern | Implementation | Note |
|---------|----------------|------|
| API | none yet — planned: server actions for bookings and inquiries | [[api-architecture]] |
| Database | Supabase migrations in `supabase/` (written and checked, not connected yet) | [[database]] |
| Auth | none — `/admin` is open (noindex). Planned: Supabase auth via `@supabase/ssr`; `public.staff` + `is_staff()` already in the schema | [[decisions-log]] ADR-0005, ADR-0006 |
| Storage | none (photos are Unsplash stand-ins, logo in `public/brand/`) | |
| Email | none — inquiries use `mailto:` links | |
| Background jobs | none | |

## Related

[[api-architecture]] · [[database]] · [[environment-variables]]
