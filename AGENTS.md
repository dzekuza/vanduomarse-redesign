# Vanduo Marse — agent guide

Lithuanian-language site for the Vanduo Marse cable wakeboard park (sauna and
cabin booking, events, an event price calculator) plus a staff dashboard at
`/admin`. Next.js 16 App Router, Tailwind v4, shadcn/ui, TypeScript strict.

**Docs live in `obsidian/` and are the source of truth.** Start at
`obsidian/README.md`, then `obsidian/workflows/ai-agent-guide.md`, then the
topic note for your task. Update the matching notes in the same change
(catalogs, `meta/changelog.md`, an ADR in `meta/decisions-log.md` for
architectural choices).

## Hard rules

1. **Tokens only.** Colours, fonts and radii come from the tokens in
   `app/globals.css` (`ink`, `dust`, `rust`, `foam`, `lake`, shadcn tokens).
   No hex, no arbitrary `text-[…]`/`mt-[…]` values, no `style={{}}`.
   The live-brand theme (`theme-marse`) is applied on `<body>` — don't re-add it.
2. **Reuse first.** Check `components/ui/` (shadcn) and the catalogs in
   `obsidian/frontend/components/` before writing a component. Extract past
   ~150 lines or on the second repetition.
3. **Mobile-first, touch-sized.** Every tap target ≥ 44 px (`min-h-11` /
   `size-11`). Two-column layouts and the inline nav start at `lg`. Choice
   chips wrap; only date strips scroll sideways. Check 375 / 768 / 1024 px.
4. **Lithuanian UI copy**, no i18n library yet. Prices include 21% PVM.
5. **Prices come from one place.** Sauna: `lib/sauna.ts` + `lib/sauna-upsells.ts`.
   Events/spaces: `lib/event-pricing.ts` (transcribed from the client's
   2026–27 sheet; ranges stay ranges). Never hard-code a price in a component.
6. **Admin is UI-first on mock data** (ADR-0005): all reads/writes go through
   `useAdmin()` in `components/admin/admin-store.tsx`. There is **no auth** —
   don't present `/admin` as production-ready.
7. **Forms:** React Hook Form + Zod. Validate shape in the schema, live
   conflicts (availability, capacity) on submit with `setError`.
8. **TypeScript strict**, no `any`; named exports (except Next pages/layouts);
   kebab-case files; Server Components unless interaction needs `"use client"`.
9. **Never edit `.env*`** — say what to add; keep `.env.example` in sync.
   Supabase (planned) follows the global rules: RLS on every table, new
   migrations only.
10. **Verify in the browser** before calling UI work done, and say what you
    could not check.

## Map

| Area | Where |
|------|-------|
| Routes | `app/` — `/`, `/pirtis`, `/miegas`, `/renginiai`, `/skaiciuokle`, `/admin/*` |
| Site sections | `components/*.tsx` (hero, pricing, header, footer, …) |
| Booking flows | `components/booking/` |
| Events feed | `components/events/` |
| Calculator | `components/calculator/` |
| Admin | `components/admin/` (store, shell, one folder per screen) |
| shadcn primitives | `components/ui/` (locally modified — see `obsidian/frontend/components/ui.md`) |
| Domain logic & data | `lib/` (`lib/admin/` for dashboard models, mock data, occupancy) |
| Hooks | `hooks/` |
| Brand assets | `public/brand/` |
| Database (not connected yet) | `supabase/migrations/`, demo `supabase/seed.sql` — see `obsidian/backend/database.md` |

## Commands

```bash
pnpm dev     # http://localhost:3000
pnpm lint
pnpm build
npx tsc --noEmit
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
