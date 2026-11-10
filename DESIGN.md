---
version: alpha
name: Vanduo Marse
description: Lithuanian cable wakeboard park site. Aubergine bands on a blush page, coral actions, Termina bold uppercase titles, square shapes with cut photo corners.
x-zsd:
  profile: "0.1"
  kind: project
  source:
    method: hybrid
    paths:
      - obsidian/frontend/design-brief.md
      - obsidian/frontend/design-system.md
      - app/globals.css
      - app/layout.tsx
    date: 2026-11-10
  review:
    status: draft
  intent:
    audience: Lithuanian-speaking visitors who book sauna, cabins, quads and events on phones, and park staff who run /admin.
    primary-task: Visitors pick a service and date and pay in few steps. Staff confirm bookings and change data.
    character: Bold uppercase Termina titles, aubergine bands, coral actions, square shapes with cut photo corners.
    density: comfortable
    theme: light
    references:
      - https://vanduomarse.lt
      - obsidian/frontend/design-brief.md
  preferences:
    must-use:
      - Tokens from app/globals.css. No hex, arbitrary values or inline styles in components.
      - Termina only, in four weights.
      - Tap targets of at least 44 px.
      - Lithuanian interface text. Prices include 21% PVM.
    must-avoid:
      - Any second font family. Big Shoulders was removed 2026-11-10.
      - Mock or generated data in lib/.
      - Rounded corners, except the circular sticker, cut photo corners and the home activity drawer.
      - Coral text below 24 px. Use rust-ink.
      - Font-size token names that equal a colour token name.
      - Hard-coded prices in components.
    preserve:
      - Theme theme-marse on body.
      - The cut photo corners and the hero rings.
  implementation:
    token-source: app/globals.css
    checks: design-check.config.json
    component-sources:
      - components/ui
      - components/booking
      - components/landing
      - components/admin
    style-sources:
      - app/globals.css
    font-assets:
      - app/fonts/Termina-Regular.otf
      - app/fonts/Termina-Medium.otf
      - app/fonts/Termina-SemiBold.otf
      - app/fonts/Termina-Bold.otf
    image-assets:
      - public/brand
    icon-assets:
      - "@phosphor-icons/react"
  unresolved:
    - Figma or image source for the booking design reference.
    - Whether /admin keeps its blush palette or moves to the ink and dust recipe.
    - Measured contrast for text on lake-soft and on the coral menu panel.
    - "Decision 2026-11-10: coral buttons use dark text (on-rust #171317, 5.2:1, token --on-rust). Done in components/cta.tsx and the other ink-on-coral surfaces (menu panel, ticker, hero sticker, all-in band, TOP badge, hover states). The booking-tabs count badge sets text-foam on coral, which is lighter than ink and still fails; it needs a decision."
    - Cta text size is not recorded. Button uses the button-md role; Cta sizing was not read.
    - Input and Card component styles were not compared with components/ui/input.tsx and card.tsx.
    - "Accessibility review 2026-11-10 (source and computed contrast, no keyboard or zoom pass): the focus ring is now full-opacity coral-ink (5.1:1 on blush, passes 3:1); focus on ink bands (header, menu) was not measured, since coral-ink on ink is low; input borders at 28% ink are not measured; status-done is 2.66:1 on blush and must keep its text label."
    - Token export (zsd export) is refused while lint reports 13 unused-token warnings. Not needed today, since app/globals.css is the token source.
    - Fluid type steps are recorded at their largest size. Their clamp ranges and phone twins live only in app/globals.css.
    - Admin dark mode records only the colors that differ. Line is a solid mix computed from the source alpha.
    - Line and copy colors are solid mixes computed from ink and dust. The source uses alpha and color-mix.
  layout:
    gutter: clamp(1.375rem, 4.2vw, 5rem)
    viewport-min: 375px
  breakpoints:
    md: 768px
    lg: 1024px
  border:
    width-default: 1px
    color-default: "{colors.line}"
  motion:
    duration-press: 150ms
    duration-dialog: 250ms
    duration-rings: 54s
    press-scale: 0.97
    easing-standard: cubic-bezier(0.23, 1, 0.32, 1)
  accessibility:
    target-min: "{spacing.control-height}"
    focus-width: 3px
    focus-offset: 0px
    focus-opacity: 1
    focus-color: "{colors.rust-ink}"
    focus-color-dark: "{colors.rust}"
    focus-color-home: "{colors.water}"
  elevation:
    float: "0 18px 40px -16px rgba(56, 46, 56, 0.45)"
  modes:
    dark:
      colors:
        primary: "#5A4C5A"
        surface: "#1F1A1F"
        on-surface: "#FBF3EF"
        surface-card: "#2A232A"
        on-surface-muted: "#B9A9B3"
        line: "#3E383C"
