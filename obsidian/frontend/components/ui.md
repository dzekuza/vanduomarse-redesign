---
tags: [frontend, catalog, wip]
updated: 2026-10-19
---

# UI Primitives Catalog

Design-system primitives in `components/ui/`. **Check this list before building
any element from scratch.**

shadcn/ui, Radix primitives, Nova preset (`components.json`). Brand tokens are
mapped in `app/globals.css` (see [[design-system]]). Local edits to generated
files are listed in the last column; re-running `shadcn add` would overwrite them.

| Component | File | Props summary | Local changes |
|-----------|------|---------------|---------------|
| Badge | `components/ui/badge.tsx` | `variant` | — |
| Breadcrumb | `components/ui/breadcrumb.tsx` | composable parts | — |
| Button | `components/ui/button.tsx` | `variant`, `size`, `asChild` | sizes raised: default h-11, sm h-10, lg h-12, icon 44/40/48 |
| Card | `components/ui/card.tsx` | Header/Title/Description/Content/Footer | — |
| Dialog | `components/ui/dialog.tsx` | controlled `open` | — |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | Radix menu parts | — |
| Input | `components/ui/input.tsx` | native input props | h-11, `bg-card` |
| Label | `components/ui/label.tsx` | `htmlFor` | — |
| Select | `components/ui/select.tsx` | Radix select parts, `size` | h-11 / h-10, `bg-card` |
| Separator | `components/ui/separator.tsx` | `orientation` | — |
| Sheet | `components/ui/sheet.tsx` | side panel parts | — |
| Sidebar | `components/ui/sidebar.tsx` | Provider, Sidebar, Menu*, Inset, Trigger | desktop breakpoint md → lg (`useIsMobile(1024)`) |
| Skeleton | `components/ui/skeleton.tsx` | — | — |
| Sonner | `components/ui/sonner.tsx` | `Toaster` | — (admin passes `theme="light"`) |
| Switch | `components/ui/switch.tsx` | `checked`, `onCheckedChange` | — |
| Table | `components/ui/table.tsx` | table parts | — |
| Tabs | `components/ui/tabs.tsx` | Radix tabs | list height h-11 |
| Textarea | `components/ui/textarea.tsx` | native textarea props | `bg-card` |
| Tooltip | `components/ui/tooltip.tsx` | needs `TooltipProvider` | — |

The public site's booking components (`components/booking/`) predate shadcn and
keep their own styling; new UI should start from these primitives.

## Adding a primitive

Prefer installing the shadcn/ui component over hand-rolling it. Then add a row here
and a note from [[templates/component-note]].

## Related

[[design-system]] · [[component-conventions]]
