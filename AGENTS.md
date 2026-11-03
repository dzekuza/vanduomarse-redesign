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
5. **Prices come from one place.** Sauna rates and extras: Supabase
   (`sauna_settings`, `sauna_upsells`), priced with `lib/sauna.ts` +
   `lib/sauna-upsells.ts`. Cabins: `lib/cabin.ts`. Events/spaces:
   `lib/event-pricing.ts` (the 2026–27 sheet; ranges stay ranges). Never
   hard-code a price in a component.
6. **Data lives in Supabase** (ADR-0007). Admin screens read and write only
   through `useAdmin()` (`components/admin/admin-store.tsx` → server actions in
   `app/admin/actions.ts`), behind staff login (`public.staff`) and the role's page permission (`staff_roles`, ADR-0012: new admin data needs a policy keyed to a page permission). Public pages
   read through `lib/data/public.ts`. No mock or generated data in `lib/`.
7. **Forms:** React Hook Form + Zod. Validate shape in the schema, live
   conflicts (availability, capacity) on submit with `setError`.
8. **TypeScript strict**, no `any`; named exports (except Next pages/layouts);
   kebab-case files; Server Components unless interaction needs `"use client"`.
9. **Never edit `.env*`** (except `.env.example`, kept in sync) — say what to
   add. Supabase follows the global rules: RLS on every table, new migrations
   only, regenerate `lib/supabase/database.types.ts` after schema changes.
10. **Verify in the browser** before calling UI work done, and say what you
    could not check.

## Map

| Area | Where |
|------|-------|
| Routes | `app/` — `/`, `/rezervacija`, `/renginiai`, `/kuponai`, `/skaiciuokle`, `/embed/*`, `/admin/*` |
| Shared shell | `components/*.tsx` (`site-header`, `main-header`, `page-intro`, `site-footer`, `cta`, `reveal`, `menu-panel`) |
| Home page | `components/landing/` (sections, `ServiceDrawer`, `CalculatorDrawer`, `content.ts` copy) |
| Booking flows | `components/booking/` |
| Events feed | `components/events/` |
| Calculator | `components/calculator/` |
| Admin | `components/admin/` (store, shell, one folder per screen) |
| shadcn primitives | `components/ui/` (locally modified — see `obsidian/frontend/components/ui.md`) |
| Domain logic & data | `lib/` (`lib/admin/` models, mappers, repository, occupancy; `lib/data/public.ts` public reads; `lib/supabase/` clients + types) |
| Hooks | `hooks/` |
| Brand assets | `public/brand/` |
| Database | `supabase/migrations/`, demo `supabase/seed.sql`, `proxy.ts` (admin session) — see `obsidian/backend/database.md` |

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
