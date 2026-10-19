---
tags: [workflow, playbook, stable]
updated: 2026-10-19
---

# Workflow — Implement a New Page / Section

## Steps

1. **Get the design.** Collect the desktop + mobile frames. Use the Figma MCP server
   to read exact measurements, colours, typography, and spacing — don't eyeball them.
2. **Plan the route.** Add `app/<route>/page.tsx` with `metadata`; compose
   feature components inside `BookingPage` (public) or as one view (admin)
   ([[routing]]).
3. **Feature folder.** Put the page's components in `components/<feature>/`.
4. **Break into components.** Reuse [[components/ui]] and [[components/common]] first.
   New primitives → `components/ui/`; feature pieces → next to the feature. Each gets
   a typed `interface ...Props` ([[component-conventions]]).
5. **Tokens before styles.** Every colour/spacing/type/radius references a token.
   Missing value → add the token first, with a comment on its origin ([[design-system]]).
6. **Content and prices from `lib/`.** Rules, prices and generated demo data
   live in `lib/`; never hard-code a price in a component.
7. **Assets.** Brand files in `public/brand/`; remote photos need their host
   in `next.config.ts` `images.remotePatterns`.
8. **Server-first.** Server Components by default; `"use client"` only at leaves.
9. **Semantic & accessible markup.** [[html-semantics]] — one `<h1>`, landmarks,
   native elements, visible focus, `alt` text.
10. **Metadata.** Title, description, OG image ([[seo-metadata]]).
11. **Responsive.** Check 375 / 768 / 1024 px: no page overflow, tap targets
    ≥ 44 px, chips wrap ([[design-system]] → Responsive rules).
12. **Quality.** `pnpm lint`, `npx tsc --noEmit`, `pnpm build`; components
    < ~150 lines; conventional commit.

## Deliverables

- All components in their correct folders
- The view file assembling them
- Any new tokens (commented)
- Demo data in `lib/` if needed
- Route row added to [[routing]]
- A short summary: assumptions, new tokens & why, any design values that couldn't
  map to existing tokens (flag for design review)

> [!important]
> Updating an existing page? Preserve all existing logic. Keep diffs minimal.
