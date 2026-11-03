---
tags: [meta, status]
updated: 2026-11-03
---

# Current status — vanduomarse-redesign

> [!info] How to use this note
> The **live snapshot** of the project. Read it first when a session starts; rewrite
> it (don't append) whenever the state changes. History belongs in [[session-log]]
> and [[changelog]], not here.

**Last updated:** 2026-11-04

## Current focus

Sauna programs for `/rezervacija` (Bendra, Moterų, Vyrų, Visa šeima, Pirtis tik jūsų kompanijai, Privati su programa), ADR-0022. The migration (`20261103180450_sauna_programs`) is **applied to the live database**, types are regenerated, and the admin editor (`/admin/pirtis` "Programos", program picker on Renginiai) and the `/rezervacija` Pirtis-tab cards are built. Not yet exercised: admin screens (needs staff login), the session path (no program sessions exist yet) and real submits.

`/skaiciuokle` was restyled to the same design (shared `BookingHeader`, two-column with sticky estimate) is three chapters (Proga ir vieta, Skoniai ir veiksmas, Pasiliekam Marse with sauna / quads / stay choices feeding the estimate), has an event date that sets the day type, and now starts with nothing preselected (venue, day and catering are null until chosen; the estimate is empty and the inquiry button waits for a venue and a day); the home calculator drawer shares its restyled components and still needs a visual check.

`/rezervacija` itself (ADR-0021) is built, styled to the client's booking-design reference (`.theme-reservation`: softer coral and slate teal, hairline borders, white-wash panels) and browser-checked at 375, 1280 and 1440 px: a two-column layout (title, tabs, date, steps on the left; sticky plan overview on the right from the top): activity tabs (Pirtis / Nakvynė / Keturračiai) on top (Toliau on the selection step opens a "we also have quads / sauna..." popup (each activity offered once per day) when other activities are free; no step bar or icon legend; the selection step has no heading, status line or "Seansai" label of its own; the Pirtis tab is one timetable of the day's seansai, merging program types and start times; each tab shows its choices without any "add" click and without help copy above them; "Pašalinti iš plano" sits below the options), then the date picker (strip or month calendar via a switch, cells with availability icons) and the guests stepper, the side panel listing the plan as an ordered timeline (sauna and quad times can't overlap: hours the other holds show as busy), then a 3-step form (Pasirinkimas with per-activity start times, Kontaktai, Peržiūra) beside a sticky plan panel. A real submit (SMS-verified phone) is not yet tested.

## Done recently

- `/rezervacija` restyled to the live-site layout, start time per activity, availability icons on days (2026-11-03).
- Migration `20261103180450_sauna_programs.sql` applied to the live project (table, RLS, RPCs, seed); "we also have..." popup after the seansas selection.
- Dev server allowed from the Tailscale host (`allowedDevOrigins`).

## In progress

- Nothing half-done. Uncommitted: `app/rezervacija/`, `components/reservation/`, `lib/reservation.ts`, `components/booking/day-picker.tsx`, the migration, `lib/supabase/database.types.ts`, vault notes.
- Ledger caveat: the remote migration history lacks `20261030100000` and `20261030120000` (objects exist); repair before the next `supabase db push`.

## Next up

1. Staff: open `/admin/pirtis` to check the programs and prices, then create sessions in Renginiai (category Pirtis, pick the program, date, time, seats).
2. Test real bookings with a verified phone; menu/header link, `/embed/rezervacija`, sitemap.

## Blockers & open questions

- The new RPCs are applied but not yet exercised with a real booking (Docker not running, so no local test); the first real call will be a live test booking.
- The six seeded prices are the client design's figures; the client should confirm them.
- Coupons are not accepted on `/rezervacija` (single-service codes); needs a decision.
- A failure after the first request leaves a partial result with retry; staff see separate requests.

## Environment

- **Run:** `pnpm dev` (http://localhost:3000)
- **Deploy:** Vercel
- **Known issues:** `pnpm lint` over the whole repo is flooded by `.claude/worktrees/`; lint specific paths.

> UI consistency pass (2026-11-04): Termina body + role text steps applied; /rezervacija browser-checked at phone width; booking, coupons, events and admin still unchecked.
