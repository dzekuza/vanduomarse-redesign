---
tags: [frontend, catalog, stable]
updated: 2026-11-01
---

# UI Primitives Catalog

Design-system primitives in `components/ui/`. **Check this list before building
any element from scratch.**

shadcn/ui, Radix primitives, Nova preset (`components.json`). Brand tokens are
mapped in `app/globals.css` (see [[design-system]]). Local edits to generated
files are listed in the last column; re-running `shadcn add` would overwrite them.

| Component | File | Props summary | Local changes |
|-----------|------|---------------|---------------|
| Accordion | `components/ui/accordion.tsx` | Radix accordion parts (`type`, `collapsible`) | added for the home page; open/close animation uses `data-[state=…]` + tw-animate-css `accordion-down/up` |
| Badge | `components/ui/badge.tsx` | `variant` | — |
| Breadcrumb | `components/ui/breadcrumb.tsx` | composable parts | — |
| Button | `components/ui/button.tsx` | `variant`, `size`, `asChild` | sizes raised: default h-11, sm h-10, lg h-12, icon 44/40/48 |
| Card | `components/ui/card.tsx` | Header/Title/Description/Content/Footer | — |
| ContextMenu | `components/ui/context-menu.tsx` | Radix context menu parts (same API shape as `DropdownMenu`) | added for the Užimtumas calendar grid (right-click a cell) |
| Collapsible | `components/ui/collapsible.tsx` | `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent`, thin Radix wrapper (same shape as `ContextMenu`'s) | added for `AppSidebar`'s expandable domain rows (Pirtis/Namukai/Keturračiai, ADR-0046) |
| Dialog | `components/ui/dialog.tsx` | controlled `open` | header and footer `sticky` (offset by the content padding) so long forms keep title and actions in view; footer buttons in one row on phones (equal width), right-aligned from `sm`; close button sticks in the header; `DialogContent` takes `overlayClassName` (home page: dark blurred scrim) |
| Drawer | `components/ui/drawer.tsx` | shadcn Drawer on `vaul`: `direction` (right / bottom), `DrawerContent` takes `overlayClassName` | square, `bg-popover`; handle shows for bottom; vaul's transition is switched off under reduced motion. Home page activity drawer; floating margins and `--initial-transform` set by the caller |
| DropdownMenu | `components/ui/dropdown-menu.tsx` | Radix menu parts | — |
| Input | `components/ui/input.tsx` | native input props | h-11, `bg-card` |
| Label | `components/ui/label.tsx` | `htmlFor` | — |
| Popover | `components/ui/popover.tsx` | Radix popover parts (`align`, `sideOffset`, `collisionPadding`) | added for the date picker; square, `border-ink`, capped to the available height, `motion-safe:` enter/exit |
| DatePicker / CalendarGrid | `components/ui/date-picker.tsx`, `calendar-grid.tsx` | `value` / `onChange` as `yyyy-mm-dd` (like `<input type="date">`), `min`, `max`, `placeholder`, `invalid`, `describedBy` | custom: Lithuanian Monday-first month grid in a popover, 44 px day cells, today underlined, arrow/Home/End/PageUp/PageDown keys, "Šiandien" / "Išvalyti"; the month/year title is also a button that swaps to a 12-year page (its own prev/next, disabled past `min`/`max`) — for a birthdate decades back, that's far fewer clicks than stepping month by month; use with `Controller` |
| Select | `components/ui/select.tsx` | Radix select parts, `size` | h-11 / h-10, `bg-card` |
| Separator | `components/ui/separator.tsx` | `orientation` | — |
| Sheet | `components/ui/sheet.tsx` | side panel parts | — |
| Sidebar | `components/ui/sidebar.tsx` | Provider, Sidebar, Menu*, Inset, Trigger | desktop breakpoint md → lg (`useIsMobile(1024)`); `SidebarMenuButton` centers its icon horizontally in icon-collapsed mode (`group-data-[collapsible=icon]:justify-center`) regardless of `size` — the `lg` variant zeroes padding there, which otherwise left the icon flush left with no `justify-center` |
| Skeleton | `components/ui/skeleton.tsx` | — | — |
| Sonner | `components/ui/sonner.tsx` | `Toaster` | — (admin passes `theme="light"`) |
| Switch | `components/ui/switch.tsx` | `checked`, `onCheckedChange` | — |
| Table | `components/ui/table.tsx` | table parts | — |
| Tabs | `components/ui/tabs.tsx` | Radix tabs | list height auto (was h-11); `bg-muted` on both variants |
| Textarea | `components/ui/textarea.tsx` | native textarea props | `bg-card` |
| Tooltip | `components/ui/tooltip.tsx` | needs `TooltipProvider` | — |

The public site's booking components (`components/booking/`) predate shadcn and
keep their own styling; new UI should start from these primitives.

## Adding a primitive

Prefer installing the shadcn/ui component over hand-rolling it. Then add a row here
and a note from [[templates/component-note]].

## Related

[[design-system]] · [[component-conventions]]
