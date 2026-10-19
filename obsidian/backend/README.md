---
tags: [backend, stable]
updated: 2026-10-19
---

# Backend Overview

What backend surface `vanduomarse-redesign` has, and what it deliberately does not.

## Surface

| Concern | Implementation | Note |
|---------|----------------|------|
| API | none yet — planned: server actions for bookings and inquiries | [[api-architecture]] |
| Database | none yet — planned: Supabase (tables listed in the note) | [[database]] |
| Auth | none — `/admin` is open (noindex). Planned: Supabase auth via `@supabase/ssr` | [[decisions-log]] ADR-0005 |
| Storage | none (photos are Unsplash stand-ins, logo in `public/brand/`) | |
| Email | none — inquiries use `mailto:` links | |
| Background jobs | none | |

## Related

[[api-architecture]] · [[database]] · [[environment-variables]]
