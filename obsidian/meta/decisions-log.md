---
tags: [meta, decision]
updated: 2026-10-19
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0004 — Event prices are estimated as ranges from the client's sheet

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** The 2026–2027 price sheet mixes fixed prices with ranges
(service fee 100–350 €, decor 150–250 €, cabins 50–60 €/night, drinks by
brand) and minimum food-and-drink spends instead of rent for some spaces.

**Decision.** `lib/event-pricing.ts` transcribes the sheet into typed data and
a pure `estimate()` that carries a `Money { min, max }` range through every
line. Minimum spend is modelled as a top-up line ("Iki minimalios
sąskaitos") that shrinks as food and drinks are added. Prices include 21%
PVM, as the sheet does. The result is an orientation, not an offer; the CTA
sends the breakdown by email.

**Consequences.** Updating prices means editing one file. When a backend or
CMS exists, the same shapes can be fed from it. Ranges make totals honest
but wider; the client can narrow them by fixing values in the sheet.

---

## ADR-0003 — The live-brand theme is site-wide

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** After the booking pages and Renginiai adopted `theme-marse`, the
client asked for the homepage to match them too. Keeping two palettes no
longer served anyone.

**Decision.** `theme-marse` is applied on `<body>` in `app/layout.tsx`. The
original redesign values remain in `:root` only as the base the theme remaps;
components keep using semantic tokens (`ink`, `dust`, `rust`, `foam`, …).

**Consequences.** New pages get the live look by default. To drop the old
palette entirely, move the `theme-marse` values into `:root` and delete the
class; no component changes needed.

---

## ADR-0002 — Booking pages use a scoped live-brand theme

- **Status:** Superseded by ADR-0003
- **Date:** 2026-10-19

**Context.** The booking routes had to match the current production UI at
vanduomarse.lt, while the homepage redesign uses its own palette and type.

**Decision.** A `.theme-marse` class in `app/globals.css` remaps the semantic
tokens (`--ink`, `--dust`, `--rust`, `--foam`, …) and the display face
(`--display-face`, `--display-stretch`, `--display-case`). `font-display` is a
custom `@utility`, not an `@theme` font key, because Tailwind inlines theme values
and collapses `var()` fallbacks, which made the face impossible to swap per scope.

**Consequences.** Any component rendered inside `theme-marse` picks up the live
brand with no class changes. Termina itself is licensed; Archivo (width axis) is
the stand-in until the client supplies the webfont.

---

## ADR-0001 — Documentation lives in an in-repo Obsidian vault

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** Project knowledge (why a pattern exists, what not to touch, how to add
a feature) was scattered across chat history, READMEs, and people's heads. AI agents
re-derived it every session and got it wrong.

**Decision.** All project documentation lives in `obsidian/`, a linked Obsidian vault
committed to the repo. Root `AGENTS.md` / `CLAUDE.md` / `.cursorrules` are thin shims
pointing into it. Claude Code hooks inject the pointer at session start, remind on
every prompt, and block once at Stop when code changed without a doc update.

**Consequences.** Documentation is versioned with the code and reviewed in the same
PR. Every code change carries a doc obligation. Agents get consistent context without
re-reading the whole codebase.

---
