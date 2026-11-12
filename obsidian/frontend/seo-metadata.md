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
| Public activity pages | Service-specific title and description with natural Lithuanian locality terms and the page's target keyword (see the keyword table below) | yes | Designed 1200x630 image from `SERVICE_OG_IMAGES` (`lib/seo.ts`) where one exists: `/pirtis` -> `/og/pirtis.jpg`, `/nakvyne` -> `/og/nameliai.jpg`, the celebration pages (`/sventes`, `/vestuves`, `/imoniu-renginiai`, `/gimtadieniai`) -> `/og/renginiai.jpg`; the others use their activity cover |
| `/admin/*` | "%s · Vanduo Marse valdymas" | — | noindex, nofollow |

## Target keywords (OpenSEO research, 2026-11-12)

| Page | Main terms (searches a month) |
|------|-------------------------------|
| `/vandenlentes` | wake parkas 590, wakeboard 480, vandenlenčių parkas 140, wake parkas kaunas 90 |
| `/pirtis` | pirties nuoma 880, pirtis kaune 390, pirties nuoma kaune 110 |
| `/nakvyne` | namelis prie ežero 1,000, namelių nuoma 590, namelių nuoma prie ežero 590, nakvynė kaune 480 |
| `/keturraciu-nuoma` | keturračių nuoma 320, keturračių nuoma kaune 140 |
| `/` | pramogos kaune 1,300, vandens pramogos 320 |

Keep prices and capacities out of the copy (they come from the database). The full list with tags is in the OpenSEO project "Vanduo Marse" (saved keywords, tags `topic:*` and `page:*`).

## Gaps

- The activity pages use a canonical path without booking parameters and an Open Graph cover. Other public routes still lack route-specific Open Graph images or canonicals. The Vercel hostname also serves the site for the WordPress plugin updater (ADR-0014).
- No JSON-LD yet.

## Icons (2026-11-05)

- `app/favicon.ico` (16/32/48), `app/icon.png` (512) and `app/apple-icon.png` (180): the Vanduo Marse badge (helmet scene + wordmark) on white, cropped tight from the owner's 500 px PNG. Next links them automatically. The ICO frames must be RGBA, or Turbopack fails with "The PNG is not in RGBA format".
- The proxy matcher skips files with an extension, so the icons load while the site gate is on.

## Site URL, robots, sitemap (2026-11-05)

- `SITE_URL` in `lib/site.ts`: env `SITE_URL`, default `https://www.vanduomarse.lt` (the apex 308-redirects to www). Root layout `metadataBase` uses it.
- `app/robots.ts`: allow `/`, disallow `/admin`, `/paskyra`, `/embed`, `/api`, `/rezervacija/mokejimas`; points at the sitemap.
- `app/sitemap.ts` includes the public service routes from the content allowlist. The `/vandenlentes` entry lists the original URLs of all images in the shared WAKE gallery. The new photos use descriptive Lithuanian filenames, scene-specific alt text, and WebP exports with a maximum edge of 1920 px. The noindex quad design preview `/keturraciai` stays out.

## Related

[[routing]] · [[html-semantics]]

## Added 2026-11-13 (SEO audit)

- `/renginiai` has `Event` JSON-LD from `eventsSchema` (`lib/structured-data.ts`) for the events it lists.
- `/registracija` is `noindex, follow` (canonical `/registracija`; the `?abonementas=` variants are not for search).
- The sitemap sets `lastmod` only for service pages edited in `/admin/puslapiai` (`page_content.updated_at`); no invented dates, no `changefreq`.
- `public/llms.txt` lists address, contacts, hours, season and how prices are published.
- Open: public pages are rendered per request (`no-store`); add `sameAs` profiles (Facebook, Google Business Profile) when the URLs are known.
