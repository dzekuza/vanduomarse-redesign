---
tags: [architecture, stable]
updated: 2026-10-19
---

# System Overview

## What it is

A Next.js 16 App Router site for the Vanduo Marse cable park. Public pages are
in Lithuanian and styled with the park's live brand (`theme-marse`). A staff
dashboard at `/admin` manages bookings, availability, inquiries, events and
prices. Target deployment: Vercel. Backend: none yet (Supabase planned).

## Mental model

Everything is a **front-end prototype with real business rules**. Prices and
rules are real (from the client's 2026–27 sheet) and live in `lib/`; data
(bookings, events, inquiries) is generated or held in the browser. Public
pages compute prices from `lib/` constants; the admin edits a copy of those
values in an in-memory store. Connecting Supabase means replacing `lib/`
constants and the admin store with DB reads/writes — screens stay as they are.

## Request lifecycle

Browser → `app/<route>/page.tsx` (Server Component: metadata, static shell) →
a client component for anything interactive (booking flows, calculator,
events board, every admin view). No API routes or server actions exist yet;
`/pirtis` reads `searchParams` (`?skirtukas=renginiai`) and is the only
dynamic route.

## Boundaries

| Concern | Owned by | Notes |
|---------|----------|-------|
| Routing | `app/` | pages compose components directly, no `views/` layer — see [[routing]] |
| Public UI | `components/`, `components/booking|events|calculator/` | see [[components/common]] |
| Admin UI | `components/admin/` + `components/ui/` (shadcn) | see [[components/ui]] |
| Business rules & prices | `lib/` | see [[utils]] |
| Admin data | `components/admin/admin-store.tsx` | in-memory, ADR-0005 — see [[data-flow]] |
| Secrets | none yet | see [[environment-variables]] |

## Related

[[tech-stack]] · [[folder-structure]] · [[data-flow]]
