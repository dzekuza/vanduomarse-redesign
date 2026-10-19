---
tags: [frontend, wip]
updated: 2026-10-19
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
| `/pirtis` | Pirtis Marse - rezervacija | **missing** (falls back to site default) | — |
| `/miegas` | Miegas Marse - rezervacija | **missing** | — |
| `/renginiai` | Renginiai Marse | yes | — |
| `/skaiciuokle` | Renginio kainos skaičiuoklė - Vanduo Marse | yes | — |
| `/admin/*` | "%s · Vanduo Marse valdymas" | — | noindex, nofollow |

## Gaps

- No `app/sitemap.ts` or `app/robots.ts` yet (robots should disallow `/admin`).
- No Open Graph images; no JSON-LD (LocalBusiness / Event would fit).
- No `siteUrl` config value yet; add it before canonical URLs.

## Related

[[routing]] · [[html-semantics]]
