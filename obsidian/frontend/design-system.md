---
tags: [frontend, wip]
updated: 2026-11-01
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
| `--tile-radius` `1.25rem` | primitive | first landing redesign (ADR-0009) | `rounded-tile`: used only by the home page activity drawer (floating panel); the rest of the 2026-11 look is square with cut corners (`--radius: 0`) |
| `--tab` / `--tab-active` / `--tab-active-foreground` / `--tab-hover` | semantic | `--dust` / `--ink` / `--foam` / `--dust-soft` (widget: 85% of the custom tab colour), declared in `:root` and `.theme-marse` | `bg-tab`, `bg-tab-active`, `text-tab-active-foreground`, `hover:bg-tab-hover` in `BookingTabs`; separate so WordPress widgets can recolour tabs apart from the page (ADR-0015) |
| `--display-face` / `--display-stretch` / `--display-case` / `--display-tracking` | semantic | Big Shoulders by default; Termina uppercase (100% stretch) in `theme-marse` | read by the `font-display` utility |

| `--water` | semantic | `--raw-teal` `#00b2b5` | `bg-water` / `ring-water`: live status dot, focus outline on the home page |
| `--spacing-gutter` | primitive | `clamp(1.375rem, 4.2vw, 5rem)` | `px-gutter`: side padding of every home section |
| `text-hero`, `-display`, `-jumbo`, `-statement`, `-title`, `-tile`, `-footer`, `-menu`, `-micro` (+ `-sm` phone steps) | primitive | fluid sizes with line height + tracking | home page display type (`@theme` in `globals.css`); use `text-x-sm md:text-x` |
| `--radius-cut` / `--radius-cut-lg` | primitive | 6.25rem / 10rem | `rounded-tl-cut`, `rounded-br-cut`: the two cut photo corners |

| `--ease-out-strong` | primitive | `cubic-bezier(0.23, 1, 0.32, 1)` | `ease-out-strong`: every UI transition and enter animation on the home page (built-in curves are too weak) |

## The look (2026-11 redesign)

One recipe across the home page and every inner page.

- **Palette:** ink (aubergine) bands and text, dust (blush) page, rust (coral) for the second headline line, CTAs, stars and highlights, `lake-soft` (deep teal) as the third surface (location block, hover on dark CTAs), `lake` (tan) for accents on teal, `water` (bright teal) only as status dot / focus.
- **Type:** Termina only. Titles are **bold uppercase** with tight negative tracking and set from the fluid steps (`text-hero`, `-display`, `-jumbo`, `-statement`, `-title`, `-tile`, `-footer`, `-menu`) with `-sm` phone twins. Body copy is `text-xs`/`text-sm` with `leading-loose`; labels are `text-micro` (10 px, +0.07em).
- **Shapes:** square everywhere; the only curves are the circular sticker and the **cut corners** (`rounded-tl-cut`, `rounded-br-cut`) on a few photos. Hairlines are `border-line` (or `border-dust/30` on ink).
- **Page anatomy:** `SiteHeader` on ink → ink band (home: `LandingHero`; inner pages: `PageIntro` with the hero's grid + orbit lines) → dust content → `FooterWord` + `FooterBar` footer. Inner pages never invent their own heading style: use `PageIntro`.
- **Forms and cards:** outlined `border-ink` cards on `bg-foam` / `bg-card`, a bottom bar with the total and the primary button. Primary action = dark `Cta` (`ArrowButton`); the home page and header use the coral tone. Choice chips and tiles press to `scale-97`.
- **Recurring parts:** `SectionKicker` (numbered micro label row), `StarMark`, the coral ticker, accordions (`ui/accordion` via `LandingAccordion`), `Reveal` on scroll.
- **Motion:** see "Motion (home page)" below; it applies to the inner pages too (`PageIntro` runs the same load cascade, footer and cards use `Reveal`).

## Motion (home + inner pages)

- Gate every movement with `motion-safe:` (or skip it in JS); colour and opacity feedback may stay. Hover transforms are already limited to hover devices by Tailwind v4.
- Press = `active:scale-97` (chips `98`, big tiles `99`), 150 ms. Transition the individual properties (`translate`, `scale`, `rotate`), not `transform`, because Tailwind v4 uses those.
- Anchor jumps (header CTA, menu links, "Į viršų") scroll smoothly: `html { scroll-behavior: smooth }` inside `prefers-reduced-motion: no-preference`, plus `data-scroll-behavior="smooth"` on `<html>` so Next.js still jumps instantly on route changes. `scroll-padding-top: 7rem` clears the fixed header.
- Hero loads as a staggered fade-up (100–700 ms delays); sections use `Reveal`; modals fade + rise 250 ms in, 150 ms out; the menu panel fades in and its links stagger 50 ms apart.

> [!info] Which size for which text
> `text-micro` (11 px, +0.07em) is for **labels only**: uppercase kickers, step numbers, counters, small tags. Anything a visitor reads as a sentence (card notes, captions, hints, footer links) is `text-xs` (12 px) or larger; body copy is `text-xs`/`text-sm` with `leading-loose`.

> [!warning] Name type steps so they never equal a colour token
> `text-card` (and `text-foreground`, `text-primary`, …) is a *colour*: a font-size token with the same name loses to it. The card title step is `text-tile` for that reason.

> [!warning] Custom `text-*` sizes and `cn()`
> `cn()` (tailwind-merge) cannot tell the custom type steps (`text-micro`, `text-hero`, …) from colours, so `cn("text-micro", "text-ink")` silently drops one of them. When merging with `cn`, keep a custom size and a text colour out of the same call (append one as a plain string), and never pass `text-micro` as an override to a component that sets its own colour (`Cta`).

## Utilities

- Home art utilities: `clip-hero-narrow/-wide`, `bg-grid-hero`, `orbit-wide`, `orbit-round`, `text-outline`, `scrollbar-none`; `animate-marquee`, `animate-spin-slow`.

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
  nav start at `lg` (1024). Below `lg` the header shows only the CTA and the menu button; `MenuPanel` holds every link.
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
