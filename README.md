# Vanduo Marse — website redesign

Redesign of [vanduomarse.lt](https://vanduomarse.lt), a cable wakeboard park in
Lithuania, with the park's live brand (aubergine, blush, coral; wide uppercase
headings) and new booking tools.

## What's here

| Route | What it does |
|-------|--------------|
| `/` | Park homepage: hero, activity cards that open booking drawers (sauna, cabins, quads), party calculator drawer, gallery, FAQ, location |
| `/pirtis` | Private sauna hire (hourly, group-size pricing, extras) or tickets to public sauna sessions |
| `/miegas` | Cabin and camper-pitch booking |
| `/renginiai` | Next 30 days of park and sauna events |
| `/skaiciuokle` | Event price estimator from the 2026–27 price sheet |
| `/admin` | Staff dashboard: bookings (incl. phone bookings), availability, inquiries, events, sauna rates and extras, price list |

> **Status:** prototype on Supabase (project "Vanduo"). Admin edits are saved;
> `/admin` requires a staff login. The database holds **demo** bookings and
> inquiries, and the public booking forms don't save yet
> (see `obsidian/backend/database.md` and ADR-0007).
> Needs `.env.local` — copy `.env.example`.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Checks before committing:

```bash
pnpm lint
npx tsc --noEmit
pnpm build
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn/ui (Radix) · React Hook Form + Zod · Phosphor icons. Planned: Supabase.

## Documentation

All project docs live in the [`obsidian/`](obsidian/README.md) vault (open the
folder in Obsidian, or read the Markdown directly). AI agents start from
[`AGENTS.md`](AGENTS.md); `CLAUDE.md` and `.cursorrules` point there.
