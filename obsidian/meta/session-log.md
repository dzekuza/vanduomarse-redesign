---
tags: [meta, session-log]
updated: 2026-11-03
---

# Session log

Append-only record of **what each working session changed and where it left the
project**. Newest first. Keep entries short (3–6 lines). Notable user-facing or
architectural changes also go in [[changelog]] / [[decisions-log]]; the live
snapshot lives in [[status]].

Entry format:

```
## YYYY-MM-DD HH:MM — one-line summary
- **Changed:** files / areas touched and why
- **Status:** what works now, what is half-done
- **Next:** the first thing to do next session
```

## 2026-11-04 06:20 — Calculator chapters, date, token cleanup
- **Changed:** `calculator-groups.tsx` (new), `event-calculator.tsx`, `calculator-sections.tsx` (date picker, labels), `use-event-calculator.ts` (`chooseDate`, preset keeps date), `lib/event-pricing.ts` (`date`, `dayTypeOf`), `inquiry-form.tsx` (no own date), `step-label.tsx`, `stepper.tsx`, `choice-tile.tsx`, `booking-header.tsx`, `globals.css` (hack removed), border tokens across reservation and calculator components.
- **Status:** verified on `/skaiciuokle`: three chapters with the first open, Saturday sets the evening/weekend tile, Monday the workday tile, preset keeps date, 24 px labels, hairline borders from the token; tsc and eslint clean. Other booking pages (/pirtis, /miegas, /keturraciai) and the home drawer not re-checked after the shared Stepper / ChoiceTile change.
- **Next:** look at those pages; commit.

## 2026-11-04 05:40 — "Pasiliekem Marse" accordion in the calculator
- **Changed:** `components/calculator/stay-section.tsx` (new), `calculator-sections.tsx` (section registered, controls moved out of extras).
- **Status:** verified on `/skaiciuokle` at 1440 px (rows closed at start, chips and estimate update, no overflow at 375 px); tsc and eslint clean. The home drawer step was not opened.
- **Next:** open the home drawer to check both new states; commit.

## 2026-11-04 05:10 — Calculator starts empty
- **Changed:** `lib/event-pricing.ts` (nullable space/day/catering, guarded `estimate`), `use-event-calculator.ts`, `space-picker.tsx`, `estimate-summary.tsx` (empty state, gated inquiry), `event-calculator.tsx`, `calculator-drawer.tsx`, `calculator-sections.tsx`.
- **Status:** verified on `/skaiciuokle`: nothing pressed at start, 0 €, no CTA until venue + day, presets still fill; tsc and eslint clean. The home calculator drawer was not opened in the browser.
- **Next:** open the home drawer to check it; commit.

## 2026-11-04 04:40 — /skaiciuokle restyled
- **Changed:** `components/booking/booking-header.tsx` (new, shared), `app/skaiciuokle/page.tsx`, `app/rezervacija/page.tsx` (uses the header), `components/calculator/*` (layout and styling), docs.
- **Status:** checked at 1440 and 375 px: sticky estimate pins at 128 px, no overflow, reservation page unaffected; tsc and eslint clean. The home calculator drawer was not re-checked after the shared component restyle.
- **Next:** check the home drawer; commit.

## 2026-11-04 04:10 — /rezervacija restyled to the reference design
- **Changed:** `app/globals.css` (`.theme-reservation`), `app/rezervacija/page.tsx` (header, scope wrapper; rewritten after an empty-file mishap), option/session/tab/day/calendar/panel components, `data-slot` on `ChoiceTile` and `Stepper`, `design-system.md`.
- **Status:** checked at 1440 px next to the reference (palette tokens resolve to the reference values; layout, borders, type match); tsc and eslint clean. Dev server needed a content change to globals.css before it recompiled.
- **Next:** unchanged (commit, real test bookings, menu link).

