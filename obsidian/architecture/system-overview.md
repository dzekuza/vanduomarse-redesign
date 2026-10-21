---
tags: [architecture, stable]
updated: 2026-10-22
---

# System Overview

## What it is

A Next.js 16 App Router site for the Vanduo Marse cable park. Public pages are
in Lithuanian and styled with the park's live brand (`theme-marse`). A staff
dashboard at `/admin` manages bookings, availability, inquiries, events and
prices. Target deployment: Vercel. Backend: Supabase (project "Vanduo").

## Mental model

Rules live in `lib/` as pure functions; **data lives in Supabase** (ADR-0007).
Sauna rates, extras, events, bookings, blocks, inquiries and the price list are
rows; the database enforces conflicts (overlaps, capacity) and RLS. Public
pages read availability and catalogue data; staff read and write everything
after logging in. Still on constants: cabin prices/counts (`lib/cabin.ts`,
mirrored in `stay_types`) and the event calculator (`lib/event-pricing.ts`).

## Request lifecycle

Browser → `proxy.ts` (only `/admin/*`: refresh the session, send signed-out
users to `/admin/prisijungti`) → `app/<route>/page.tsx` (Server Component:
reads Supabase) → a client component for anything interactive. Admin writes go
through server actions (`app/admin/actions.ts`); there are no API routes.

## Boundaries

| Concern | Owned by | Notes |
|---------|----------|-------|
| Routing | `app/` | pages compose components directly, no `views/` layer — see [[routing]] |
| Public UI | `components/`, `components/booking|events|calculator/` | see [[components/common]] |
| Admin UI | `components/admin/` + `components/ui/` (shadcn) | see [[components/ui]] |
| Business rules & prices | `lib/` | see [[utils]] |
| Data access | `lib/data/public.ts`, `lib/admin/repository.ts`, `app/admin/actions.ts` | see [[data-flow]], [[database]] |
| Admin state | `components/admin/admin-store.tsx` | server data + optimistic actions |
| Auth | Supabase Auth + `public.staff`, `proxy.ts` | ADR-0007 |
| Secrets | `.env.local` (anon key only) | see [[environment-variables]] |

## Related

[[tech-stack]] · [[folder-structure]] · [[data-flow]]
