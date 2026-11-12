---
tags: [architecture, stable]
updated: 2026-11-01
---

# Folder Structure

No `src/` directory: folders sit at the repo root (Next's default).

```
app/                    ← routes; pages compose components directly
├── layout.tsx          ← fonts, theme-marse on <body>, site metadata
├── globals.css         ← all tokens (site + shadcn), utilities, theme
├── pirtis/ miegas/ keturraciai/ renginiai/ kuponai/ skaiciuokle/
├── actions/            ← public server actions (requests, quads, coupons, phone, booking-data)
├── api/admin/mobile-action/ ← Bearer-token authenticated staff API route for mobile actions needing server-only secrets (Stripe refund, Resend coupon email, SMS/push alerts)
├── embed/              ← bare booking widgets for the WordPress plugin (ADR-0014)
└── admin/              ← dashboard: layout (shell, store) + one page per screen
mobile/                 ← Expo / React Native iOS staff admin app (pnpm workspace, ADR-0083)
├── app/                ← Expo Router layouts and 5 operational tabs (Šiandien, Skenavimas, Užklausos, Kuponai, Daugiau)
└── src/                ← useAppTheme() tokens, Supabase client, UsbScanTarget (USB HID bracelet reader), primitives, store
components/
├── *.tsx               ← shared shell + primitives (site-header, main-header, page-intro, site-footer, cta, reveal, menu-panel…)
├── landing/            ← the home page: sections, activity/calculator drawers, copy in content.ts
├── nav-links.ts        ← public nav items
├── ui/                 ← shadcn/ui primitives (locally modified, see [[components/ui]])
├── booking/            ← embed booking flows (sauna, cabins, quads), receipts, calendar export
├── events/             ← /renginiai feed
├── calculator/         ← /skaiciuokle
└── admin/              ← store, shell, and a folder per admin screen
hooks/                  ← shared hooks — catalog: [[hooks]]
lib/                    ← business rules, prices, data generators — catalog: [[utils]]
└── admin/              ← admin models, labels, mappers, repository (server), occupancy, formatting
public/brand/           ← logo badge, logos, zone stickers (sticker-*.svg, currently unused)
supabase/               ← config.toml, migrations/, seed.sql (demo) — see [[database]]
lib/supabase/           ← env, server (cookie) + public (anon) clients, generated database.types.ts
lib/data/               ← public.ts (server-only reads for public pages), public-types.ts
proxy.ts                ← Next 16 proxy: Supabase session refresh + /admin login gate; frame-ancestors on /embed
wordpress/vanduo-marse-booking/ ← WordPress plugin (PHP + plain JS): shortcode, block, widget framing /embed/*, appearance settings, self-updater
scripts/build-wp-plugin.mts ← zips the plugin + writes its update manifest to public/wordpress/ (generated, gitignored)
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
