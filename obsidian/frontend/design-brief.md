---
tags: [frontend, design, brief]
updated: 2026-11-10
---

# Design brief — Vanduo Marse

Records developer selections for the interface. Values and tokens live in [[design-system]]; this note holds intent, references and exclusions. Source for each item is in brackets. Items without a source are `proposed` or `unresolved`.

## Audience

- **Public:** Lithuanian-speaking visitors, mostly on phones, who book sauna, cabins, quad rental and tours, events, or use the event price calculator. [developer, 2026-11-10; AGENTS.md]
- **Admin:** park staff who run bookings, calendar, prices and staff SMS recipients at `/admin`. [developer, 2026-11-10; AGENTS.md]

## Primary task

- **Public:** pick a service and date, then pay or request a booking with the fewest steps. [developer, 2026-11-10]
- **Admin:** see and confirm or reject bookings and events, and change data (calendar, prices, recipients). [developer, 2026-11-10]

## References

| Reference | Applies to | Source |
|-----------|-----------|--------|
| vanduomarse.lt (live brand) | Palette, Termina type, brand badge teal. Applied as `theme-marse` on `<body>`. | design-system.md, ADR-0002 / ADR-0003 |
| Booking design | Slate teal `--raw-teal-slate`, `.theme-reservation` washes | design-system.md |
| 2026-11 redesign (home page) | One recipe for the home page and all inner pages: ink bands, dust page, cut-corner photos | design-system.md "The look" |
| Existing admin palette | Blush surfaces in `/admin` | design-system.md |

## Selections to keep

- **Palette:** ink (aubergine `#382e38`) bands and text, dust (`#eed9ce`) page, rust (coral `#ed5257`) for CTAs, second headline line, stars and highlights, `lake-soft` (deep teal `#015059`) as the third surface, `lake` (tan) accents on teal, `water` (bright teal) only for status dot and focus. [design-system.md]
- **Type:** Termina only, four weights (400, 500, 600, 700; files in `app/fonts/`). Titles bold uppercase with tight tracking on fluid steps. Body `text-xs`/`text-sm` with `leading-loose`. Labels `text-micro` only. [design-system.md; developer decision 2026-11-10 on weights]
- **Shape:** square (`--radius: 0`). Curves only on the circular sticker, the cut photo corners and the home activity drawer (`rounded-tile`). [design-system.md]
- **Layout:** mobile-first. Two columns and inline nav start at `lg`. Every tap target at least 44 px. Choice chips wrap; only date strips scroll sideways. Check 375, 768 and 1024 px. [AGENTS.md; design-system.md]
- **Forms and cards:** outlined `border-ink` cards on `bg-foam` / `bg-card`, a bottom bar with total and primary button. [design-system.md]
- **Motion:** gated with `motion-safe:`, press `active:scale-97`, `ease-out-strong`, `Reveal` on scroll. [design-system.md]
- **Copy:** Lithuanian, prices include 21% PVM, no i18n library yet. [AGENTS.md]
- **Admin navigation:** bottom tab bar below `lg` (max 5 tabs, rest under "Daugiau"), sidebar from `lg`. [design-system.md]

## Selections to prevent

- Hex values, arbitrary `text-[…]` / `mt-[…]` values, and `style={{}}`. [AGENTS.md rule 1]
- A second theme or re-adding `theme-marse` per page. [AGENTS.md rule 1]
- Any second font family; Big Shoulders was removed 2026-11-10. [developer, ADR-0057]
- `text-rust` for text below about 24 px (use `text-rust-ink`). [design-system.md]
- `text-micro` for sentences, captions or hints. [design-system.md]
- Font-size token names that equal a colour token name (`text-card`). [design-system.md]
- Hard-coded prices in components. [AGENTS.md rule 5]
- Mock or generated data in `lib/`. [AGENTS.md rule 6]

## Resolved differences

| Difference | Decision |
|-----------|----------|
| design-system.md lists four Termina weights in one section and only 400/700 in "Weights and borders" | Four weights. The "Weights and borders" rule is stale and needs a separate update to design-system.md. [developer, 2026-11-10] |

| Coral button text colour | Dark text (`#171317`, 5.2:1). Applied to every ink-on-coral surface via `text-on-rust`. [decision 2026-11-10] |
| Focus colour and ring | `rust` everywhere, `water` on the home page. Ring is the source's 3 px at 50% opacity, no offset. [decision 2026-11-10] |
| Values in `DESIGN.md` prose | Moved into tokens (type steps, motion, elevation, `md` breakpoint). [decision 2026-11-10] |

## Unresolved

- Figma or image source for the "booking design" reference. No link is recorded.
- Dark mode: only the admin panel has one (`.dark`, ADR-0008). Public pages stay light. This corrects an earlier line that said no selection existed.
- Whether `/admin` keeps its blush palette or moves to the ink/dust recipe. design-system.md says the admin palette is "existing" and does not state a target.
- Measured contrast for text on `--lake-soft` and on the coral menu panel. Only coral on blush (about 2.6:1) is recorded.
- Admin primary task is a proposal from the project data; staff have not confirmed the priority order.

## Proposed

No example values are proposed in this brief. Token values come only from [[design-system]].

## Related

[[design-system]] · [[component-conventions]]