## 2026-11-04 03:30 — No sauna/quads overlap in the plan
- **Changed:** `lib/reservation.ts` (`planHours`, `busy` through the plan functions, two-pass `planAll`, `SessionRow.blocked`), `quad-time-pickers.tsx`, `quad-options.tsx`, `sauna-options.tsx`, `session-list.tsx`, `activities-step.tsx`.
- **Status:** verified: sauna 12:00–15:00 → quad tiles 12/13/14 disabled "Jūsų plane", 11:00 limited to 1 h; quads at 11:00 → 6 sauna rows blocked, selected row stays. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 03:00 — Plan timeline and date picker with calendar view
- **Changed:** `plan-panel.tsx` (timeline), `lib/reservation.ts` (`startMin`, sorted `describePlans`), new `day-cell.tsx`, `month-calendar.tsx`, `date-picker.tsx`; `when-step.tsx` uses `DatePicker`.
- **Status:** verified at 1280 and 375 px: timeline order quads 11:00 → sauna 15:00 → stay; calendar toggle keeps the selected day, month arrows disabled inside a single-month window, no overflow. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 02:20 — Upsell popup: once per activity, quad-aware sauna offer
- **Changed:** `reservation-flow.tsx` (offers tracked per day and activity), `lib/reservation.ts` (`extraOfferText` takes what is in the plan).
- **Status:** verified: quads only → popup offers Pirtis ("prieš keturračius ar po jų") and Nakvynė; declining once means no repeat on the same day. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 02:00 — Upsell popup before the contact step
- **Changed:** `components/reservation/extras-offer-dialog.tsx` (new), `reservation-flow.tsx` (`next()` opens it once per day), `lib/reservation.ts` (`extraOfferText`); also removed the step bar, the "Seansai" label, the selection heading, the "įtraukta į planą" line and the icon legend.
- **Status:** verified in the browser (offers Nakvynė + Keturračiai after picking a private program; "Peržiūrėti" opens the quads tab; second Toliau goes to contacts); tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 01:10 — Pirtis tab: one seansai timetable
- **Changed:** `lib/reservation.ts` (`SessionRow`, `sessionRows`, `rowSelected`, `pickForRow`), `lib/sauna-programs.ts` (`programRateLine`), `components/reservation/session-list.tsx` (new), `sauna-options.tsx`, `sauna-hourly-options.tsx` (duration + extras only), `program-options.tsx` deleted.
- **Status:** checked at 1280 and 375 px (31 rows for a normal day, 8 shown first; hourly row opens duration); tsc and eslint clean.
- **Next:** unchanged; staff still need to create program sessions in Renginiai for them to appear.

## 2026-11-04 00:40 — /rezervacija: two-column layout, plan overview sticky from the top
- **Changed:** `app/rezervacija/page.tsx` (header node), `reservation-flow.tsx` (one grid, header inside the left column), `reservation-gate.tsx` (header + narrow card), `when-step.tsx` (stacked), `plan-panel.tsx` (`self-start` so sticky works).
- **Status:** checked at 1280 px (panel starts at the title and pins at 128 px while scrolling) and 375 px (no overflow); tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-04 00:20 — /rezervacija: no "add" step, choices always visible
- **Changed:** `activities-step.tsx` (previews the tab from `defaultPick`, remove link, notice only when included), `sauna-options`, `quad-options`, `stay-options` (`included` prop gates follow-up options), step heading copy.
- **Status:** verified in the browser: Pirtis, Nakvynė and Keturračiai choices show before any click; cabin size appears only after picking a type; Toliau stays disabled until something is picked. tsc and eslint clean.
- **Next:** unchanged.

## 2026-11-03 23:59 — /rezervacija: tabs and date above a 3-step form
- **Changed:** `reservation-flow.tsx` (tabs, `WhenStep`, 3 steps), `activities-step.tsx` (takes `tab`), `when-step.tsx` (two-column section), `step-nav.tsx` (any number of steps), `day-picker.tsx` (`relative` buttons, fixes mobile overflow), `lib/reservation.ts` (`ACTIVITY_TAB_ORDER`).
- **Status:** works at 1280 and 375 px (no overflow), reaches the review step; tsc and eslint clean. Real submits still untested.
- **Next:** unchanged: staff create program sessions, real test bookings, menu link, embed route, sitemap.

