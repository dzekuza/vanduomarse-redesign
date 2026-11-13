---
tags: [backend, stable]
updated: 2026-10-22
---

# Backend Overview

What backend surface `vanduomarse-redesign` has, and what it deliberately does not.

## Surface

| Concern | Implementation | Note |
|---------|----------------|------|
| API | Server actions for every admin write (`app/admin/actions/` (by domain)); public pages read via `lib/data/public.ts`; no API routes | [[api-architecture]] |
| Database | Supabase project "Vanduo", migrations applied, **demo data loaded** | [[database]] |
| Auth | Supabase email + password via `@supabase/ssr`; `proxy.ts` gates `/admin/*`, the panel layout checks `public.staff` | [[decisions-log]] ADR-0007 |
| Storage | none (photos are Unsplash stand-ins, logo in `public/brand/`) | |
| Email | none — inquiries use `mailto:` links | |
| Background jobs | none | |

## Related

[[api-architecture]] · [[database]] · [[environment-variables]]
