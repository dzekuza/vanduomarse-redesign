# Vanduo Marse — tasks from WhatsApp "Pugzliai" (2026-11-25/26, Benas)

Status: BUILT on `feat/owner-requests-2026-11-26` (draft PR), not merged; waiting for owner test + the season-constraint go-ahead. Branch: `feat/owner-requests-2026-11-26`. DB: Supabase project-3 (mwngljhcvqkvncwbmgeo).

## 1. Cottages: booking window until 1 May

**Status: DONE (code + live DB).** `stay_types.bookable_until` (ADR-0131); both cabin types = 2027-05-01 in the live DB. Browser-checked: /rezervacija and /nakvyne show 0 free cabins from 1 May. Admin field not browser-checked (login).

Ask: "nuo dabar iki gegužės galima bookintis, o nuo gegužės 1d. išvis nebūtų galima".

- PR #154 opened cottage booking 350 days ahead; there's no "closed after" date.
- Add "Rezervuoti galima iki" (per stay type) in `/admin/namukai`. Enforce it in public availability (`/nakvyne`, `/rezervacija`) and in the server booking action.
- Set both cottage types to 2027-05-01 (exclusive).

## 2. Cottages: Christmas price inside the base season

**Status: DONE (constraint migration applied 2026-11-26).** Pricing (`seasonOn`, `private.stay_night_rate`) applied. `supabase/migrations/20261126110000_stay_season_nesting.sql` NOT applied: owner must confirm. Until then saving a nested season shows a clear message (ADR-0132).

Ask: "kalėdiniu laikotarpiu kaina būtų didesnė"; screenshots show the error "Sezonų datos persidengia" (26 Nov–1 May base + 24–26 Dec).

- Today both the schema (`stay-type-schema.ts`) and a DB exclusion constraint (23P01) reject overlapping seasons.
- Change: allow nested seasons, with the shorter, more specific season winning for each night. Keep rejecting two seasons with identical ranges.
- Update `lib/cabin.ts` pricing + tests; migration to replace the constraint.

## 3. Cottages: base price required

**Status: DONE (decision ADR-0135).** Kept required, renamed "Bazinė kaina" with an off-season hint; new seasons start with the base prices.

Ask: in the screenshot the base "Kaina € už naktį" fields are red ("Įveskite kainą") because he left them empty.

- Decide: either a clear hint ("taikoma ne sezono metu") and keep them required, or make them optional when seasons cover the whole booking window.

## 4. Season date picker bug + awkward UI

**Status: DONE.** `DatePicker openOn`; seasons, discount validity and space hire pairs fixed; compact season rows with night count. Not browser-checked (admin login).

Ask: "pasirenku Nuo, Iki paspaudus negali rodyti praeito mėnesio"; "nepatogiai baisiai padaryta".

- The "Iki" calendar must open on the Nuo month and disable earlier dates. Apply to every from/to pair in admin.
- Tidy the seasons block: compact rows, show the number of nights, no confusing errors.

## 5. Sauna session: sauna master (pirtininkas)

**Status: DONE.** `events.sauna_master_id` (applied); select in "Naujas seansas", shown in Seansai and on /rezervacija ("Pirtininkas · name"). Not browser-checked (admin login).

Ask: "Reiktų galimybės priskirti pirtininką arba be pirtininko" (the "Naujas seansas" dialog).

- Add an optional "Pirtininkas" select ("Be pirtininko" or one of the existing pirtininkai) and store it on the session (additive migration).
- Show it in the Seansai list and on the public session.
- Note: I replied that pirtininkai can be added separately; he still wants it per session.

## 6. "Erdvės" as a service

**Status: DONE.** Table `spaces` (applied, same 8 ids), `/admin/erdves` under Paslaugos, staff hire flow and calendar read it; CHECK replaced by a trigger (ADR-0133). Public calculator still uses the price sheet. Not browser-checked (admin login).

Ask: "prie paslaugų, kad atsirastų Erdvės ir ten būtų sudėtos visos erdvės su kainomis, admin galėtų pridėti erdvės nuomą ir ji atsirastų kalendoriuje".

- `space_bookings` (ADR-0124) and "Nauja rezervacija → Erdvės" already exist, but the spaces and prices are hardcoded in `lib/event-pricing.ts`.
- Add a `spaces` table seeded from the current list (keep the existing ids).
- Add an admin page "Erdvės" under Paslaugos: list, prices, active toggle, add/edit, and a "Nauja nuoma" button.
- The new-booking flow and the calendar read from the table. Relax the hardcoded CHECK on `space_bookings.spaces`.

## 7. Space hires in revenue

**Status: DONE.** Category "Erdvės" in Apžvalga Pardavimai (list, totals, filter tab, row opens the hire), also in the customer's Pirkimai tab. Unit-tested; not browser-checked (admin login).

Ask: "jeigu užbookina erdvę, tarkim kupolą už 800 €, irgi matytųsi pajamose".

- Apžvalga Pardavimai: include `space_bookings` in the list and totals, and add an "Erdvės" filter tab.

## 8. Check: website cottage booking → Booking.com

**Status: ANSWERED + BUILT.** Answer: no, before today website bookings were not sent anywhere (inbound only). Built `/api/ical/room/<token>.ics` per Sirvoy room (ADR-0134, applied). Owner must paste the 14 addresses into Sirvoy (shown at /admin/namukai → "Svetainės rezervacijos į „Sirvoy“").

Ask: "ar iš Marso web'o užbookinus namelį jį rodo kaip užbookintą bookinge?"

- Today the Sirvoy/Booking.com sync is inbound only, as far as known (ADR-0102 reads 14 room feeds).
- Verify in `lib/ical.ts` and the routes whether an outbound per-room iCal export exists and whether Sirvoy imports it. If not, build the export feed and give Benas the URLs to paste into Sirvoy/Booking.com.

Done = tsc + eslint + vitest + build, browser check signed in, draft PR(s), owner test pass, then merge.
