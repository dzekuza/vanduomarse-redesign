---
tags: [architecture, stable]
updated: 2026-10-22
---

# Folder Structure

No `src/` directory: folders sit at the repo root (Next's default).

```
app/                    ← routes; pages compose components directly
├── layout.tsx          ← fonts, theme-marse on <body>, site metadata
├── globals.css         ← all tokens (site + shadcn), utilities, theme
├── pirtis/ miegas/ renginiai/ skaiciuokle/
└── admin/              ← dashboard: layout (shell, store) + one page per screen
components/
├── *.tsx               ← site sections (hero, pricing, header, footer, logo…)
├── nav-links.ts        ← public nav items
├── ui/                 ← shadcn/ui primitives (locally modified, see [[components/ui]])
├── booking/            ← /pirtis and /miegas flows, receipts, calendar export
├── events/             ← /renginiai feed
├── calculator/         ← /skaiciuokle
└── admin/              ← store, shell, and a folder per admin screen
hooks/                  ← shared hooks — catalog: [[hooks]]
lib/                    ← business rules, prices, data generators — catalog: [[utils]]
└── admin/              ← admin models, labels, mappers, repository (server), occupancy, formatting
public/brand/           ← logo badge, zone stickers (sticker-*.svg)
supabase/               ← config.toml, migrations/, seed.sql (demo) — see [[database]]
lib/supabase/           ← env, server (cookie) + public (anon) clients, generated database.types.ts
lib/data/               ← public.ts (server-only reads for public pages), public-types.ts
proxy.ts                ← Next 16 proxy: Supabase session refresh + /admin login gate
obsidian/               ← this vault
```

## Rules

- **kebab-case** file names.
- A component used by one feature lives in that feature's folder; only
  design-system primitives go in `components/ui/`.
- Types live next to the code that uses them (`lib/admin/types.ts` for admin
  models). There is no shared `types/` folder yet.
- Pure helpers and constants go in `lib/`, not in components.
- Brand assets in `public/brand/`. The default `public/*.svg` files from
  create-next-app are unused.

## Related

[[routing]] · [[component-conventions]]