colors:
  primary: "#382E38"
  primary-soft: "#4A3E4A"
  on-primary: "#FBF3EF"
  rust: "#ED5257"
  rust-ink: "#A8282D"
  on-rust: "#171317"
  lake: "#E2B38C"
  lake-soft: "#015059"
  on-lake-soft: "#FBF3EF"
  water: "#00B2B5"
  signal: "#F2B705"
  surface: "#EED9CE"
  surface-soft: "#F7E7E0"
  surface-card: "#FFFAF7"
  surface-paper: "#FBF3EF"
  on-surface: "#382E38"
  on-surface-muted: "#6B5E62"
  line: "#D4C1B9"
  line-on-primary: "#574E55"
  destructive: "#C73A3F"
  status-pending: "#ED5257"
  status-confirmed: "#015059"
  status-new: "#E2B38C"
  status-done: "#8F838E"
typography:
  headline-hero:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 195px
    fontWeight: 700
    lineHeight: 0.99
    letterSpacing: -0.075em
  headline-jumbo:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 140px
    fontWeight: 700
    lineHeight: 1.01
    letterSpacing: -0.07em
  headline-footer:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 155px
    fontWeight: 700
    lineHeight: 1.03
    letterSpacing: -0.07em
  headline-statement:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 94px
    fontWeight: 700
    lineHeight: 1.01
    letterSpacing: -0.065em
  headline-menu:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 65px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.055em
  headline-xl:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 84px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.065em
  headline-lg:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 70px
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: -0.065em
  headline-md:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.05em
  headline-sm:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: 0em
  total:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0em
  figure:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0em
  item:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0em
  button-md:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0em
  body-md:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 2
    letterSpacing: 0em
  body-sm:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 2
    letterSpacing: 0em
  label-md:
    fontFamily: "Termina, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.7
    letterSpacing: 0.07em
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  section: 32px
  control-height: 44px
rounded:
  none: 0px
  tile: 20px
  cut: 100px
  cut-lg: 160px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
    height: "{spacing.control-height}"
  button-primary-hover:
    backgroundColor: "{colors.lake-soft}"
    textColor: "{colors.on-lake-soft}"
    typography: "{typography.button-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
    height: "{spacing.control-height}"
  button-coral:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.on-rust}"
    typography: "{typography.button-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
    height: "{spacing.control-height}"
  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.md}"
    height: "{spacing.control-height}"
  card:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  band-ink:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.section}"
  drawer:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.tile}"
    padding: "{spacing.xl}"
  alert-error:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.rust-ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
---

# Vanduo Marse

## Overview

Public pages and the staff admin share one recipe: aubergine bands, a blush page, coral for actions and highlights. Read `x-zsd.implementation` before UI changes and reuse `components/ui` first. The values live in `app/globals.css`; this file records their roles.

## Colors

- `primary`: Use for bands, text and primary buttons. It is `--ink` in `app/globals.css`. `on-primary` is text on it. `primary-soft` is the second band tone.
- `rust`: Use for the second headline line, coral buttons, stars, highlights. `rust-ink` is also the focus ring on light surfaces (`focus-color`); the dark admin keeps `rust` (`focus-color-dark`). The home page uses `water` for its focus outline (`focus-color-home`). `on-rust` is text on coral. Use `rust-ink` for small coral text, such as notices and errors.
- `lake`: Use for tan accents on teal. `lake-soft` is the third surface: location block and hover on dark buttons. `on-lake-soft` is text on it.
- `water`: Use only for the live status dot and the home focus outline. `signal` is a rare highlight.
- `surface`: Use for the page. `surface-soft`, `surface-card` and `surface-paper` are lighter cards and fields.
- `on-surface-muted`: Use as the color of secondary text on light surfaces.
- `line`: Use for hairlines on light surfaces. `line-on-primary` is the hairline on ink bands.
- `status-pending`, `status-confirmed`, `status-new`, `status-done`: Use as the dot color of a booking state. Pair each with a text label.
- `destructive`: Use for destructive admin actions.

Only the admin panel uses the `dark` mode, set by the `.dark` class.