## 2026-11-03 23:30 — Sauna programs: admin editor and /rezervacija cards
- **Changed:** `lib/sauna-programs.ts`, admin types/mapper/repository/store/actions (`programs`, `saveProgram`, `deleteProgram`, `programId` on events), `components/admin/sauna/program-*.tsx`, event dialog picker, public data (`programs`, `programId` on sessions), `createProgramTicket` / `createProgramBooking` actions and schemas, `lib/reservation.ts` program modes, Pirtis tab components. `tsc` and eslint clean.
- **Status:** program cards and the private-program start grid checked in the browser (200 € for 15:00). Not verified: admin screens (login), session path (no sessions yet), real submits.
- **Next:** staff create a session per program in Renginiai; test real bookings (session adults/children, private, hourly) with a verified phone; menu link, embed route, sitemap.

## 2026-11-03 22:00 — Sauna programs migration applied via the Supabase MCP
- **Changed:** applied `sauna_programs` to the live Vanduo project after the user authenticated the official Supabase plugin (it lists `mwngljhcvqkvncwbmgeo`); renamed the local file to `20261103180450_sauna_programs.sql`; regenerated `lib/supabase/database.types.ts` (kept `create_inquiry.p_date: string | null`).
- **Status:** table, columns, RLS, both RPCs and the six seed programs verified live; `tsc` clean. No app code uses them yet.
- **Next:** admin programs editor, program cards in `/rezervacija`, real test bookings. Repair the 30 Oct ledger entries before any `supabase db push`.

## 2026-11-03 21:30 — Sauna programs: migration written, apply blocked
- **Changed:** `supabase/migrations/20261103190000_sauna_programs.sql`; vault (changelog, ADR-0022, database note). No app code yet.
- **Status:** NOT applied. MCP slots point at other projects; CLI is linked to Vanduo but its history lacks the two 30 Oct migrations (objects exist), and the `migration repair` command was denied by the permission classifier.
- **Next:** user runs `supabase migration repair --status applied 20261030100000 20261030120000` then `supabase db push` (or says how to proceed); then regenerate `database.types.ts`, build the admin programs editor and the program cards in `/rezervacija`.

## 2026-11-03 20:45 — Availability icons on the day strip
- **Changed:** `DayPicker` optional `icons`; `dayAvailability` in `lib/reservation.ts`; `activity-icons.ts` shared with the tabs; `WhenStep`, `ReservationFlow`.
- **Status:** verified at 1280 px (today shows quads dimmed after closing); tsc and eslint clean.
- **Next:** unchanged: real test bookings, menu link, embed route.

## 2026-11-03 20:15 — /rezervacija: step 1 is date and guests only
- **Changed:** `lib/reservation.ts` (start hour per pick, `When` = day + people, `openHours` removed), `when-step`, `sauna-options`, `quad-options`, `activities-step`, `reservation-flow`, `activity-tabs` (equal width).
- **Status:** works at 1280 px (sauna start grid, duration, extras, total); tsc and eslint clean; real submit still untested.
- **Next:** same as before: real test bookings, menu link, embed route.

## 2026-11-03 19:30 — /rezervacija restyled to the live-site layout
- **Changed:** `components/reservation/` (new `StepNav`, `StepHeading`, `OptionCard`, `ActivityTabs`, `PlanPanel`, `ReviewStep`, `ReservationGate`; options rewritten with cards; flow has its own 4-step state), `app/rezervacija/page.tsx` (big title, no hero/gallery).
- **Status:** checked at 375 and 1280 px, no overflow, no console errors; real submit still untested.
- **Next:** real test bookings with a verified phone; menu/header link, embed route, sitemap.

## 2026-11-03 18:00 — Combined booking page /rezervacija
- **Changed:** new `app/rezervacija/page.tsx`, `components/reservation/*`, `lib/reservation.ts`; vault: changelog, ADR-0021, routing, components catalog. No DB changes.
- **Status:** works in the browser at 375 and 1280 px (steps 1-3, all three activities, totals, plan summary). Checked with a placeholder phone verification, so the real submit (SMS-verified phone, RPCs, partial-failure retry) is NOT yet exercised end to end.
- **Next:** submit a real test booking for each combination with a verified phone; add menu/header link, `/embed/rezervacija` and sitemap entry; decide on coupons and a shared group id.


## 2026-11-03 — vault initialised

- **Changed:** project brain scaffolded (vault, shims, hooks).
- **Status:** skeleton only — architecture notes and catalogs still empty.
- **Next:** fill [[status]] and the architecture notes from the real codebase.
