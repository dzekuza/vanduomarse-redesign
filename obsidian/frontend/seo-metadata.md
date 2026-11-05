---
tags: [frontend, wip]
updated: 2026-11-05
---

# SEO & Metadata

## Conventions

- Metadata via the App Router `metadata` export / `generateMetadata`.
- Every route sets `title` and `description`; templates live in the root layout.
- Open Graph + Twitter card images per route where it matters.
- `sitemap.ts` and `robots.ts` in `app/`.
- Canonical URLs from a single `siteUrl` config value, never hardcoded.
- JSON-LD via a shared component — see [[html-semantics]].

## Per-route metadata

| Route | Title | Description | OG image |
|-------|-------|-------------|----------|
| `/` | Vanduo Marse - kabelinis vandenlenčių parkas | site default (root layout) | — |
| `/netrukus` | Netrukus - Vanduo Marse | yes | noindex, nofollow; served with 503 + `Retry-After` while gated |
| `/renginiai` | Renginiai Marse | yes | — |
| `/skaiciuokle` | Renginio kainos skaičiuoklė - Vanduo Marse | yes | — |
| `/admin/*` | "%s · Vanduo Marse valdymas" | — | noindex, nofollow |

## Gaps

- No Open Graph images; no JSON-LD (LocalBusiness / Event would fit).
- No canonical URLs yet; `vanduomarse-redesign.vercel.app` still serves a duplicate copy (kept for the WordPress plugin updater, ADR-0014).

## Icons (2026-11-05)

- `app/favicon.ico` (16/32/48), `app/icon.png` (512) and `app/apple-icon.png` (180): the Vanduo Marse badge (helmet scene + wordmark) on white, cropped tight from the owner's 500 px PNG. Next links them automatically. The ICO frames must be RGBA, or Turbopack fails with "The PNG is not in RGBA format".
- The proxy matcher skips files with an extension, so the icons load while the site gate is on.

## Site URL, robots, sitemap (2026-11-05)

- `SITE_URL` in `lib/site.ts`: env `SITE_URL`, default `https://www.vanduomarse.lt` (the apex 308-redirects to www). Root layout `metadataBase` uses it.
- `app/robots.ts`: allow `/`, disallow `/admin`, `/paskyra`, `/embed`, `/api`, `/rezervacija/mokejimas`; points at the sitemap.
- `app/sitemap.ts`: the public pages (`/`, `/rezervacija`, `/renginiai`, `/keturraciai`, `/kuponai`, `/skaiciuokle`). Add new public routes here. `/apie-marsa` was removed 2026-11-05.

## Related

[[routing]] · [[html-semantics]]
