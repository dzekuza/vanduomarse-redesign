# Vanduo Marse — website redesign

Redesign of [vanduomarse.lt](https://vanduomarse.lt), a cable wakeboard park in
Lithuania, with the park's live brand (aubergine, blush, coral; wide uppercase
headings) and new booking tools.

## What's here

| Route | What it does |
|-------|--------------|
| `/` | Park homepage: hours, zones, prices, equipment |
| `/pirtis` | Private sauna hire (hourly, group-size pricing, extras) or tickets to public sauna sessions |
| `/miegas` | Cabin and camper-pitch booking |
| `/renginiai` | Next 30 days of park and sauna events |
| `/skaiciuokle` | Event price estimator from the 2026–27 price sheet |
| `/admin` | Staff dashboard: bookings (incl. phone bookings), availability, inquiries, events, sauna rates and extras, price list |

> **Status:** front-end prototype. Bookings, inquiries and admin edits run on
> in-browser demo data and reset on reload. `/admin` has **no login** — do not
> deploy it publicly until the Supabase backend and auth are in place
> (see `obsidian/meta/decisions-log.md`, ADR-0005).

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
