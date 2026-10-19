---
tags: [frontend, stable]
updated: 2026-10-19
---

# Component Conventions

## Placement

| Kind | Location |
|------|----------|
| Design-system primitive (shadcn) | `components/ui/` |
| Site-wide section or shared piece | `components/*.tsx` (hero, header, footer, `ArrowLink`, `BrandLogo`) |
| Feature-specific | `components/<feature>/` (`booking/`, `events/`, `calculator/`, `admin/<screen>/`) |
| Page composition | the route's `page.tsx` (no `views/` layer) |

**Check `components/ui/` before writing anything from scratch.** Prefer the
existing shadcn/ui primitive (`Button`, `Card`, `Badge`, `Dialog`, `Sheet`,
`Input`) over a hand-rolled equivalent.

## Rules

- Functional components and hooks only. Named exports (except Next.js pages/layouts).
- A typed `interface <Name>Props` for every component. No `any`.
- Server Component by default; `"use client"` only at the leaf that needs it.
- Extract past ~150 lines, or when a JSX block repeats, or when it represents a
  distinct UI concept (card, badge, section header, empty state).
- UI copy is Lithuanian and written inline (no i18n library yet); hoist repeated
  strings and option lists into constants (`lib/admin/labels.ts`, `NAV_LINKS`).
- Public site styling uses the brand tokens directly; admin screens build on
  `components/ui/` primitives.
- Content via props/hooks, never hardcoded in the component.

## Documenting a new component

Duplicate [[templates/component-note]], fill it in, and link it from
[[components/ui]] or [[components/common]].

## Related

[[design-system]] · [[html-semantics]] · [[folder-structure]]
