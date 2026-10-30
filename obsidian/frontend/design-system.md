---
tags: [frontend, wip]
updated: 2026-10-30
---

# Design System

The styling contract. **No hardcoded design values** anywhere in the codebase.

## Token tiers

1. **Primitive** (`--raw-*`) — literal values. Never referenced by components.
2. **Semantic** — role names (`--color-surface`, `--space-section`). What components use.
3. **Binding** — exposed to Tailwind via `@theme` in `globals.css`.

A component references tier 2/3 only. A raw hex or px in a `className` is a bug.

```tsx
// WRONG
<div style={{ padding: 16 }} className="text-[#3e82f1] mt-[20px]">
// RIGHT
<div className="text-primary mt-xl p-4">
```

## Tokens

| Token | Tier | Value | Use for |
|-------|------|-------|---------|
| `--ink` / `--dust` / `--rust` / `--lake` / `--foam` / `--signal` | semantic | redesign palette, `:root` | homepage surfaces, text, accents |
| `--raw-aubergine` `#382e38` | primitive | sampled from vanduomarse.lt | `theme-marse` ink |
| `--raw-blush` `#f1d8ce`, `--raw-blush-soft`, `--raw-blush-paper` | primitive | sampled from vanduomarse.lt | `theme-marse` page / card surfaces |
| `--raw-coral` `#ed5257`, `--raw-coral-deep` | primitive | sampled from vanduomarse.lt | `theme-marse` accent (maps to `--rust`) |
| `--raw-tan` `#e2b38c` | primitive | sampled from vanduomarse.lt | `theme-marse` secondary (maps to `--lake`) |
| `--raw-teal-deep` `#015059` | primitive | brand badge SVG | `theme-marse` `--lake-soft` accent |
| `--tile-radius` `1.25rem` | primitive | landing redesign | bound as `rounded-tile`: photo tiles, panels, cards on the home page. Everything else stays square (`--radius: 0`) |
| `--tab` / `--tab-active` / `--tab-active-foreground` / `--tab-hover` | semantic | `--dust` / `--ink` / `--foam` / `--dust-soft` (widget: 85% of the custom tab colour), declared in `:root` and `.theme-marse` | `bg-tab`, `bg-tab-active`, `text-tab-active-foreground`, `hover:bg-tab-hover` in `BookingTabs`; separate so WordPress widgets can recolour tabs apart from the page (ADR-0015) |
| `--display-face` / `--display-stretch` / `--display-case` / `--display-tracking` | semantic | Big Shoulders by default; Termina uppercase (100% stretch) in `theme-marse` | read by the `font-display` utility |

## Utilities

- `font-wordmark` + `wordmark-size` + `wordmark-fit` — the giant "VANDUO MARSE"
  (Big Shoulders 900, uppercase, `line-height .82`). `wordmark-fit` makes the
  parent a size container; `wordmark-size` is `30cqw` (two stacked lines) and
  `16cqw` from `md` (one line, `nowrap`). If the text or font changes, re-measure:
  the single line is ~6.2 em wide. `font-wordmark` alone is for oversized
  numerals (`TrackStats`). Coral on blush is ~2.6:1, so it is for display type
  only; small text stays ink.

- `scrollbar-ink` — thin square scrollbar (ink thumb, `--line` track, coral on
  hover) for horizontal pickers. Chrome/Safari use `::-webkit-scrollbar`; the
  standard `scrollbar-color` is fenced to Firefox with `@supports
  (-moz-appearance: none)`, because Chrome ignores the pseudo-elements once
  `scrollbar-color` is set, and the build drops `@supports not selector(...)`.

## Responsive rules

- Breakpoints: mobile-first; two-column page layouts and the inline header
  nav start at `lg` (1024). Tablets get the stacked layout and `MobileMenu`.
- Every tap target is at least 44 px tall (`min-h-11` / `size-11`). Inline
  text links in body copy are the only exception.
- Choice sets wrap (`flex-wrap`) rather than scroll sideways; horizontal
  scroll (`scrollbar-ink`) is reserved for long date strips.
- Prices and other short values use `whitespace-nowrap` so they never break
  mid-value; their row wraps instead.
- Nav links live in `components/nav-links.ts` (`NAV_LINKS`).
- Admin: below `lg` navigation is a bottom tab bar (max 5 tabs; extra items
  go under "Daugiau"); from `lg` it is the sidebar. Fixed bottom UI needs
  `pb-[env(safe-area-inset-bottom)]` and matching content padding.

## shadcn/ui tokens

`:root` also defines the shadcn tokens (`--background`, `--primary`,
`--border`, `--ring`, `--sidebar*`, `--chart-*`, …) mapped to the brand:
primary aubergine `#382e38`, background blush paper `#fbf3ef`, cards
`#fffaf7`, secondary/accent blush `#f1d8ce`, ring coral `#ed5257`,
destructive `#c73a3f`, borders aubergine at 18%, `--radius: 0rem` (square,
like the site). `font-sans` / `font-heading` map to Termina (`app/fonts/`, `next/font/local`, Regular 400 + Bold 700 only: headings bold, text regular; `font-medium` renders Regular and `font-semibold` renders Bold). Utilities:
`bg-hatch` (diagonal stripes for closed slots).

## Scoped themes

- `.theme-marse` — the live vanduomarse.lt look, applied site-wide on
  `<body>`. Remaps the semantic tokens above (incl. `--lake-soft` → badge
  teal `#015059`); components need no theme-specific classes. See
  [[decisions-log]] ADR-0002 / ADR-0003.

## Adding a token

Add the primitive, then the semantic role, then the `@theme` binding — with a
comment recording where the value came from (Figma node, brand guide). Never skip
straight to a semantic token with a literal value.

## Rules

- No `style={{...}}` on JSX. Ever.
- No utility-class dumps on raw `div`s — extract a component past ~5 classes or on
  the second repetition. See [[component-conventions]].
- Mobile (React Native): every colour/spacing/radius comes from `useAppTheme()`;
  no raw hex or numbers in `StyleSheet.create()`.

## Related

[[component-conventions]] · [[components/ui]]