## Typography

- `headline-xl`, `headline-lg`, `headline-md`: Use for page and section titles. Set them bold uppercase, with `-sm` phone twins from `app/globals.css`.
- `headline-hero`, `headline-jumbo`, `headline-footer`, `headline-statement`, `headline-menu`: Use for the home hero, big statements, the footer word and the menu links.
- `headline-sm`: Use for step, dialog and page headings. `item` is a card, option or row title. `figure` is for prices, dates and counts. `total` is for grand totals.
- `button-md`: Use for the text of the shadcn `Button`.
- `body-md`, `body-sm`: Use for sentences, with loose leading.
- `label-md`: Use only for uppercase kickers, step numbers, counters and tags. Do not use it for sentences.

Termina has four weights: Regular, Medium, SemiBold and Bold. Native `h1` to `h6` render Bold. Keep input text at the `item` size or larger, to stop iOS zoom. Use `rust-ink` for coral text below the `headline-sm` size.

## Layout

Build mobile-first. Use `gutter` for the side padding of sections. Start two-column layouts and the inline header navigation at `lg`. Below `lg`, show the header action and the menu button; the menu panel holds all links. Check at `viewport-min`, `md` and `lg`. Type steps change at `md`.

Choice chips wrap. Only date strips scroll sideways, with the ink scrollbar. Keep prices on one line with `whitespace-nowrap`.

Admin below `lg` uses a bottom tab bar with at most five tabs, the rest under "Daugiau". From `lg` it uses the sidebar. Add safe-area padding to fixed bottom bars.

## Elevation & Depth

Show depth with band contrast and `line` hairlines, not shadows. The only shadow is `x-zsd.elevation.float`, for the floating panel. Outline cards with `border-ink` on `surface-card` or `surface-paper`.

## Shapes

- `none`: Use for everything. The site is square.
- `cut`, `cut-lg`: Use for the top-left and bottom-right corners of a few photos.
- `tile`: Use only for the home activity drawer.

## Components

### Button

Use `button-primary` for the main action; the `ArrowButton` and `Cta` components wrap it. Use `button-coral` on the home page and in the header. 

Hover moves a dark button to `lake-soft`. The dark `Cta` sets its text in `surface`. The shadcn `Button` moves down 1 px on press. Chips and tiles scale by `press-scale` in `duration-press`. Keep every button at least `control-height` tall.

- On focus, show the ring from Accessibility.
- While disabled, fade the button and ignore pointer input.
- While loading, keep the width and prevent a second submit.

### Input

Use `input` with a visible label. Show errors in `rust-ink` with a correcting message. Preserve entered values after an error.

- On focus, show the ring from Accessibility.
- For an invalid value, mark the boundary with `destructive`.
- For a disabled field, explain why it cannot change.

### Card

Use `card` for outlined groups. Extract a component when a block passes about five utility classes.

### Band

Use `band-ink` for full-width ink bands: header, hero, page intro and footer. Set band text in `surface` (blush), as the site does, not in `on-primary`.

### Drawer

Use `drawer` for the floating home activity panel only. It is the one rounded surface.

### Alert

Use `alert-error` when a booking or payment fails. State what failed and keep the visitor's choices.

## Do's and Don'ts

- Do use tokens for every color, radius and size.
- Do reuse `components/ui` and the catalogs in `obsidian/frontend/components/`.
- Do keep Lithuanian copy and include 21% PVM in prices.
- Do not use hex values, arbitrary `[…]` values or `style={{}}`.
- Do not use `text-rust` below 24 px.
- Do not use `label-md` for sentences.
- Do not round corners outside the listed shapes.
- Do not hide keyboard focus.

## Motion

Gate every movement with `motion-safe:`. Use `duration-press` and `easing-standard` for UI transitions. Hero text fades up in a stagger, sections use `Reveal`, dialogs fade and rise in `duration-dialog`. The hero rings turn on one `duration-rings` cycle and stay still with reduced motion.

## Iconography

Use Phosphor icons from `@phosphor-icons/react`. Give an icon-only control an accessible name and a 44 px target.

## Imagery

Brand assets live in `public/brand`. Use cut corners on a few photos. Give photos relevant Lithuanian alt text.

## Accessibility

Keep targets at `target-min`. Use the `focus-*` values for the ring, at `focus-opacity`. Pair status colors with text. Coral on blush is below the contrast minimum for small text, so use it for display type only. Respect reduced motion.
