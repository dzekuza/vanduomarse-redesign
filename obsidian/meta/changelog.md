---
tags: [meta, changelog]
updated: 2026-10-19
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-10-19 — Homepage moved to the live-site look

- `theme-marse` now sits on `<body>`, so every route (homepage included)
  uses the aubergine / blush / coral palette and Archivo wide uppercase
  headings. `BookingPage` no longer adds the class itself.
- Homepage tuned to match Pirtis: outlined eyebrow tag, bold (not black) hero
  heading at fixed sizes, `ArrowLink` CTA, section headings `text-3xl/4xl`,
  solid ink borders on equipment tiles and the find-us cards, uppercase
  group labels.
- `--lake-soft` now maps to the badge's deep teal (#015059) for the one
  remaining teal accent; the atmosphere strip uses a real wakeboard photo
  (Unsplash) instead of a random picsum image.
- New shared `ArrowLink` (link version of the CTA), also used by `EventRow`.

## 2026-10-19 — Sticky header

- `SiteHeader` is sticky (`top-0`, opaque `bg-dust`, `border-line` rule) on
  every page. `html { scroll-padding-top: 7rem }` keeps anchor jumps clear of
  it, and the Pirtis form column now sticks at `top-28`, below the header.
- Renginiai month headings get `pb-4` breathing room above the first card.

## 2026-10-19 — Brand badge logo

- Header and footer now use the official Vanduo Marse astronaut badge
  (`public/brand/vanduo-marse-badge.svg`, supplied by the client) via
  `BrandLogo`, replacing the text wordmark on every page. The badge's own
  palette (aubergine #31202F, coral #E94B4F, tan #EBB080, blush #F1D8CD,
  teal #00B2B5 / #015059) matches the `theme-marse` tokens.

## 2026-10-19 — Renginiai page

- New `/renginiai` route (in `theme-marse`): one feed of the next 30 days
  that merges park events (season closing, film night, live music, Akademija
  dry training, Rookie Challenge registration, Christmas fair) with the public
  sauna sessions. Category filter chips with counts, grouped by month
  (plain month headings, no rule or bottom margin).
- Data in `lib/park-events.ts` (`parkEvents`): one-offs are placed by day
  offset from today so the page never goes stale; placeholder until a CMS or
  backend feeds real events. Sauna sessions keep their spots-left state.
- Sauna events link to `/pirtis?skirtukas=renginiai`, which opens the events
  tab (`SaunaReservation` takes `initialMode`; the page reads `searchParams`,
  so `/pirtis` is now rendered per request). Other events use a
  `mailto:info@vanduomarse.lt` "Registruotis" link for now.
- "Renginiai" added to the header nav; the homepage "Renginiai Marse" patch
  links to the page.

## 2026-10-19 — Open-events badge on the Pirtis tab

- The *Prisijungti prie renginio* tab shows a coral count bubble with the
  number of sessions in the next `EVENT_WINDOW_DAYS` (14) that still have
  spots (`openEventCount`). `BookingTabs` tabs accept an optional `badge`.

## 2026-10-19 — Add booking to calendar

- Every confirmation (`Receipt`) now offers *Pridėti į kalendorių*: a Google
  Calendar template link and an `.ics` download for Apple Calendar / Outlook
  (`AddToCalendar`, helpers in `lib/calendar.ts`). Sauna hire and events are
  timed entries in UTC; cabin stays are all-day spans. Location is the
  `VENUE` placeholder until the client gives a street address.

## 2026-10-19 — Pirtis: pirtininkas option

- Private hire has a "Pirtininkas" step (`MasterPicker`): *Nereikalingas* or
  *Su pirtininku*. The master is charged per hour booked (`MASTER_RATE`,
  30 €/h placeholder) and shown on the receipt.

## 2026-10-19 — Pirtis bento gallery

- The Pirtis hero photo strip is now a `BentoGallery`: one 2x2 lead tile plus
  four small tiles (barrel sauna on the shore, wood stove, vantos on the dock,
  water on the stones, barrel interior). `BookingHero` takes `gallery` instead
  of `image`; one image renders full width (Miegas, until it gets photos).
- Photos are free-licence Unsplash stand-ins; `images.unsplash.com` added to
  `next.config.ts` remote patterns. Swap in the client's own photos when ready.

## 2026-10-19 — Pirtis private hire: pick a start time, then a duration

- Private sauna hire is now sold by the hour instead of fixed 90-minute slots:
  choose a start (10:00-20:00), then 2-6 hours. Each duration tile shows the
  end time and price; lengths that would run into the next booking or past
  22:00 closing are disabled, and switching start clamps the chosen length.
- Pricing per hour (`hourRate` in `lib/sauna.ts`): 40 €/h weekdays before 17:00,
  50 €/h after, 60 €/h weekends. Placeholder rates until the client confirms.
- New `StartTimeGrid`, `DurationPicker` and shared `ChoiceTile`; `SlotGrid`
  removed.
- Day strip uses a new `scrollbar-ink` utility: 4px square ink thumb on a
  `--line` track (coral on hover) instead of the grey OS scrollbar.

## 2026-10-19 — Pirtis: book the sauna or join an event

- `/pirtis` now has two tabs (`SaunaReservation`): **Rezervuoti pirtį** (private
  hire, the existing slot flow) and **Prisijungti prie renginio** (per-person
  tickets for scheduled public sessions).
- Events come from `lib/sauna-events.ts`: weekly templates (Fri ritual, Sat
  sunset, Sun morning swim) expanded over the next 14 days, with deterministic
  pseudo-occupancy. Full sessions are disabled; tickets cap at spots left.
  Placeholder data until a real events backend exists.
- Extracted `BookingCard` (form shell + total bar) and `Receipt` (confirmation
  ticket); sauna, cabin and event flows all use them.

## 2026-10-19 — booking pages restyled to the live vanduomarse.lt UI

- `/pirtis` and `/miegas` now render inside the `theme-marse` scope: the
  production site's aubergine / blush / coral palette, wide uppercase headings
  (Archivo at 125% width standing in for the licensed Termina face) and the
  dark arrow CTA. The homepage keeps the redesign palette.
- The duplicated route hero became `BookingHero`; route shell is `BookingPage`.
  New `StepLabel` and `ArrowButton` in `components/booking/`.
- The booking form sits in the hero's right column (sticky on desktop); the
  route photo is a short fixed-height strip under the facts instead of a
  full-height portrait. Booking tiles, steppers and receipts use solid ink
  borders to match the live site's outlined buttons.
- Header section links now point at `/#zonos` and `/#kainos` so they work from
  sub-pages.

## 2026-10-19 — vault initialised

- Project brain scaffolded from the shared `.project-brain` template: vault,
  root shims (`AGENTS.md` / `CLAUDE.md` / `.cursorrules`), and the three Claude
  Code hooks that keep this vault in sync.
