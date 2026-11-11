## 2026-11-12 — Duration choice on /pirtis

- **Why:** user could not pick a duration on /pirtis (private programs have a fixed length) and suggested removing the duration so guests choose 2, 3 or 4 h.
- **Changed:** `sauna-service-booking.tsx` and `sauna-service-options.tsx` (private = hourly with pirtininkas and duration), `hourlyStartHours` in `lib/reservation.ts`.
- **Status:** `tsc`/eslint clean; browser-checked weekday flow at 390 px. Weekend table and a real submit not checked.
- **Also:** panel reordered to the mockup (Trukmė, Pirtininkas, Asmenų skaičius before Data); "Visa diena" (12 h) added as a length; staff set its price in /admin/pirtis, until then it is not offered.
- **Next:** decide whether to switch off the fixed private programs (they still show on /rezervacija and in Kainos); check a Friday–Sunday date.


## 2026-11-12 — Pirtininkai block and picker

- **Why:** user asked for a pirtininkai block before Priedai in /admin/pirtis (add pirtininkai, set prices) shown on programs; answers: price added on top, and the generic hourly extra replaced by named pirtininkai.
- **Changed:** migration `20261112120000_sauna_masters.sql`, `lib/sauna-masters.ts`, admin card/dialog/row, store + server actions, `MasterPicker`, reservation plans and requests, ADR-0067, docs.
- **Status:** `tsc`/eslint clean. Migration applied via MCP (verified). Not browser-checked.
- **Next:** check the picker at 375 px and place one test booking with a pirtininkas (hourly 3 h and a private program).

## 2026-11-12 — Sauna pricing per session length

- **Why:** user sent the owner's sheet (2/3/4 h with fixed prices, weekday vs Fri–Sun, pirtininkas +250 € min 3 h, 10 guests included then +15 €/person, 1 h gap between sessions) and asked to update the pirtis settings and storefront. Answers: weekday 4 h = 240 €, both saunas, 1 h gap, pirtininkas any day.
- **Changed:** migration `20261112090000_sauna_duration_pricing.sql`, `lib/sauna.ts`, mappers, `database.types.ts`, admin rates form/preview/upsell dialog, storefront booking and `/rezervacija` plan, calculator pricing, ADR-0066, utils/common/database/changelog notes.
- **Status:** `tsc` and eslint clean. Migration applied to the live database via MCP (user asked) and verified. Not browser-checked, no test booking placed.
- **Next:** check /pirtis, /rezervacija and /admin/pirtis at 375 / 768 / 1024 px and place one test booking (weekday 3 h, weekend, with pirtininkas, 12 guests).


## 2026-11-12 — Deleted vakarai / akademija / sventes events

- **Why:** user asked to remove those categories from the events list.
- **Changed:** live `events` rows only (4, no tickets or quad rentals attached); changelog.
- **Status:** done and verified by re-query; remaining events are all category `pirtis`.
- **Next:** none.


## 2026-11-12 — Drop tickets section from admin Renginiai

- **Why:** user pasted the "Bilietai ir registracijos" section and said "remove".
- **Changed:** `events-view.tsx` (section and its now-unused imports/state); changelog.
- **Status:** `tsc`/eslint clean; not browser-checked. The earlier request to delete all events except 2x Pirties ritualas was NOT run: no live data was deleted; the keep-which question was left open.
- **Next:** confirm which two Pirties ritualas to keep before any live delete.


## 2026-11-12 — Bulk delete on admin Renginiai

- **Why:** user asked for a bulk select option to remove selected events.
- **Changed:** `events-view.tsx`, new `delete-events-dialog.tsx`, new `ui/checkbox.tsx`; ui/common/changelog notes.
- **Status:** `tsc`/eslint clean; not browser-checked (needs staff login). Deletes call the existing per-event action in parallel.
- **Next:** check in the browser; consider a server-side bulk action if lists grow.


## 2026-11-12 — Rename admin "Parkas" tab to "Inventorius"

- **Why:** user asked (screenshot of /admin/keturraciai) to rename Parkas to Inventorius.
- **Changed:** `quads-view.tsx` (tab label, id `inventorius`, `?tab=inventorius`), `quad-types-card.tsx` title; routing, components/common and changelog notes.
- **Status:** `tsc` clean; not browser-checked. No ADR (label rename).
- **Next:** none.


## 2026-11-12 — Composition and load pass on public pages

- **Why:** user asked to apply vercel-composition-patterns, frontend-design and vercel-react-best-practices to the storefront pages (dev server on 3001), then "fix all whats needed".
- **Changed:** stepper, schedule and estimate components split into variants (21 `Stepper` call sites migrated); `LandingProvider` lazy drawers; `/rezervacija` `Suspense`; `React.cache` in `lib/data/public.ts`; image `priority` → `loading="eager"` + `fetchPriority`; `use()` / ref-as-prop; `next.config.ts`; catalog, changelog, ADR-0065.
- **Status:** `tsc`, eslint, build clean. Cold-cache script transfer: `/` 306→320 KB, `/rezervacija` 374→330, `/renginiai` 332→246. First attempt without lazy drawers gave no change anywhere, so the drawers stayed lazy. The Next dev LCP warning on `wake.webp` is a false positive (same src used lazily lower down). Not committed.
- **Next:** `Suspense` on `/[service]`; eyeball the compact and dark steppers; decide on the numbered `01 /` labels.

## 2026-11-12 — Supabase audit and hardening

- **Why:** user asked for a security audit of storefront and admin (Supabase side), then "fix all".
- **Changed:** migration `20261111174736_security_hardening.sql` (applied via MCP slot `project-3`, which is the Vanduo project); ADR-0064; changelog; database.md. No app code.
- **Status:** applied and verified as `anon`. Admin RPCs `accept_inquiry_stays`, `release_inquiry_stays`, `discount_code_usage` already check page permissions. Not browser-checked; `/registracija` not re-run end to end.
- **Next:** enable leaked-password protection in Auth dashboard (not possible via MCP); test `/registracija` once; merging the 23 duplicate permissive policies left out on purpose (risk > gain).

## 2026-11-11 — SEO follow-up: landmarks, skip link, security headers

- **Why:** squirrelscan flagged missing main landmark/skip link on inner pages, no clickjacking header, label-in-name on day cells.
- **Changed:** `booking-page.tsx`, `keturraciai/page.tsx`, `service-page.tsx`, `next.config.ts`, `day-cell.tsx`, `landing-hero.tsx`; changelog.
- **Status:** committed on `fix/seo-a11y-headers`, not pushed. The day-cell label-in-name warning remains: the label contains the visible words, the tool wants them with no space.
- **Next:** owner decisions on thin-page copy, About page, postal code; CSP with nonces; image compression; turn `SITE_GATE` off at launch.

## 2026-11-11 — SEO audit of prod + local, fixes

- **Why:** `/openseo-seo-audit` showed prod is behind the site gate (503 + noindex); a local squirrelscan audit found missing canonicals/OG, no JSON-LD, no privacy/contact pages, orphan service pages.
- **Changed:** `lib/seo.ts`, `lib/structured-data.ts`, `components/json-ld.tsx`, `components/footer-links.tsx`, `components/legal/*`, `components/contact/*`, `/kontaktai`, `/privatumo-politika`, `public/llms.txt`, sitemap, page metadata, `site-header.tsx` aria-controls. See changelog and ADR-0063.
- **Status:** uncommitted; production build passes; checked with curl and squirrelscan, not by eye in a browser.
- **Next:** owner reviews the privacy text and company details, decides on About page and thin-page copy, then turns `SITE_GATE` off at launch.

## 2026-11-11 — my_riders: account phone compared as plain digits (applied)

- **Why:** Security review: `normalize_phone` was also applied to `auth.users.phone`, so a foreign 9-digit account number starting 8/6 could be rewritten to 370… and match a rider.
- **Changed:** new migration `20261111230000_my_rider_account_phone_plain.sql`; changelog entry.
- **Status:** applied to `mwngljhcvqkvncwbmgeo` via `supabase db query --linked -f` and verified (function body contains the new logic). `db push` is blocked by remote history timestamps that differ from local (earlier MCP applies); needs `migration repair` someday.
- **Next:** nothing pending; merged to `main` in PR #19.

## 2026-11-11 — my_riders exact phone match (applied)

- **Why:** Security review: matching on the last 8 digits could match foreign numbers.
- **Changed:** new migration `20261111220000_my_rider_exact_phone.sql`; ADR-0062 and changelog notes. Applied to the live project (project URL checked) and verified; committed on a branch.
- **Status:** the live DB now matches normalised phones exactly.
- **Next:** done; merged in PR #19.

## 2026-11-11 — Sidebar badge centring (robust)

- **Why:** Owner still saw the badge off-centre (their pasted DOM had the old class, i.e. an unreloaded page).
- **Changed:** `components/ui/sidebar.tsx` (badge centred with `top-1/2 -translate-y-1/2` on lg rows), changelog, ui catalog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** Hard-reload /admin and look at the badges.

## 2026-11-11 — Sidebar badge vertical alignment

- **Why:** Owner saw the count badges sitting higher than the sidebar labels.
- **Changed:** `components/ui/sidebar.tsx` (`SidebarMenuBadge` lg offset), changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** Check Užklausos / Kalendorius / Kuponai badges.

## 2026-11-11 — Sidebar top group alignment

- **Why:** Owner said the sidebar layout looked misaligned.
- **Changed:** `admin-nav.ts` (one top group instead of two header-less groups), changelog.
- **Status:** `tsc` clean; not browser-checked; the exact misalignment was not seen (no screenshot, no admin login), so this is a best guess.
- **Next:** Look at the sidebar and tell me what is still off.

## 2026-11-11 — Kuponai after Kainodara

- **Why:** Owner asked to place Kuponai after Kainodara.
- **Changed:** `components/admin/admin-nav.ts`, changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** None.

## 2026-11-11 — Nuolaidos after Kainodara

- **Why:** Owner asked to place Nuolaidos after Kainodara.
- **Changed:** `components/admin/admin-nav.ts`, changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** None.

## 2026-11-11 — Kalendorius after Užklausos

- **Why:** Owner asked to place Kalendorius after Užklausos.
- **Changed:** `components/admin/admin-nav.ts`, changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** Check the sidebar and mobile bar.

## 2026-11-11 — Užklausos after Klientai

- **Why:** Owner asked to place Užklausos after Klientai.
- **Changed:** `components/admin/admin-nav.ts`, changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** Check the sidebar.

## 2026-11-11 — Sidebar: Paslaugos, Klientai second

- **Why:** Owner asked to rename Pardavimai to Paslaugos and put Klientai after Apžvalga.
- **Changed:** `components/admin/admin-nav.ts`, changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** Check the sidebar and the mobile tab bar.

## 2026-11-11 — Program tile price size

- **Why:** Owner asked for smaller, medium-weight price text on program cards.
- **Changed:** `components/admin/sauna/program-tile.tsx`, changelog.
- **Status:** not browser-checked; uncommitted.
- **Next:** None.

## 2026-11-11 — Inquiries as a drag-and-drop board

- **Why:** Owner wanted /admin/uzklausos as three status columns with drag to change status.
- **Changed:** `inquiries-board.tsx`, `inquiry-card.tsx` (new), `inquiries-view.tsx`, catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; native drag does not work on touch (panel select is the fallback).
- **Next:** Try dragging in /admin/uzklausos; decide whether touch needs a drag library or a move menu.

## 2026-11-11 — Rider picker shows e-mail; my_riders applied

- **Why:** Owner asked for emails under the name in the new-bilietas dropdown, and to apply the pending migration.
- **Changed:** `components/admin/apyrankes/rider-select.tsx`; applied `my_riders` via MCP slot `supabase-project-3` (verified); notes.
- **Status:** `tsc` clean; dropdown not browser-checked.
- **Next:** Check the dropdown in /admin/apyrankes; check the Vandenlentės tab with a rider's contact.

## 2026-11-11 — Vandenlentės tab on /paskyra

- **Why:** Owner wanted customers to see their apyrankė plan on the account page.
- **Changed:** `rider-plans.tsx`, `account-tabs.tsx`, `app/paskyra/page.tsx`, `lib/account.ts`, `lib/account-data.ts`, hand-edited `database.types.ts`, migration `20261111210000_my_rider.sql` (NOT applied, blocked), ADR-0062, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; tab is empty until the migration is applied.
- **Next:** Owner allows / applies the migration, then sign in with a rider's email or phone and check the tab.

## 2026-11-11 — Add phone to the account

- **Why:** Owner wanted customers to add a phone number on /paskyra.
- **Changed:** `app/actions/customer.ts` (`sendPhoneChangeCode`, `confirmPhoneChange`), `add-phone.tsx`, `profile-card.tsx`, changelog.
- **Status:** `tsc`/`eslint` clean; not run end to end (real SMS).
- **Next:** Try it with your own number on /paskyra; consider the same for adding an email to phone-only accounts.

## 2026-11-11 — Quote popup close button

- **Why:** Owner saw the close icon at the top-left of the quote popup.
- **Changed:** `inquiry-list.tsx` (own top-right close), changelog.
- **Status:** `tsc` clean; not browser-checked as a customer.
- **Next:** Re-open a quote on /paskyra and check the X.

## 2026-11-11 — Pasiūlymai status badge removed

- **Why:** Owner found the "Gauta" badge unnecessary; show text only when approved.
- **Changed:** `inquiry-list.tsx`, changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** None.

## 2026-11-11 — Pasiūlymai details popup

- **Why:** Owner wanted to open all details of a quote from /paskyra.
- **Changed:** `inquiry-list.tsx` (client, popup), `lib/account.ts` / `account-data.ts` (`message`, `lines`, `contact`), `database.types.ts`, migration `20261111200000_my_inquiries_details.sql` (applied; first attempt blocked, applied after the owner allowed it), ADR-0061, changelog.
- **Status:** `tsc`/`eslint` clean; migration verified; not browser-checked as a customer.
- **Next:** Sign in as a customer, open Pasiūlymai and click a quote.

## 2026-11-11 — Inquiry sent popup

- **Why:** Owner asked for a success modal when the calculator form is sent.
- **Changed:** `inquiry-form.tsx`, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** Send a test inquiry (delete it afterwards in /admin/uzklausos) and look at the modal.

## 2026-11-11 — Estimate summary font weights

- **Why:** Owner saw no weight hierarchy in the calculator breakdown.
- **Changed:** `estimate-summary.tsx`, changelog.
- **Status:** not browser-checked; uncommitted.
- **Next:** Look at it on `/skaiciuokle` at 375 / 1024 px.

## 2026-11-11 — Calculator form prefilled for signed-in customers

- **Why:** Owner wanted the registered user's email as the default in the calculator form.
- **Changed:** `app/actions/customer.ts` (`loadCurrentCustomer`), `inquiry-form.tsx`, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** Sign in as a customer and open the form on `/skaiciuokle` and the home drawer.

## 2026-11-11 — my_inquiries migration applied

- **Why:** Owner asked to retry applying it after the classifier blocked the first attempt.
- **Changed:** applied `my_inquiries` via MCP slot `supabase-project-3` (project URL checked first); notes updated.
- **Status:** verified (anon cannot execute, authenticated can).
- **Next:** Sign in as a customer and check the /paskyra tabs.

## 2026-11-11 — /paskyra tabs and Pasiūlymai

- **Why:** Owner asked for tabs on the profile (Visi, pirtis, namukai, quads, pasiūlymai / skaičiuoklė).
- **Changed:** `account-tabs.tsx`, `inquiry-list.tsx`, `request-list.tsx`, `app/paskyra/page.tsx`, `lib/account.ts`, `lib/account-data.ts`, hand-edited `database.types.ts`, migration `20261111190000_my_inquiries.sql` (unapplied), ADR-0061, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; the migration was blocked by the permission classifier and still needs the owner's approval.
- **Next:** Approve / apply the migration, then sign in as a customer and check each tab.

## 2026-11-11 — /paskyra list heading removed

- **Why:** Owner asked to remove the "Rezervacijos" heading.
- **Changed:** `components/account/request-list.tsx`, changelog.
- **Status:** not browser-checked; uncommitted.
- **Next:** None.

## 2026-11-11 — Account button in the menu

- **Why:** Owner found no account page button in the hamburger menu.
- **Changed:** `menu-panel.tsx` (`account` prop), `main-header.tsx`, changelog.
- **Status:** checked at 375 px; uncommitted. The calculator's mobile total bar shows over the open menu (pre-existing).
- **Next:** Decide whether the calculator total bar should hide while the menu is open.

## 2026-11-11 — Open-menu header colours

- **Why:** Owner saw light nav links and close icon on the coral menu.
- **Changed:** `site-header.tsx` (ink text when `menuOpen`), changelog.
- **Status:** not browser-checked; uncommitted.
- **Next:** Open the menu at 375 / 1024 px and check the bar.

## 2026-11-11 — Calculator card controls: no top border

- **Why:** Owner asked to remove the top padding and border above the controls.
- **Changed:** `calculator-option-card.tsx`, changelog.
- **Status:** not browser-checked; uncommitted.
- **Next:** Look at the cards at 375 / 1024 px.

## 2026-11-11 — Inquiry-hold migration applied

- **Why:** Owner asked to apply the migration via MCP or token.
- **Changed:** applied `inquiry_stay_holds` to project `mwngljhcvqkvncwbmgeo` through MCP slot `supabase-project-3` (URL checked first; slots 1, 2 and skin365 are other projects); fixed the migration's header comment; notes.
- **Status:** verified: columns exist, anon cannot execute the functions, authenticated can. Recorded as version `20261111164744`.
- **Next:** Test accept / release end to end; regenerate types.

## 2026-11-11 — Sauna extras (priedai) in the calculator

- **Why:** Owner asked to drop the Pirtininkas toggle and let visitors pick the real priedai.
- **Changed:** `calculator-sauna-card.tsx` (Priedai row), `event-pricing.ts` (`extras`, `upsells`), `public.ts` loader, migration (`booking_extras`), inquiry mapper and sheet, notes.
- **Status:** `tsc`/`eslint` clean; browser-checked; accept flow untested; migration not applied.
- **Next:** Apply migration; accept an inquiry with extras.

## 2026-11-11 — Sauna programs in the calculator

- **Why:** Owner wanted programs (e.g. Privati pirtis su pirtininku) selectable per sauna.
- **Changed:** `calculator-sauna-card.tsx` (program tiles), `event-pricing.ts` (`programId`, `programHours`, catalog programs), `public.ts` loader, migration (program branch), inquiry mapper and sheet, notes.
- **Status:** `tsc`/`eslint` clean; browser-checked on `/skaiciuokle`; accept flow untested; migration not applied.
- **Next:** Apply migration; accept an inquiry with a program.

## 2026-11-11 — Calculator shows real saunas; accept books them

- **Why:** Owner wanted the calculator's Pirtis to list the real saunas and hold them like cabins.
- **Changed:** `calculator-sauna-card.tsx` (new), `event-pricing.ts` (`SaunaPick`, `CalculatorCatalog`,), `public.ts` / `booking-data.ts` (catalog loaders), calculator hook / pages / drawer, inquiry sheet and mapper, migration extended (unapplied), ADR-0060, changelog.
- **Status:** `tsc`/`eslint` clean; `/skaiciuokle` checked in the browser; accept flow untested; migration not applied.
- **Next:** Apply migration, accept an inquiry with a cabin and a sauna with a start hour.

## 2026-11-11 — Calculator card controls inline

- **Why:** Owner asked for the stepper and button to be on one line.
- **Changed:** `calculator-option-card.tsx` (flex row, wraps), changelog.
- **Status:** `tsc` clean; not browser-checked.
- **Next:** Check at 375 / 768 / 1024 px, esp. the Pirtis card with the Pirtininkas toggle.

## 2026-11-11 — Calculator WAKE cards match Pirtis / Keturračiai

- **Why:** Owner asked for the Pramogos cards to match each other.
- **Changed:** `entertainment-section.tsx` (descriptions on both WAKE cards), changelog.
- **Status:** `tsc` clean; not browser-checked; uncommitted.
- **Next:** Check at 375 / 768 / 1024 px; confirm the copy.

## 2026-11-11 — Accepting calculator inquiries books cabins

- **Why:** Owner wants accepted skaičiuoklė inquiries to take the quoted cabins so /rezervacija can't sell them.
- **Changed:** migration `20261111180000_inquiry_stay_holds.sql` (unapplied), hand-edited `database.types.ts`, `acceptInquiry` / `releaseInquiry` actions and store methods, `Inquiry.stays` mapping, inquiry sheet and card UI, ADR-0060, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; migration not applied.
- **Next:** Apply migration, regenerate types, test accept / release.

## 2026-11-11 — Namukai admin and data-driven cabins

- **Why:** Owner found no way to manage cabins (add homes, types) in the admin.
- **Changed:** new `/admin/namukai` (owner only) with `stay-types-card` / `stay-type-dialog`; `lib/cabin.ts` rewritten around `StayType`; public booking, reservation flow, service pricing, calculator and admin booking helpers switched from hard-coded sizes to `stay_types`; server actions `saveStayType` / `deleteStayType` / `loadStayTypes`; ADR-0059, changelog, catalog, AGENTS.md rule 5.
- **Status:** `tsc`/`eslint` clean; `/embed/miegas` and `/nakvyne` checked in the browser; admin page unchecked; uncommitted; no migration.
- **Next:** Owner login check of `/admin/namukai`; one test stay booking; decide whether types need reordering or named individual cabins.

## 2026-11-11 — Food tab hover text fix

- **Why:** Owner reported the active Gėrimai tab's text vanished on hover.
- **Changed:** `food-section.tsx` (added `data-active:hover:text-dust`), changelog.
- **Status:** Not browser-checked; uncommitted.
- **Next:** Browser-check hover on the calculator food tabs.

## 2026-11-11 — Switches removed from Pirtys and Priedai rows

- **Why:** Owner asked to remove the switches right after the lists were rebuilt.
- **Changed:** `sauna-row.tsx`, `upsell-row.tsx`, `saunas-card.tsx`, `upsells-card.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** Decide whether Programos should lose its switch too, for consistency.

## 2026-11-11 — Pirtys and Priedai back to lists

- **Why:** Owner sent a reference image of the list style and asked for Pirtys and Priedai in it.
- **Changed:** new `sauna-row.tsx`, `upsell-row.tsx`; `sauna-tile.tsx` and `upsell-tile.tsx` deleted; `saunas-card.tsx`, `upsells-card.tsx`; common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted.
- **Next:** Check the 30 % column at 1024 / 1440 px (thumbnail + switch + menu in a narrow row).

## 2026-11-11 — Sauna card menu: edit in, move out

- **Why:** Owner asked to remove move up / down and put an edit action in the dropdown.
- **Changed:** `sauna-tile.tsx`, `saunas-card.tsx` (reorder code removed), common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted. Sauna order can no longer be changed in the UI.
- **Next:** Decide whether the website sauna order needs a control somewhere (e.g. a sort field in the sauna editor).

## 2026-11-11 — Section header stacks in narrow columns

- **Why:** Screenshot showed "Naujas priedas" squeezing the Priedai note into a thin column.
- **Changed:** `admin-section.tsx` (container query), common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** Check Priedai at 1024 / 1440 px and Programos / coupon catalogue still keep the button beside the heading.

## 2026-11-11 — Programos button in the tabs row

- **Why:** Screenshot showed a gap above the tabs with the button on its own row.
- **Changed:** `programs-card.tsx` (button inside the tabs row), `admin-section.tsx` (no header row when nothing to show), common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — Programos heading and note removed

- **Why:** Owner asked to remove the Programos title and description block.
- **Changed:** `admin-section.tsx` (`hideHeading`), `programs-card.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — Section action button beside the heading

- **Why:** Screenshot showed "Naujas seansas" wrapping under the Programos heading and note.
- **Changed:** `admin-section.tsx` (header layout), common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** Check at 1024 px, where the Priedai column is narrow and its button may squeeze the note.

## 2026-11-11 — Sauna card: edit icon on top, switch removed

- **Why:** Owner asked for an edit icon in the card header and no show / hide switch.
- **Changed:** `sauna-tile.tsx` (rewritten), `saunas-card.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — Sauna card label and arrows removed

- **Why:** Owner asked to remove "Rodoma" and the arrows from the sauna cards.
- **Changed:** `sauna-tile.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — Sauna card cover removed

- **Why:** Owner asked to remove the cover image thumbnail from the sauna cards.
- **Changed:** `sauna-tile.tsx`, common catalog, changelog.
- **Status:** `tsc` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — /admin/pirtis 70/30 layout

- **Why:** Owner asked to stack Pirtys and Priedai as a 30 % column next to Programos.
- **Changed:** `sauna-view.tsx` (10-column grid), `saunas-card.tsx` / `upsells-card.tsx` (one column at `lg`), `programs-card.tsx` (3 columns max), common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted.
- **Next:** Check at 1024 / 1440 px: the narrow column may be tight for the sauna cards' bottom row (switch, arrows, menu).

## 2026-11-11 — Card background restored on /admin/pirtis sections

- **Why:** Owner asked to restore the background wrapper around each of the three sections.
- **Changed:** `admin-section.tsx` (`framed`), `saunas-card.tsx`, `upsells-card.tsx`, `programs-card.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted.
- **Next:** Check /admin/pirtis at 375 / 1024 / 1440 px (cards inside a card).

## 2026-11-11 — "Nauja pirtis" header button removed

- **Why:** Owner asked to remove the button from the /admin/pirtis header.
- **Changed:** `sauna-view.tsx`, changelog.
- **Status:** `tsc` clean; not browser-checked; uncommitted. No UI entry to `/admin/pirtis/nauja` remains.
- **Next:** Decide where creating a sauna should live (e.g. a button in the Pirtys section).

## 2026-11-11 — "Žr. klientus" link removed

- **Why:** Owner asked to remove the link at the bottom of /admin/pirtis.
- **Changed:** `sauna-view.tsx`, changelog.
- **Status:** `tsc` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — Priedai heading restored

- **Why:** Owner asked for the Priedai heading to be as it was.
- **Changed:** `upsells-card.tsx`, `admin-section.tsx` (`compact` removed), common catalog, changelog.
- **Status:** `tsc` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — Priedai made compact

- **Why:** Screenshot showed the Priedai cards too large for what they hold.
- **Changed:** `upsell-tile.tsx` (slim card), `upsells-card.tsx` (compact section, outline button), `admin-section.tsx` (`compact`), common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted.
- **Next:** Compare with the screenshot in the browser.

## 2026-11-11 — Seansai tab first and open by default

- **Why:** Owner asked to make Seansai the main tab on Programos.
- **Changed:** `programs-card.tsx` (default tab and tab order), common catalog, changelog.
- **Status:** `tsc` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — Programos first on /admin/pirtis

- **Why:** Owner asked to move Programos to the top of the page.
- **Changed:** `sauna-view.tsx` (order), common catalog, changelog.
- **Status:** `tsc` clean; not browser-checked; uncommitted.
- **Next:** none.

## 2026-11-11 — /admin/pirtis list items as cards, Priedai rename

- **Why:** Owner asked for card blocks in each of the three sections and to rename Papildomos paslaugos to Priedai.
- **Changed:** new `sauna-tile.tsx`, `upsell-tile.tsx`, `program-tile.tsx`; `saunas-card.tsx`, `upsells-card.tsx`, `programs-card.tsx`, `admin-section.tsx` (AdminRow removed); rename in sauna-view / sauna-form / sauna-upsells-field / price-preview / permissions / pricing-view; common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted with the other coupon and pirtis changes.
- **Next:** Check /admin/pirtis at 375 / 1024 / 1440 px (cover images, the 2-column row); commit and push.

## 2026-11-11 — /admin/pirtis sections unwrapped, two columns

- **Why:** Owner asked to unwrap the three sections from the card background and put Pirtys and Papildomos paslaugos side by side.
- **Changed:** new `admin-section.tsx`; `saunas-card.tsx`, `upsells-card.tsx`, `programs-card.tsx`, `sauna-view.tsx`, `coupon-products-card.tsx`; common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted with the other coupon changes.
- **Next:** Check /admin/pirtis at 375 / 1024 / 1440 px (the 2-column row, long names, the arrows in each sauna row); commit and push.

## 2026-11-11 — Coupon products unwrapped from the outer card

- **Why:** Owner asked to unwrap the product cards from the bg-card div.
- **Changed:** `coupon-products-card.tsx` (section instead of Card), common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted with the other coupon changes.
- **Next:** Check /admin/kuponai at 375 / 768 / 1280 px; commit and push.

## 2026-11-11 — Coupon products as card blocks

- **Why:** Owner asked to replace the list items in "Parduodami kuponai" with card blocks.
- **Changed:** new `coupon-product-tile.tsx`, `coupon-products-card.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted (together with the earlier filter removal).
- **Next:** Check /admin/kuponai at 375 / 768 / 1024 px; commit and push.

## 2026-11-11 — Coupon list service and date filters removed

- **Why:** Owner pasted the service select and date pickers on /admin/kuponai and asked to remove them.
- **Changed:** `coupons-view.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked; uncommitted (the previous push did not include it).
- **Next:** none.

## 2026-11-11 — Sales charts removed

- **Why:** Owner pasted the two chart cards and asked to remove them.
- **Changed:** `sales-chart.tsx` and `sales-breakdown.tsx` deleted, `sales-stats.tsx`, `lib/admin/sales-stats.ts` trimmed, catalogs, ADR-0058, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked.
- **Next:** none.

## 2026-11-11 — Period line removed from sales stats

- **Why:** Owner asked to remove the dates / compared-with line above the stat cards.
- **Changed:** `sales-stats.tsx`, common catalog, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** none.

## 2026-11-11 — Sales filters reduced to tabs, all dates

- **Why:** Owner pasted the period buttons and the date / status / search row and asked to remove them and just show all dates.
- **Changed:** `sales-filters.tsx` (tabs only), `use-sales.ts` (empty range), common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked. With all dates, the "% prieš ankstesnį laikotarpį" lines no longer show.
- **Next:** Decide whether the table needs a search back once the sale list grows.

## 2026-11-11 — Week calendar removed from Apžvalga

- **Why:** Owner asked to remove the Kalendorius card too.
- **Changed:** `week-calendar.tsx` deleted, `overview.tsx`, common catalog, changelog, status.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** none.

## 2026-11-11 — Reikia dėmesio removed

- **Why:** Owner asked to remove the attention tiles from Apžvalga.
- **Changed:** `attention-strip.tsx` deleted, `overview.tsx`, common catalog, changelog, status.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** none.

## 2026-11-11 — Week calendar spacing

- **Why:** Screenshot showed too much gap above the list and list rows with no side padding.
- **Changed:** `week-calendar.tsx` (row style, gaps), changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** Compare against the screenshot in the browser.

## 2026-11-11 — Week calendar on Apžvalga

- **Why:** Owner sent a week-strip reference and asked to replace the schedule and inquiries cards with a calendar.
- **Changed:** new `week-calendar.tsx`; `today-schedule.tsx`, `latest-inquiries.tsx` deleted; `overview.tsx`; common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked.
- **Next:** Check the strip at 375 px (7 chips plus the three header buttons) and click a booking, a rental and an event row.

## 2026-11-11 — Apžvalga UI/UX fixes

- **Why:** Owner asked to fix everything from the Apžvalga review.
- **Changed:** new `attention-strip.tsx`, `today-schedule.tsx`, `latest-inquiries.tsx`; `overview.tsx` rewritten; `sales-stats.tsx`, `sales-chart.tsx`, `sales-table.tsx`, `lib/admin/sales.ts`, `sales-stats.ts`; common + utils catalogs, ADR-0058, changelog, status.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked (staff sign-in).
- **Next:** Sign in and check `/admin` at 375 / 768 / 1024 px; confirm with the owner that coupons stay out of revenue.

## 2026-11-11 — Sales stats first on Apžvalga

- **Why:** Owner sent a screenshot of the stats block and asked to place it first on Apžvalga.
- **Changed:** new `use-sales.ts`, `overview.tsx`, `sales-table.tsx` (controlled), common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked. The filters stay in the Pardavimai card at the bottom while the stats on top follow them.
- **Next:** Decide whether the date range / category filters should also sit above the stats.

## 2026-11-11 — Coupon list with filters

- **Why:** The coupon cards grid on /admin/kuponai does not scale to many orders.
- **Changed:** new `coupon-list.tsx`, `coupons-view.tsx` (service + date filters), `coupon-card.tsx` deleted, common catalog, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked (staff sign-in).
- **Next:** Check /admin/kuponai at 375 / 768 / 1024 px.

## 2026-11-11 — Artimiausi renginiai card removed

- **Why:** Owner asked to remove it from Apžvalga.
- **Changed:** `overview.tsx`, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** none.

## 2026-11-11 — Apyrankės heading renamed

- **Why:** Owner asked for the Apžvalga section heading to read Vandenlentės.
- **Changed:** `overview.tsx` heading, changelog.
- **Status:** copy only; not browser-checked.
- **Next:** none.

## 2026-11-11 — Sales rows open their record

- **Why:** Owner wants to press a Pardavimai row to open its booking, sale or drawer.
- **Changed:** `lib/admin/sales.ts` (`target`), `sales-table.tsx` (clickable rows, three sheets, router), catalogs, changelog.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked (staff sign-in).
- **Next:** Click one row of each kind and check that the drawer or page opens; tickets have no drawer yet and only link to their page.

## 2026-11-11 — Two Apyrankės stat cards removed

- **Why:** Owner asked to remove "Apyrankės priskirtos" and "Naudotojai iš viso" from Apžvalga.
- **Changed:** `overview.tsx`, changelog.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** Check `/admin` at 375 / 768 / 1024 px.

## 2026-11-11 — Top stat cards removed from Apžvalga

- **Why:** Owner pasted the top four-card row and asked to remove it.
- **Changed:** `components/admin/overview/overview.tsx` (row and its unused values/imports), changelog, status.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** Check `/admin` at 375 / 768 / 1024 px.

## 2026-11-11 — Sales stats moved below the card

- **Why:** Owner asked for the stat cards below the Pardavimai section.
- **Changed:** `sales-table.tsx` (stats rendered after the card), common catalog, changelog, status.
- **Status:** `tsc`/`eslint` clean; not browser-checked.
- **Next:** Check `/admin` at 375 / 768 / 1024 px.

## 2026-11-11 — Sales stats and charts

- **Why:** Owner asked for stat cards and charts inside Pardavimai for an overview and to see improvement.
- **Changed:** `lib/admin/sales-stats.ts`, `components/admin/overview/sales-stats.tsx` / `sales-chart.tsx` / `sales-breakdown.tsx`, `sales-table.tsx`, common + utils catalogs, ADR-0058, changelog, status.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked (staff sign-in); no chart dependency added.
- **Next:** Check `/admin` at 375 / 768 / 1024 px, especially the chart caption on a phone.

## 2026-11-11 — Apžvalga sales table

- **Why:** Owner wants to see all sales on the dashboard and filter by service and date range.
- **Changed:** `lib/admin/sales.ts` (new), `components/admin/overview/sales-table.tsx` + `sales-filters.tsx` (new), `overview.tsx`, changelog, status.
- **Status:** `tsc`/`eslint`/`design:check` clean; not browser-checked (staff sign-in). Date range filters the sale date (`createdAt`; coupons `paidAt`), not the service date.
- **Next:** Sign in and check `/admin` at 375 / 768 / 1024 px; decide whether a service-date filter is also wanted.

## 2026-11-10 — Big Shoulders removed

- **Why:** Dev log warned about Big Shoulders on every compile and the user does not use it.
- **Changed:** `app/layout.tsx`, `app/globals.css` (`font-display`, `font-wordmark`), DESIGN.md, design-system, brief, common catalog, ADR-0057, changelog, status.
- **Status:** `tsc`/`eslint`/`design:check` clean; wordmark size is an estimate.
- **Next:** Check the `/netrukus` wordmark at 375 and 1280 px; restart `pnpm dev`.

## 2026-11-10 — Coral-ink focus ring

- **Why:** Full-opacity coral was still 2.6:1 on blush.
- **Changed:** `--ring` -> `--raw-coral-ink` in `app/globals.css`; DESIGN.md focus colours; design-system, changelog, status.
- **Status:** lint/check clean; not browser-checked; ink-band focus unmeasured.
- **Next:** Check focus on the ink header and menu, and keyboard order.

## 2026-11-10 — Full-opacity focus rings

- **Why:** User chose full opacity for focus.
- **Changed:** `ring-ring/50` and destructive focus tints replaced by full-opacity rings across `components/ui/` and two admin inputs; DESIGN.md focus-opacity 1.
- **Status:** `tsc`/`eslint` clean; not browser-checked; coral on blush still 2.6:1.
- **Next:** Decide a darker focus colour; browser check.

## 2026-11-10 — Enforce, export and accessibility checks

- **Why:** Run the remaining zero-slop-design skills.
- **Changed:** `tools/zero-slop-design/`, `design-check.config.json`, `design-check.known.json`, `design:check` script, 3 exception comments, DESIGN.md notes; contrast figure corrected to 5.2:1.
- **Status:** `check-code` 0 errors; `tsc` clean; export blocked by lint warnings; accessibility partly measured.
- **Next:** Decide CI wiring and the focus-ring contrast; keyboard and zoom pass in a browser.

## 2026-11-10 — Design drift check

- **Why:** `review-design-drift` on `/` at 1280 px.
- **Changed:** `DESIGN.md` band text (`surface`); changelog, status.
- **Status:** 6/8 values matched; the stale dev-server CSS hid the `text-on-rust` change; lint re-run clean.
- **Next:** Restart `pnpm dev`, re-measure coral surfaces, check 375/768/1024 px and states.

## 2026-11-10 — Dark text on all coral surfaces

- **Why:** User approved extending `text-on-rust` beyond the Cta.
- **Changed:** Menu panel, ticker, hero sticker, all-in band, TOP badge, four coral hover states (10 files in `components/`); DESIGN.md, design-system note, changelog, status.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted on `main`.
- **Next:** Browser pass; decide the booking-tabs count badge (`text-foam` on coral).

## 2026-11-10 — Coral Cta dark text

- **Why:** Aligned the code with the DESIGN.md decision (ink on coral failed 4.5:1).
- **Changed:** `--on-rust` token + `text-on-rust` binding in `app/globals.css`; `components/cta.tsx` coral tone; `DESIGN.md`, design-system token table, changelog, status.
- **Status:** `tsc`/`eslint` clean; not browser-checked; uncommitted on `main`.
- **Next:** Browser-check coral buttons; decide the other coral surfaces.

## 2026-11-10 — DESIGN.md review and corrections

- **Why:** `review-design-md` found 13 defects and 4 open decisions; the user asked me to decide and proceed.
- **Changed:** `DESIGN.md` (tokens, states, source values), `design-brief.md` (decisions), `design-system.md` weights note, changelog, status.
- **Status:** Docs only. Lint valid, 0 errors. Not marked `reviewed`.
- **Next:** Align `components/cta.tsx` with the dark-text decision, then run `review-design-drift`.

## 2026-11-10 — Design brief and DESIGN.md (zero-slop-design plugin)

- **Why:** Installed the zero-slop-design plugin and recorded the design intent in files agents can read.
- **Changed:** New `obsidian/frontend/design-brief.md` and root `DESIGN.md` (tokens from `app/globals.css`, admin dark mode as a mode); changelog entry.
- **Status:** Docs only. `zsd lint` valid, 0 errors. Not reviewed (`review.status: draft`).
- **Next:** Decide coral button text colour (3.68:1 today), correct the stale font-weight note in `design-system.md`, run `review-design-md`.

## 2026-11-10 — Staff SMS recipients page (ADR-0056)

- **Why:** Owner wanted to set which phone numbers get which notifications (bookings, everything, etc.) from the admin.
- **Changed:** Migration `20261110140000_notification_recipients.sql`, `lib/sms/staff-recipients.ts` + `notify.ts` / `lib/notify.ts` (topic per message), `app/admin/notification-actions.ts`, utils catalog rows, store + repository + mapper, `components/admin/notifications/`, `/admin/pranesimai`, sidebar row.
- **Status:** `tsc`/`eslint` clean; migration applied and verified, not browser-checked. Uncommitted on `main`.
- **Next:** Browser pass, one test booking to see the SMS routing.

## 2026-11-10 — Styled calendar in admin date fields

- **Why:** The Data field showed the browser's native calendar popup.
- **Changed:** `DatePicker` in `event-dialog.tsx`, `tour-departure-dialog.tsx`, `booking-when-fields.tsx`.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check the popup inside a dialog (z-index/scroll) and that picking a date in the new-booking form still resets the slot.

## 2026-11-10 — Session dialog: no category, sauna select

- **Why:** Owner asked to remove Kategorija when editing a seansas and make Vieta a sauna select.
- **Changed:** `event-dialog.tsx` (`lockCategory` for any preset, `place` select from `saunas`, attendant suffix kept).
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check an existing session ("Pirtis Marse · su pirtininku") saves unchanged; extract session fields if the dialog grows.

## 2026-11-10 — Quad tours on dated departures (ADR-0055)

- **Why:** The owner wants tour types in Keturračiai with dated events under each, and the storefront to sell only those dates (like sauna sessions).
- **Changed:** Migration file + hand-edited types; mappers, `saveEvent`, public data (`departures`), `quad-tour-plan` (`quadTourDepartureSlots`, `eventId` on the pick), schema/action/submit, `QuadServiceBooking` / `QuadTourCard` / `QuadTimeField`; admin `TourDepartureDialog`, Turai tab layout, `ToursTab` rentals, `TourRoutesCard` wording; calendar entries and `EventSheet`.
- **Status:** `tsc`/`eslint` clean; migration tested in a rolled-back transaction, then applied by the owner and verified (columns, trigger, policies, function grants); types regenerated; pages return 200. Not browser-checked.
- **Next:** Add departures per type in the Turai tab; browser pass on /keturraciu-nuoma, /rezervacija (Keturračiai tab) and the admin; one paid test booking in Stripe test mode.

## 2026-11-10 — No Vieta field when adding a tour

- **Why:** Owner asked to remove the Vieta field from the new-tour form.
- **Changed:** `event-dialog.tsx`: field hidden for a new keturratis event; default place "Vanduo Marse".
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** none.

## 2026-11-10 — Kalendorius: distinct type colours

- **Why:** Pirtis (coral) and Renginiai (softened coral) looked alike on the owner's screenshot.
- **Changed:** new `--calendar-pink`; `KIND_BG` / `KIND_CARD`; thick left border on `EntryCard`.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check the four colours side by side, including dark mode; the teal seat dot on every card may also add noise.

## 2026-11-10 — Kalendorius card tints made visible

- **Why:** The owner described the wanted look (light red bg + red border; light dark bg + dark border; light brown bg + brown border); the first tints were too faint.
- **Changed:** `KIND_CARD` opacities; new `--calendar-brown` token in `globals.css`.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Eyeball the tints in light and dark mode; tune opacities if needed.

## 2026-11-10 — Kalendorius cards tinted

- **Why:** Owner wanted light-coloured card backgrounds with a border matching the type dot.
- **Changed:** `KIND_CARD` map and `EntryCard` classes.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check contrast of the tints in dark mode.

## 2026-11-10 — Kalendorius type colours

- **Why:** Owner chose Pirtis red, Apgyvendinimas dark, Keturračiai light brown, Renginiai pink.
- **Changed:** `KIND_BG` in `kind-dot.tsx` (only Keturračiai and Renginiai moved).
- **Status:** `tsc` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check the pink reads as pink on the blush page; adjust the opacity if not.

## 2026-11-10 — Kalendorius: Nameliai -> Apgyvendinimas

- **Why:** The owner asked for the rename.
- **Changed:** chip label in `calendar-entries.ts` and the page description.
- **Status:** `tsc` clean; uncommitted on `main`.
- **Next:** none.

## 2026-11-10 — Kalendorius filters merged

- **Why:** Seansai, Kemperiai and Turai chips duplicated Pirtis, Nameliai and Keturračiai.
- **Changed:** `calendar-entries.ts` (kinds reduced to four, bookings/events mapped into them), `kind-dot.tsx`, description text.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** none specific.

## 2026-11-10 — Pridėti turą on the quads admin

- **Why:** Tours were created in Renginiai; the owner wants them on the quads page, like seansai for the sauna.
- **Changed:** `quads-view.tsx` (button + dialog + tour list), new `category-events-list.tsx` (shared with `SaunaSessionsList`), `event-dialog.tsx` copy map, `tours-tab.tsx`. No schema change.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Browser check: add, edit, publish, delete a tour; `new-rental-dialog.tsx` and `rentals-tab.tsx` are now unused.

## 2026-11-10 — Quad page widget: tours only

- **Why:** The owner only sells tours; the Turas su gidu / Nuoma valandomis switch was removed.
- **Changed:** `quad-service-booking.tsx`, `reservation-flow.tsx` (props), `service-page.tsx` (intro text). `quad-hourly-controls.tsx` is unused.
- **Status:** `tsc`/`eslint` clean; not clicked through. Uncommitted on `main`.
- **Next:** Remove the hourly prices from the page's pricing/facts sections if wanted; delete `quad-hourly-controls.tsx`.

## 2026-11-10 — Keturračiai admin: Nuoma tab removed, Žygiai -> Turai

- **Why:** The owner asked to remove the Nuoma tab and rename Žygiai to Turai.
- **Changed:** `quads-view.tsx` (tabs Turai / Parkas), `tours-tab.tsx` copy, Kalendorius chip label. `rentals-tab.tsx` is now unused.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Decide whether to keep "Nauja nuoma" and delete `rentals-tab.tsx`; hourly rentals from /keturraciu-nuoma can only be managed via Kalendorius now.

## 2026-11-10 — /pirtis: no Pirtininkas step

- **Why:** The owner does not want the Pirtininkas selection in the booking widget.
- **Changed:** `sauna-service-booking.tsx` (no programId state, venue gates the date), `sauna-service-options.tsx` (programs fieldset removed), `sauna-service-time.tsx` (several programs listed in Laikas, value `programId:hour`).
- **Status:** `tsc`/`eslint` clean; not clicked through. Uncommitted on `main`.
- **Next:** Click through Privati -> sauna -> date -> time for a sauna with two programs (Malkine pirtis) and check the checkout shows the chosen program.

## 2026-11-10 — Tipas removed from the program dialog entirely

- **Why:** The owner asked to remove the same dropdown from the edit dialog.
- **Changed:** `program-dialog.tsx`: no kind select; `changeKind` removed. Kind is fixed per program.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** A new private program can't be created from the UI now; add a dedicated button if needed.

## 2026-11-10 — New program dialog without Tipas

- **Why:** The owner postponed assigning extras to programs and asked to remove the Tipas dropdown when adding a new program.
- **Changed:** `program-dialog.tsx`: Tipas only when editing; description updated. No schema change.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Decide how a new private program should be created now (Tipas is hidden on create). Extras-per-program (new `sauna_program_upsell_links` table + program booking RPC) is still open.

## 2026-11-10 — /pirtis Tipas split into type, then sauna

- **Why:** My previous change merged the saunas into Tipas; the owner wanted Tipas = Privati pirtis / Pirties seansas, then "Pirties tipas" = the admin's saunas after choosing Privati.
- **Changed:** `sauna-service-booking.tsx` (two Tipas chips, venue state back), `sauna-service-options.tsx` (venue fieldset "Pirties tipas" restored, from admin saunas only).
- **Status:** `tsc`/`eslint` clean; first step verified in SSR output; interaction not clicked through. Uncommitted on `main`.
- **Next:** Click through Privati -> sauna -> Pirtininkas -> date -> time at 375 / 768 / 1024 px.

## 2026-11-10 — Sidebar flattened to simple links

- **Why:** The owner asked to unwrap the Pirtis / Namukai / Keturračiai dropdowns into simple links.
- **Changed:** `admin-nav.ts`: Pirtis and Keturračiai are plain rows; Namukai dropped (same page as Kainodara).
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Decide on a Rezervacijos row (booking list has none) and whether to delete the unused domain code.

## 2026-11-10 — Sidebar: drop duplicate Kalendorius rows

- **Why:** The owner asked to remove Kalendorius from the Pirtis and Namukai dropdowns now that there is a top-level one.
- **Changed:** `admin-nav.ts`; badge and `primary` moved to the new row.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Decide where the Rezervacijos booking list should live in the menu (currently no row).

## 2026-11-10 — Edit event in place on Kalendorius

- **Why:** "Redaguoti renginį" redirected to Renginiai; the owner wanted a dialog on the calendar page.
- **Changed:** `EventSheet` `onEdit` prop (button instead of link); `CalendarView` opens `EventDialog` for the event after closing the panel.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check saving an edit updates the card and the seats in the grid.

## 2026-11-10 — Day / week / month tabs on Kalendorius

- **Why:** The owner wanted to switch the calendar between day, week and month.
- **Changed:** Tabs in `CalendarView`; new `WeekView`, `DayView`, `DayMenu`; `MonthGrid` uses `DayMenu`; `weekDays` helper. No schema change.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check week columns at 768 / 1024 px (cards are narrow in 7 columns) and the stacked week on a phone.

## 2026-11-10 — Icons on Kalendorius type markers

- **Why:** The owner wanted icons next to the colour bullets, like on the reservation page.
- **Changed:** `KindMark` (dot + icon) in `components/admin/calendar/kind-dot.tsx`, used by filter chips, `EntryCard`, `DayAgenda`; icons from `ACTIVITY_ICON` plus tent and confetti.
- **Status:** `tsc`/`eslint` clean; not browser-checked. Uncommitted on `main`.
- **Next:** Check icon sizes in the filter chips and cards at 375 / 768 / 1024 px.

## 2026-11-10 — Day-cell context menu on Kalendorius

- **Why:** The owner wanted the same right-click actions on the unified calendar as on the sauna calendar.
- **Changed:** `MonthGrid` day cells have a `ContextMenu` (new booking, new sauna session, new event, show day list); `CalendarView` opens `NewBookingDialog` / `EventDialog`; `EventDialog` gains `presetDate`. No schema change.
- **Status:** `tsc`/`eslint` clean; not browser-checked (admin login). Uncommitted on `main`.
- **Next:** Browser pass: right-click on desktop, long-press on a phone, creating a booking, a session and an event from a cell. Right-click on an individual card currently shows the day menu, not an edit menu.

## 2026-11-10 — Kalendorius shows events with their bookings

- **Why:** The owner wanted the calendar to show events (not only bookings) with each event's bookings inside, styled like a reference screenshot but in the project's own tokens.
- **Changed:** `calendar-entries.ts` adds events (kind `seansas` / `zygis` / `renginys`, seats) and `ticketsFor`; new `EntryCard` and `EventSheet`; `MonthGrid` shows cards per day from md up; `DayAgenda` and `CalendarView` updated. No schema change.
- **Status:** `tsc`/`eslint` clean; not browser-checked (admin login). Uncommitted on `main`.
- **Next:** Browser pass at 375 / 768 / 1024 px: card density in a busy day, the "+N daugiau" link, opening an event, confirming a ticket from the sheet.

## 2026-11-10 — /pirtis Tipas shows the admin's saunas

- **Why:** The booking widget's Tipas was hard-coded (Privati pirtis / Pirties seansas); the owner wants it to show the pirtis added in admin.
- **Changed:** `sauna-service-booking.tsx` builds Tipas from `saunaServiceVenues(data)` (active saunas only) + a sessions chip; `sauna-service-options.tsx` lost the hard-coded fallback venues and the extra Pirtis step.
- **Status:** `tsc`/`eslint` clean; SSR output checked on live data; interaction (pick sauna -> programs -> date -> time) not clicked through. Uncommitted on `main`.
- **Next:** Click through at 375 / 768 / 1024 px. A sauna with several private programs still needs a program pick; one with none shows the contact line.

## 2026-11-10 — Unified Kalendorius page

- **Why:** The owner wanted one admin page to see all bookings (sauna, quads, cabins, ...) and the dashboard to lead there.
- **Changed:** New `/admin/kalendorius` (month grid + day agenda + type filters), `lib/admin/calendar-entries.ts`, `components/admin/calendar/*`, a sidebar row, and a link from Apžvalga. Reuses `BookingSheet` / `RentalSheet`. No schema change.
- **Status:** `tsc`/`eslint` clean; route guard verified via curl; not browser-checked. Uncommitted on `main`.
- **Next:** Browser pass at 375 / 768 / 1024 px as staff: filters, month switching, opening a booking and a rental, ticket links. Quad tours filed as rentals show fleet labels, not the route name; say if the route name should show.

## 2026-11-10 — Sauna sessions tab in /admin/pirtis

- **Why:** The owner wanted to create pirties seansai inside the sauna admin, not in Renginiai.
- **Changed:** `ProgramsCard` has Programos / Seansai tabs; new `SaunaSessionsList`; `EventDialog` gets `presetCategory`. No schema change.
- **Status:** `tsc`/`eslint` clean; not browser-checked (admin login needed). Code uncommitted on `main`.
- **Next:** Browser pass at 375 / 768 / 1024 px: create, edit, publish and delete a seansas from the tab.

## 2026-11-10 — Hourly quad rental on the quad page

- **Why:** The owner has the "Nuoma" (hourly rental) fleet in admin Parkas but the public quad page offered only the guided tours.
- **Changed:** `QuadServiceBooking` gets a Turas / Nuoma mode switch; new `components/quads/quad-hourly-controls.tsx`; `ReservationFlow` passes `picks.keturraciai` and keeps tour and rental exclusive (`onQuadPick`, start reset on a new day); `service-pricing.tsx` and `quad-service-facts.ts` list the hourly prices and limits from the rows; panel intro text made neutral. No database change: the hourly RPCs and `planQuads` already existed.
- **Status:** `tsc`/`eslint` clean. On live data in the browser: prices and facts show 30 / 45 EUR per hour; 2 quads x 1 h = 60 EUR; the checkout dialog shows "Mokėti 60 €" (disabled until a contact is verified); switching back to a tour clears the rental. No booking or payment was made. Branch `feat/quad-tour-products`.
- **Next:** `/rezervacija`'s Keturračiai tab still shows only tour cards (no hourly rental there); say if it should get the same switch. Hourly rentals are filed as a "Keturračiai" payment line, like tours.
- **Docs:** `components/common.md`, `changelog.md`, `status.md`, this entry.

## 2026-11-10 — Payable quad tours, live database (ADR-0053)

- **Why:** The owner chose to put the quad tour products in the database so tours can be booked and paid like the sauna (the quad dialog was a mailto preview with constant prices), then asked to fix the padding of the booking-confirmed screen.
- **Changed:** Live database: `quad_tour_routes`, `quad_tour_accessories`, `quad_settings.tour_cancellation_note`, `quad_rentals.tour_route_id` / `tour_accessories`, RPC `create_quad_tour_rental` (migration `20261109200000`, applied with `supabase db query --linked` after three aborted-transaction dry runs; seeded with the old constants). Code: data layer, `quadTourRental` request pipeline, `quad-tour-plan.ts`, `ReservationFlow` `tourPick`, `QuadServiceBooking` on `/keturraciu-nuoma`, pricing and facts from rows, admin cards, mailto preview removed, receipt padding fix. Branch `feat/quad-tour-products`, 4 commits, not pushed.
- **Status:** `tsc`, `eslint`, `next build` clean. Browser-checked on localhost against live data up to the checkout dialog (Midi x 3 = 237 EUR, discount code, "Mokėti 237 €", disabled until a contact is verified). No payment or booking was made. Admin cards not browser-checked.
- **Next:** Push and open a PR. Check the admin cards and one real paid test booking in a Stripe test setup. The pre-existing branches (`/pirtis` live-data, event dialog, quad calendar, font warning) are still unpushed; this branch carries the `ServiceDateField` rename from the quad calendar branch. The `/keturraciai` design page still has its own "Dizaino peržiūra" title.
- **Docs:** `decisions-log.md` (ADR-0053), `changelog.md`, `status.md`, `components/common.md`, this entry.

## 2026-11-09 — Klientai: owner-only "Rolė" tab to make a customer an admin (ADR-0051)

- **Why:** The owner asked for a tab on `/admin/klientai/[id]` to set a customer as admin or assign a permissions role.
- **Changed:** New `components/admin/klientai/customer-role-tab.tsx` and an owner-gated tab in `customer-page.tsx`. A customer is linked to a staff login by email; existing login → change role / switch off, none → create login with a role and show the temporary password once. Fast-forwarded local `main` to `origin/main` first (it was 8 commits behind and lacked the Klientai page).
- **Status:** `eslint` clean; `tsc` shows no errors in the new files (5 pre-existing typed-route errors in `app/admin/(panel)/{klientai,apyrankes}` pages, from stale generated route types). Uncommitted, not browser-checked.
- **Next:** Browser pass as owner on a customer with and without an email / matching login at 375 / 768 / 1024 px; commit.
- **Docs:** `decisions-log.md` (ADR-0051), `changelog.md`, `status.md`, `components/common.md`, `routing.md`, this entry.

## 2026-11-09 — Reviewed and merged the service-pages branch (`codex/service-pages-and-site-feedback`)

- **Why:** A contributor's branch added public activity pages (`/pirtis`, `/keturraciu-nuoma`, `/nakvyne`, `/restoranas`, `/vandenlentes`, event pages) through a dynamic `app/[service]/page.tsx`; the owner asked for it to be reviewed and merged.
- **Reviewed:** `tsc --noEmit`, full `eslint --max-warnings 0` and `pnpm build` clean. Diff scanned for inline styles, hex, arbitrary Tailwind values, `any` and hard-coded prices: none. Not browser-checked at 375 / 768 / 1024 px.
- **Follow-ups for the owner (content / policy, not code defects):** (1) `/kuponai` copy now says a paper coupon is used in one go, while the app and admin still support partial balances (`coupon_balance`); (2) `/keturraciu-nuoma` shows tour prices from `QUAD_PREVIEW_ROUTES` (59 / 79 / 105 EUR), a component constant, not the `quad_types` rows in Supabase (rule 5); (3) a new `RESERVATION_PHONE` (+370 640 57504) now shows in the hero and reservation summary; (4) `getSaunaPageData` renames the seeded sauna to "Suomiška sauna" and drops "Kūrenama malkomis" in code instead of editing the Supabase row; (5) `service-reviews.tsx` carries paraphrased third-party reviews with reviewer names and source links that nobody here verified; (6) the Miegas Marse and Boardsports contacts were removed from `CONTACTS` (cabins now use the main Vanduo Marse contact).
- **Next:** Decide on the six follow-ups; browser pass on the new pages.
- **Docs:** this entry, `status.md`; the branch already updated `changelog.md`, `decisions-log.md`, `routing.md`, `common.md`.

## 2026-11-08 — Instruktorius: bracelet check-in/out scanning page (ADR-0045)

- **Why:** The owner wants an instructor-focused admin screen: scan a rider's bracelet and see their name, photo, surname, phone and how long they've currently been out on the water. Asked them directly what "session duration" should mean (a real check-in/out timer, remaining time on a timed plan, or no timer) — they chose the check-in/out timer, since nothing in the schema tracked that at all.
- **Changed:** New permission `instruktorius` (`lib/admin/permissions.ts`, own nav row in `admin-nav.ts`, deliberately not folded into `apyrankes`). New table `rider_sessions` (`rider_id`, `card_number` snapshot, `started_at`, nullable `ended_at`, partial unique index enforcing one open session per rider) — migration `supabase/migrations/20261107180000_instructor_sessions.sql`. New server action `scanRiderSession` (`app/admin/actions.ts`): resolves the card via `rider_cards`, opens a session if the rider has none running, closes the open one if they do — one scan, two meanings depending on state, same convention the bracelet reader already uses elsewhere. New type `RiderSession` + mapper `toRiderSession`; `loadAdminData` loads it only for staff with the permission (`readRiderSessions`, bounded to the last 24h, same optional-data pattern as discount codes). New `InstruktoriusView`/`ActiveSessionRow` (`components/admin/instruktorius/`), reusing `ScanTarget`/`RiderAvatar`/`PlanBadge` from `apyrankes/`; new shared `useElapsed(startedAt, endedAt)` hook (`hooks/use-elapsed.ts`) ticks the live list every second. New route `/admin/instruktorius`.
- **Applied:** First attempt (without explicit go-ahead in that message) was refused by Claude Code's auto-mode production-deploy classifier; the owner then explicitly approved it. Applied `20261107180000_instructor_sessions.sql` to the live "Vanduo" project via the Supabase MCP (`apply_migration`), regenerated `lib/supabase/database.types.ts` for real (`generate_typescript_types`) and reapplied the documented `create_inquiry.p_date` nullable hand-edit per ADR-0042's convention. Security advisor: no new findings.
- **Status:** `tsc --noEmit`, full-repo `eslint` and `next build` all clean against the real generated types.
- **Next:** Assign the `instruktorius` permission to a role (Darbuotojai), then a browser pass: scan in, scan out, confirm the live list and duration tick correctly, at 375/768/1024 px.
- **Docs:** `decisions-log.md` (ADR-0045), `changelog.md`, `status.md`, `components/common.md`, `hooks.md`, `database.md`, this entry.

## 2026-11-09 — Unit moved inside the price input; a couple more row titles bumped to Medium

- **Why:** Two more screenshots — Renginiai's table still had `font-normal` event/ticket titles the earlier admin sweep missed; separately, the owner asked for the unit text ("min. sąsk. €" etc.) to sit inside the amount field, before the number, instead of as its own line under the label.
- **Changed:** New `UnitAmountInput` (`components/admin/unit-amount-input.tsx`): a bordered box styled like the shared `Input`, with the unit as a muted prefix and a borderless native `<input>` (right-aligned, `tabular-nums`) inside it. Replaces the separate `<p>{item.unit}</p>` line in `PriceGroupForm` (Kainodara) and `SaunaRatesFields` (Pirtis rates) — the latter still passes `type="number"` through for RHF's `valueAsNumber`. Also bumped `EventsView`'s event/ticket row titles and the customer-name line in `BookingSheet`/`InquirySheet`/`CouponSheet`/`RentalSheet` from `font-normal` to `font-medium`, following the same pattern as the earlier sweep.
- **Status:** `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean. Not yet re-screenshotted.
- **Next:** Confirm the unit text doesn't crowd the number for the longest units ("€/asm./naktis", "min. sąsk. €") at narrow widths; the box is `min-w-28` but not capped, so it should grow instead of truncate — worth a phone-width check.
- **Docs:** `changelog.md`, `components/common.md`, `status.md`, this entry.

## 2026-11-09 — Removed the unused "laimeta"/"prarasta" inquiry statuses, enum and all (ADR-0047)

- **Why:** From a screenshot of `/admin/uzklausos`, the owner asked to remove the "Laimėta"/"Prarasta" filter chips.
- **Checked first:** `inquiry_status` is a real Postgres enum, not a UI-only label set, and `InquirySheet`'s status-change dropdown reads from the exact same `INQUIRY_STATUS` record as the filter chips — so a code-only chip removal would've left both statuses still settable from the dropdown, just unreachable afterward from the filter bar. Queried live data (`select status, count(*) from public.inquiries group by status`): every row was `nauja`, zero used either value. Asked the owner to confirm before touching live schema; approved.
- **Changed:** Migration `20261109150000_drop_inquiry_won_lost.sql` (guarded `do $$ if not exists $$`, idempotent) applied to the live "Vanduo" project — standard Postgres enum-narrowing swap (rename old type, create new 3-value one, cast the column, drop the old type). Narrowed `InquiryStatus` (`lib/admin/types.ts`), `INQUIRY_STATUS` (`lib/admin/labels.ts`), `INQUIRY_TONE` (`status-badge.tsx`), and `setInquiryStatus`'s literal union + `z.enum` (`app/admin/actions.ts`) to match. Regenerated `database.types.ts` (reapplied the `create_inquiry.p_date` nullable hand-edit, per the established convention). Security advisor: no new findings.
- **Also:** `supabase/seed.sql` had two demo inquiries seeded as `laimeta`/`prarasta` — would've broken `supabase db reset` locally once the enum no longer has those values. Changed to `pasiulymas`/`susisiekta`, the closest remaining statuses to the rows' own notes.
- **Status:** `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean. Not yet browser-checked.
- **Next:** Confirm in a browser that `/admin/uzklausos` now shows only Visos/Nauja/Susisiekta/Pasiūlymas and the status dropdown in `InquirySheet` matches.
- **Docs:** `decisions-log.md` (ADR-0047), `changelog.md`, `database.md`, `status.md`, this entry.

## 2026-11-09 — Swept admin for the same flat-title weight gap, now that Medium exists

- **Why:** Two more screenshots (Pirtis Programos, Kainodara Erdvės/Maitinimas) showed the exact same pattern as the Kalendorius tab fix: a bold `CardTitle` ("Programos"/"Erdvės") sitting above a column of plain-regular item rows, with no step in between.
- **Changed:** Every `text-sm font-normal` row-title spot found with a repo-wide grep (~19 files in `components/admin/`) became `font-medium` — `PriceGroupForm`/`SaunaRatesFields` rate labels, `ProgramsCard`/`SaunasCard`/`UpsellsCard`/`SaunaUpsellsField`/`QuadTypesCard`/`CouponProductsCard`/`PlansTab` item names, `Overview`'s row titles/KPI label/section heading, `CustomerPage` activity rows, `RiderDocumentsTab` file names, three fieldset legends and three sheet subsection headers. Left genuinely secondary text (muted prices, dates, counts) untouched — only spots functioning as a row/item's own title moved.
- **Status:** `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean. Not yet re-screenshotted.
- **Next:** Confirm in a browser that these read better now; `ride-plan-picker.tsx`'s muted price span was deliberately left alone (it's meta, not a title) — worth a second look if it still reads flat next to the new weight elsewhere.
- **Docs:** `changelog.md`, `status.md`, this entry.

## 2026-11-09 — Termina Medium/SemiBold: the admin UI was missing two font weights, not broken

- **Found:** From a screenshot of the new Kalendorius tab, the owner said the UI looked flat — "missing medium weight font / semibold". Checked `app/layout.tsx`: `localFont` only registered `Termina-Regular.otf` (400) and `Termina-Bold.otf` (700); `design-system.md` and `globals.css` both documented this as deliberate ("Termina ships Regular + Bold only"). So `font-medium`/`font-semibold` utility classes anywhere in the codebase were just resolving to the nearest of two weights, not a real third/fourth face.
- **Fixed:** Asked the owner whether they had the actual font files; they pointed at `~/Desktop/termina/`, which has the full family (Thin through Black) licensed. Copied `Termina-Medium.otf` and `Termina-Demi.otf` (renamed `Termina-SemiBold.otf`) into `app/fonts/`, added them to `localFont`'s `src` array as weights 500/600. Corrected the now-stale "Regular + Bold only" comments in `design-system.md` and `globals.css` (the `.theme-marse` h1–h6 forced-bold rule stays — that's a brand choice, independent of which weights are loaded). Applied `font-medium` to `StaysStrip`/`QuadsStrip`'s resource labels so the exact cards in the owner's screenshot get a real middle step between the date and the bold count.
- **Status:** `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean. Not yet re-screenshotted.
- **Next:** Confirm in a browser that the new weight actually reads better; consider where else in admin (card titles, table headers, nav labels) a semibold step would help now that it's a real option — not done yet, scoped this pass to what was asked and the one screenshotted spot.
- **Docs:** `changelog.md`, `design-system.md`, `status.md`, this entry.

## 2026-11-09 — Pirtis/Namukai/Keturračiai as expandable sidebar domains (ADR-0046)

- **Why:** Right after ADR-0044's flattening, the owner said the admin still wasn't clear about where a resource's calendar vs. settings vs. customers lived, and sketched a sitemap. Used `/plan` to confirm the approach before building: nested/expandable sidebar (not tabs, not a relabel), keep the single shared Rezervacijos calendar from ADR-0044, Valdymas = each resource's existing settings page.
- **Changed:** `admin-nav.ts`'s `ADMIN_NAV` is now `(AdminNavItem | AdminNavDomain)[]`. Pirtis and Namukai each expand to "Kalendorius" (both → `/admin/rezervacijos?view=kalendorius`) and "Valdymas" (`/admin/pirtis`, `/admin/kainos`); Keturračiai expands to "Nuoma / Žygiai" (`/admin/keturraciai`) and "Valdymas" (`/admin/keturraciai?tab=parkas` — `QuadsView` now reads `?tab=`). New `flattenNav` (mobile flat list), `isActiveHref` (path-only match, since children carry `?view=`/`?tab=` queries `usePathname()` never includes), `activeNavItem` now also returns the containing domain id. `AppSidebar` renders a domain as `Collapsible` + `SidebarMenuSub` (new `components/ui/collapsible.tsx`, hand-added — no network CLI step here). `KlientaiView`'s activity chips sync to `?activity=`; `SaunaView`/`QuadsView`/`PricingView` each got a "Žr. klientus →" link.
- **Coordination:** `admin-nav.ts`, `lib/admin/permissions.ts` and `database.types.ts` were being edited concurrently by ADR-0045's Instruktorius work in the same session — re-read all three fresh before editing; no collision, but ADR number bumped to 0046 since 0045 was already claimed.
- **Status:** `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean. Not yet browser-checked — `localhost:3001` has been returning `HTTP 431` (stale dev cookies) for this entire session; asked the owner to clear site data for `localhost` and retry.
- **Next:** Staff browser pass at 375/768/1024 px (see `status.md` → In progress), then commit.
- **Docs:** `decisions-log.md` (ADR-0046), `changelog.md`, `routing.md`, `components/common.md`, `components/ui.md`, `status.md`, this entry.

## 2026-11-07 — Admin IA flattening: sidebar regroup, Apžvalga pending count, Klientai/Apyrankės merge, Rezervacijos/Užimtumas merge (ADR-0044)

- **Why:** The owner said the admin sidebar and page logic felt hard to navigate, gave a concrete punch list, and asked for it in order of risk.
- **Changed:** `admin-nav.ts` regrouped (Klientai heading, Nuolaidos next to Kuponai, mobile primary tabs Apžvalga/Rezervacijos/Klientai). `useNavCounts`' new `pendingAll` feeds both Apžvalga's "Laukia patvirtinimo" stat and its own nav badge. `KlientaiView` absorbed the old `RidersTab` (plan badge, bracelet assign/rebind); `CustomerPage` is now the one rider profile; `riders-tab.tsx`/`rider-page.tsx` deleted; `/admin/apyrankes?tab=nariai` and `/admin/apyrankes/[id]` redirect to Klientai. `BookingsView` gained a "Kalendorius" tab (`BookingCalendarTab`, the old `AvailabilityView` plus a new `QuadsStrip`); `/admin/uzimtumas` redirects there; `availability-view.tsx` deleted. `lib/admin/guard.ts`'s `requirePermission` now accepts an array of permissions, used on the merged Klientai/Rezervacijos pages so Apyrankės-only/Užimtumas-only roles keep the access they had.
- **Status:** `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean. Not yet browser-checked — `localhost:3001` was returning `HTTP 431` (stale dev cookies) for the whole session; owner asked to clear site data and retry.
- **Next:** Staff browser pass at 375/768/1024 px (see `status.md` → In progress). The owner then sketched a further reorganization (group by activity, each with its own calendar, plus a "Valdymas" section) via `/plan` in the same session — resolve that before treating this grouping as final.
- **Docs:** `decisions-log.md` (ADR-0044), `changelog.md`, `routing.md`, `components/common.md`, `status.md`, this entry.

## 2026-11-07 — Naudotojai: explicit newest-first sort; larger profile photo

- **Changed:** `components/admin/apyrankes/riders-tab.tsx` — `filtered` now `.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))` after the name filter, so Naudotojai always shows the most recently registered rider first, independent of whatever order the underlying `riders` array arrives in (it happens to already be newest-first after the repository fix above, but this makes it a guarantee of the component, not an incidental side effect of a query elsewhere). `components/admin/apyrankes/rider-page.tsx` — the header `RiderAvatar` grew from a 40px circle (`size-10`) to a 90×120px (3:4) rounded-rectangle portrait (`h-[120px] w-[90px] rounded-lg`, plus `text-base` so the initials fallback isn't tiny inside the bigger box); `cn` (tailwind-merge) correctly overrides the component's default `size-9 rounded-full`. A selfie-style `/registracija` photo cropped to a tiny circle was hard to make out next to the plan badge.
- **Status:** `tsc --noEmit`, `eslint` and `next build` clean.
- **Next:** Confirm in a real browser that the Naudotojai list reads newest-first and the enlarged portrait crops sensibly for a few different registration photos.
- **Docs:** `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Admin never showed riders created after a certain point: Supabase's 1000-row response cap

- **Found:** Even after the upload bug above was fixed and a registration (`info@gvozdovic.com`) was confirmed present in the database with its photo uploaded, the owner still couldn't find that rider anywhere in `/admin/apyrankes` → Naudotojai or `/admin/klientai`, even after refreshing.
- **Root cause:** `loadAdminData`'s `riders` query (`lib/admin/repository.ts:97`) was `supabase.from("riders").select("*").order("created_at")` — ascending, no `.limit()`/`.range()`. Supabase's hosted REST API (PostgREST) caps every response at 1000 rows **regardless of table size**, with no error or warning — it just silently truncates. `riders` is 8,957 rows (ADR-0041's Grabby import pushed it well past that threshold back in early November). Confirmed directly against the live API with the service-role key: `order=created_at.asc&limit=3` returns rows from 2022, and a `Prefer: count=exact` request returns `Content-Range: 0-999/8957`. So the admin dashboard has been silently loading only the **oldest** 1000 riders since the Grabby import — every rider created after that point, staff-created or self-registered, was never in the dataset at all. Not a caching, refresh, permission, or search-term problem; the row simply never left the database query.
- **Fixed:** Flipped the query to `.order("created_at", { ascending: false })` (newest-first), so a brand-new rider is always inside the loaded window. One-line code change, no migration needed.
- **Known limitation, flagged not fixed:** This is a stopgap. The admin UI bulk-loads the *entire* `riders` table into the client store on every admin page load (`AdminStoreProvider`/`useAdmin()`), and that doesn't scale past ~1000 rows in either direction — old, never-revisited imported contacts past row 1000 will now silently drop out instead. The real fix is server-side search/pagination (query per keystroke/page) for Klientai and Apyrankės's Naudotojai tab, not one bulk load at page open. Noted as its own follow-up, not attempted here.
- **Status:** `tsc --noEmit` and `eslint` clean on the changed file. Not yet re-verified in the browser that the self-registered rider now actually appears.
- **Next:** Staff browser check — open Apyrankės → Naudotojai or Klientai and confirm the `info@gvozdovic.com` registration (and any other recent rider) is now visible and searchable.
- **Docs:** `decisions-log.md` (ADR-0041 addendum), `changelog.md`, this entry, `status.md`.

## 2026-11-07 — /registracija: the real upload bug was a missing table grant, not just the column collision

- **Found:** After the previous fix, the owner reported the same symptom — asked whether it might be a localhost issue, or a "record already exists" conflict. Checked the live project directly: the three newest self-registered riders (created *after* `20261107171000` was applied) still had `avatar_path` **and** `signature_path` both null, and `storage.objects` had zero rows for any of them — not a duplicate/conflict, a clean rejection on every attempt.
- **Root cause:** Ran the photo-policy's own check as the `anon` role (`set local role anon; select exists (select 1 from public.riders r where r.id = ... )`) and got `ERROR 42501: permission denied for table riders` — a table-privilege error, not an RLS one. `anon` has never had a `SELECT` grant on `riders` or `rider_waivers` at all (by design — "Anon has no grants on any of the three tables" per the original Apyrankės ADR). So *any* subquery against those tables evaluated as `anon` — including inside a Storage policy's `EXISTS` clause — fails outright, regardless of how it's written. This had been silently breaking **both** the photo and the signature upload since the feature shipped; the previous fix's column-collision bug was real but secondary, and happened to be in the one policy (photo) that got attention first.
- **Fixed:** Migration `20261107172000_fix_rider_upload_privileges.sql`, applied directly to the live "Vanduo" project via the Supabase MCP (owner's go-ahead, asked again since this is a distinct write): two new `public` `security definer` functions, `rider_awaiting_photo(uuid)` and `rider_waiver_awaiting_signature(uuid)` — same pattern as the existing `private.has_permission` (owned by the table owner, so they run with its privileges and bypass both the grant and RLS checks). Put in `public`, not `private`, since `anon` has no `USAGE` on the `private` schema either. Both Storage policies now call the matching function instead of querying the table directly. Verified by calling both functions `set local role anon` against a real pending rider and getting `true` for each (previously the direct-query version errored before even reaching a true/false answer).
- **Trade-off accepted:** These two new functions are themselves `anon`-callable RPCs (same WARN category as every other public RPC in this app, confirmed via `get_advisors`) and answer a narrow boolean — "is this specific rider id still waiting for a file" — to anyone who can guess or already knows a UUID. No PII in the response. Same trust level as the rest of ADR-0043.
- **Status:** Regenerated `database.types.ts` (reapplied the `create_inquiry.p_date` hand-edit again). `tsc --noEmit` clean. **Not yet re-exercised end to end through the actual UI** — only verified at the SQL level that the policies now resolve correctly for `anon`.
- **Next:** One more full `/registracija` pass through the real form to confirm a photo and signature actually land in Storage and `avatar_path`/`signature_path` get set.
- **Docs:** `decisions-log.md` (ADR-0043 amended), `database.md` (migration row), `changelog.md`, this entry, `status.md`.

## 2026-11-07 — CameraCapture: guard against a blank or flipped photo

- **Changed:** `components/registration/camera-capture.tsx`. "Padaryti nuotrauką" is now disabled until the `<video>` fires `onLoadedMetadata` (a new `canCapture` state) — capturing the instant `getUserMedia` resolves could draw the frame before the stream actually had one, producing a 0×0 blob that `canvas.toBlob` still resolved "successfully", so the Toliau button would look enabled with an unusable photo behind it. `capture()` now also checks `video.videoWidth`/`videoHeight` defensively and shows an inline error (`captureError`) instead of silently no-op'ing on either that check or a null `toBlob` result. Also mirrors the canvas draw (`ctx.translate` + `ctx.scale(-1, 1)`) to match the CSS-mirrored `<video>` preview — previously the saved photo was flipped left-right relative to what the person saw themselves taking.
- **Status:** `tsc --noEmit`, `eslint` and `next build` clean. Prompted by the owner confirming registration photos should always carry through "Toliau" when taken live, not just when picked from a file.
- **Next:** Re-test taking a live photo (not the file fallback) end to end and confirm it previews un-flipped and uploads.
- **Docs:** `changelog.md`, this entry.

## 2026-11-07 — Fixed /registracija silently failing to upload the photo

- **Found:** The owner registered through `/registracija` and got "Registracija įrašyta, bet nepavyko įkelti failų. Kreipkitės į darbuotoją." after signing — the rider and waiver rows were created fine, but both the photo and (per the error) the uploads looked like they failed.
- **Root cause:** `supabase.storage.from("rider-photos").upload(...)` was being rejected by RLS. The `public rider photo upload` policy's `EXISTS` subquery (`20261107170000_public_rider_registration.sql`) checked `(storage.foldername(name))[1]` without qualifying `name` — and because the subquery's `from public.riders r` brings `riders.name` (the person's first name) into scope, Postgres silently resolved the bare `name` to `r.name` instead of the outer `storage.objects.name` (the uploaded path). `storage.foldername('Rys')` never equals a rider's uuid, so the check always failed and every anon photo upload was rejected — invisibly, since the RPC calls before and after it (`register_rider_public`, `finalize_rider_registration_public`) both succeeded regardless. The sibling `public rider waiver upload` policy was unaffected: `rider_waivers` has no `name` column, so there was nothing for the bare identifier to collide with.
- **Fixed:** Migration `20261107171000_fix_rider_photo_upload_policy.sql`, applied directly to the live "Vanduo" project via the Supabase MCP (owner's go-ahead) — same policy, `storage.foldername(objects.name)` instead of `storage.foldername(name)`. Confirmed via `pg_policies` that the stored `with_check` now references `objects.name`. Security advisor re-checked: no new findings.
- **Known fallout:** Three riders created while this was broken (`Rys Gv`, `Rysard Gv` ×2, all `self_registered = true`) have `avatar_path = null` — their photo upload silently failed before this fix; the signature uploads would have succeeded since that policy was already correct. They need either a re-registration or a staff-side photo upload from their profile.
- **Status:** Migration applied and verified by reading the policy back. **Not yet re-exercised end to end** — the next registration attempt should confirm the photo actually lands in `rider-photos` and `avatar_path` gets set.
- **Next:** One more `/registracija` pass to confirm the fix, then the rest of the original browser-check list (both rule texts, signature pad, badge, Pardavimas loop).
- **Docs:** `database.md` (migration row), `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Public self-registration at /registracija (ADR-0043)

- **Built:** A new public route so a visitor can register themselves before coming to the till. `app/registracija/page.tsx` (public, `BookingPage`/`BookingHeader`/`theme-reservation` shell, same pattern as `/rezervacija`/`/kuponai`) renders `RegistrationFlow` (`components/registration/`), a 3-step wizard: **1. Kontaktai** (`ContactStep`, RHF + `registrationSchema` — name, surname, email, birthdate, phone, optional phone2, plus a `website` honeypot same shape as `components/quads/contact-fields.tsx`); **2. Nuotrauka** (`CameraCapture` — live `getUserMedia` selfie preview, "Padaryti nuotrauką" captures to a canvas, "Fotografuoti iš naujo" retakes, plus an `<input type=file accept=image/*>` fallback for no-camera devices so the required step is never a dead end); **3. Taisyklės ir parašas** (`RulesStep` — both rule documents, `lib/park-rules.ts`, the owner's pasted text verbatim, in a scrollable panel; a consent line naming the person; `SignaturePad`, a plain pointer-events canvas with no library, "Išvalyti parašą"). Submits one `FormData` (fields + two files) to `registerRider` (`app/actions/registration.ts`).
- **Database (ADR-0043, migration `20261107170000_public_rider_registration.sql`, applied live via the Supabase MCP after the owner's go-ahead):** `riders.self_registered boolean default false`; new `rider_waivers` table (`terms_version`, `signature_path`, `signed_at`), read-only to `apyrankes`/`klientai`; new private `rider-waivers` Storage bucket (PNG only); two `security definer` RPCs granted to `anon` only — `register_rider_public` (inserts the rider + waiver row, returns the id) and `finalize_rider_registration_public` (links the two uploaded paths). Two narrowly-scoped anon Storage **insert**-only policies on `rider-photos`/`rider-waivers`: each only matches a path whose rider/waiver row exists, is self-registered, and has no path set yet — so a path becomes unwritable the moment it's filled, no anon select/update/delete anywhere. `registerRider` runs the three steps in sequence: RPC → two Storage uploads (anon client, not SQL — actual bytes can only go through the Storage API) → RPC. This keeps the existing "anon never touches a table or bucket directly, only RPCs" contract (ADR-0010) even though, unlike every prior public form, this one needs to write files.
- **Admin surface:** `/admin/apyrankes` → Naudotojai and `/admin/klientai` show an "Internetu" `Badge` next to a self-registered rider's name. The shared `RiderProfileTab` (`components/admin/rider-profile-tabs.tsx`) gained a `WaiverStatus` line — "Taisyklės pasirašytos {date}" with a "Peržiūrėti parašą" link resolving a signed URL — so staff can confirm a waiver exists before handing over a bracelet. `getRiderFileUrl`'s bucket union gained `"rider-waivers"`; `AdminData`/`useAdmin()` gained `riderWaivers`, loaded and mapped the same way `purchases`/`rider_documents` already are.
- **Types regenerated:** `database.types.ts` was regenerated from the live project; the project's documented `create_inquiry.p_date` hand-edit (nullable, the generator reports it as non-null — see ADR-0042) was reapplied, same as every prior regeneration. Security advisor showed only the expected new anon-RPC WARN entries (same category as every existing public booking/coupon RPC) plus the pre-existing unrelated findings.
- **Status:** `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean. **Not browser-checked** — this session has no camera/`getUserMedia` access to exercise the capture step, and the Chrome browser tool here cannot reach `localhost` (same limitation noted elsewhere in this file).
- **Next:** A real phone/desktop pass: allow camera, capture, retake, continue; try the no-camera file-picker fallback; scroll both rule texts; sign; submit; confirm the "Ačiū" screen; confirm the rider shows up in Apyrankės/Klientai with the badge; then run Pardavimas → "Esamas naudotojas" end to end (search, pick a plan, scan a bracelet) to prove the loop the owner asked for closes. Also worth flagging to the owner out loud: there's no OTP/phone verification on this form (by their own choice, matching the other public forms' trust level), so anyone with the URL can currently create a rider row.
- **Docs:** `decisions-log.md` (ADR-0043), `routing.md`, `database.md`, `api-architecture.md`, `components/common.md`, `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Pardavimas: nameless guest in one click, scan-to-find a rider

- **Changed:** `components/admin/apyrankes/sales-tab.tsx` — the "Naujas svečias" tab in the per-item "Priskirti klientui" dialog no longer has name/surname fields; it's one "Priskirti kaip naują svečią" button calling a new `guestIdentity()` helper (`{ name: "Svečias", surname: <4-char random tag> }`) since `riders.name`/`surname` are `not null check (char_length(...) between 1 and 60)` in the DB — a real guest creation without storing something isn't possible without a migration, so this is the smallest UI change that still reads as "just select, no typing"; staff add a real name later from the rider's profile if they want to. `components/admin/apyrankes/rider-select.tsx` — added a scan toggle button next to the search input: tapping it arms `useCardScanner`; scanning a bracelet looks it up in `riderCards` and, if bound, calls `onChange` with that rider directly (closing the popover), or shows an inline "Apyrankė {number} nepriskirta jokiam naudotojui" message if the card has no owner. Lets staff find a returning customer by scanning their old bracelet instead of typing a name, satisfying the "scan to search" request for the same control the per-item cart already uses for "Esamas naudotojas".
- **Status:** `tsc --noEmit` and `eslint` (touched files) clean. Not browser-checked (same `localhost` limitation as the rest of today's work).
- **Next:** Staff browser pass — scan a known bracelet in the rider picker and confirm it selects the right person; scan an unknown one and confirm the inline error; create two nameless guests back to back and confirm their tags differ; check 375/768/1024 px.
- **Docs:** `components/common.md` (`ApyrankesView` row updated, new `RiderSelect` row), `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Pardavimas: per-item cart (each card its own customer)

- **Changed:** Third pass at `components/admin/apyrankes/sales-tab.tsx` today. `components/admin/apyrankes/ride-plan-picker.tsx` changed from a toggleable multi-select (`value: string[]`) to an add-only cart: clicking a plan card calls `onAdd(planId)` and always appends a new line (a small `counts[planId]` badge shows how many are already in the cart), so the same plan can be sold to two different people in one session instead of collapsing into one shared selection. `SalesTab` now holds `cart: CartItem[]` (`id`, `planId`, `status: "pending" | "sold"`, `rider`, `cardNumber`); each pending line shows a "Priskirti klientui" button opening a `Dialog` scoped to that one line with three phases: **pick** (recipient toggle — `RiderSelect`, where choosing a rider immediately calls `updateRiderPlan` for just that line and advances to scan; or a guest name/surname form that calls `createRider` and advances the same way), **scan** (`ScanTarget` → `bindRiderCard`, or "Praleisti apyrankė" to skip), **done** (confirmation card, closes back to the cart list). A sold line shows a checkmark, the customer's name, and the card number or "be apyrankės"; a pending line can still be removed, a sold one can't (the purchase is already logged).
- **Status:** `tsc --noEmit` and `eslint` (touched files) clean. Not browser-checked (this session's Chrome browser tool can't reach `localhost`, same limitation noted elsewhere today). Builds on the multi-plan-picker rework from earlier in this session (see the entry just below), which this replaces.
- **Next:** Staff browser pass — add the same plan twice for two different customers, assign an existing rider (confirm the immediate sell + auto-opened scan step), create and assign a guest, scan a real bracelet, skip a scan, verify each cart line shows the right customer afterward — at 375/768/1024 px, then commit together with the rest of today's uncommitted admin work.
- **Docs:** `components/common.md` (new `ApyrankesView` row), `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Pardavimas: multi-plan sale with an in-popup scan step (superseded same session)

- **Changed:** First rework of `sales-tab.tsx` today, before the per-item cart above: `RidePlanPicker` became multi-select (`value: string[]`, click toggles a plan in/out), the sidebar showed selected plans as removable chips with a running total, and selecting an existing rider opened a `Dialog` to scan and bind their bracelet in one step (replacing the old full-page "bind" screen reached only after an explicit "Priskirti planą" click). Per two follow-up requests from the owner in this same conversation.
- **Status:** Shipped, then immediately superseded in this same session once the owner asked for each plan card to carry its own customer rather than one recipient for the whole sale — see the entry above for what's actually on disk now. Kept here only as a record of the intermediate step.
- **Docs:** `changelog.md`, this entry.

## 2026-11-07 — Admin UI polish: full-width AdminPage, Apžvalga apyrankės KPIs, Klientai filters, searchable RiderSelect

- **Changed:** `components/admin/admin-page.tsx` — removed `mx-auto max-w-7xl`; every `/admin/*` screen now fills the available width. `components/admin/overview/overview.tsx` — added a second KPI row (bracelets bound, active abonementai, total riders, today's bracelet-plan sales), reading `riders`/`riderCards`/`ridePlans`/`purchases` already in `useAdmin()`. `components/admin/klientai/klientai-view.tsx` — added Apyrankės/Namukai/Keturračiai chip filters (multi-select, OR'd) above the search bar, matching riders with a `purchases` row, a `namelis`-kind booking, or a quad rental. `components/admin/apyrankes/rider-select.tsx` — rebuilt as a `Popover` + text-input combobox (filter by name/phone, 50-result cap) replacing the old unfiltered `Select` (now rendering ~8,940 `riders`). `components/admin/apyrankes/sales-tab.tsx` was restyled into a two-column layout (plan picker left, sticky "Priskirti" card right) as part of this batch.
- **Status:** All of the above `tsc --noEmit`/eslint clean individually. **Not browser-checked** — the Chrome browser tool couldn't reach `localhost` from this session (navigate succeeds, `screenshot`/`read_page` error "Frame with ID 0 is showing error page"); only curl-confirmed `/admin/klientai` 307-redirects to `/admin/prisijungti` signed out. Note: after this session's `sales-tab.tsx` restyle, the file was independently reworked by someone/something else (mid-session, outside this session's edits) into a multi-plan-per-sale flow with a scan dialog — worth a review pass before committing, since it wasn't authored or checked here. **Resolved:** that was the other concurrent session (this repo had two running at once today), acting on two of the owner's own follow-up requests there; see its "Pardavimas: per-item cart" entry above for what it did and why — no separate review needed, just the usual pre-commit browser pass.
- **Next:** Staff sign-in and a full browser pass at 375/768/1024 px for all four items; review the `sales-tab.tsx` multi-plan rework; then commit.
- **Docs:** `changelog.md`, `routing.md` (Klientai row), this entry, `status.md`.

## 2026-11-07 — Užimtumas: swapped cabin/camper and calendar section order

- **Changed:** `components/admin/availability/availability-view.tsx` — moved the "Nameliai ir kemperiai" `Card` (cabin/camper occupancy `StaysStrip`) above the sauna week/day calendar `Card` (`SaunaGrid`), per the owner's screenshot showing the current (reversed) order.
- **Status:** Pure JSX reorder, no logic change; not yet browser-checked.
- **Next:** Verify at 375/768/1024 px.
- **Docs:** `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Collapsed sidebar: icons centered

- **Changed:** `components/ui/sidebar.tsx` — `sidebarMenuButtonVariants` base class gained `group-data-[collapsible=icon]:justify-center`. Follow-up to the label-leak fix below: once labels were hidden, the icons showed flush left in the collapsed rail (from the owner's screenshot) because the `lg` size variant zeroes padding in icon-collapsed mode (`group-data-[collapsible=icon]:p-0!`), removing the equal padding that happened to center the icon for other sizes, with nothing else to center it horizontally.
- **Status:** Pure CSS-class fix, applies to every `SidebarMenuButton` size, not just `lg`. `tsc --noEmit` and `eslint` clean. Not yet browser-checked.
- **Next:** Verify collapsed-sidebar icons are centered at desktop widths, alongside the label-leak check above.
- **Docs:** `components/ui.md`, `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Collapsed sidebar: fixed leaking label text

- **Changed:** `components/admin/app-sidebar.tsx` — added `group-data-[collapsible=icon]:hidden` to the nav-item `<span>{item.label}</span>` and the footer "Į svetainę" `<span>`. shadcn's `SidebarMenuButton` forces the button to a fixed icon-sized square when the sidebar is collapsed but does not hide the label itself (by design — the consumer adds the class); the header logo text and staff-footer name already did this, these two spans just didn't, so a truncated first letter of each label was visible next to its icon (from the owner's screenshot).
- **Status:** Pure CSS-class fix. `tsc --noEmit` and `eslint` clean. Not yet browser-checked.
- **Next:** Verify the collapsed sidebar shows icons only (no stray letters), tooltips still appear on hover, at desktop widths (sidebar is `lg`+ only).
- **Docs:** `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Užimtumas: click-to-create booking, right-click menu, bulk cell select

- **Changed:** `components/admin/availability/sauna-grid.tsx` — a free cell on the sauna calendar now opens `NewBookingDialog` on click (prefilled with that sauna, date and start hour), not toggle-closed as before. Right-click (new `components/ui/context-menu.tsx`, a Radix `ContextMenu` primitive matching the existing `DropdownMenu`'s shape) opens a menu: "Nauja rezervacija čia", "Pažymėti langelį" (select), and close/reopen; a booked cell's menu has "Redaguoti rezervaciją". Once any cell is selected, plain clicks on free cells toggle selection instead of opening the dialog, a small toolbar appears above the grid, and both the toolbar and the context menu offer bulk close ("Padaryti neprieinamus") / bulk reopen — implemented as a loop calling the existing single-cell `admin.toggleBlock` per selected cell (no new bulk server action or migration). `components/admin/bookings/new-booking-dialog.tsx` gained an optional `initial?: { saunaId, date, startHour }` prop consumed only by `AvailabilityView`; its other two call sites (admin header "+", bookings list "Nauja rezervacija") pass nothing and keep today's date / first active sauna / empty slot as before.
- **Status:** `tsc --noEmit` and `eslint` (touched files) clean. **Not verified in a real browser**: the Chrome browser tool in this session can reach `navigate` but `screenshot`/`read_page` fail with "Frame with ID 0 is showing error page" against `localhost` — tried both the stray `:3000` server (turned out to be the old `pass-scanner` prototype, not this repo) and this repo's own dev server (already running on `:3001`, started by someone else). Only curl-confirmed `/admin/uzimtumas` compiles and 307-redirects to `/admin/prisijungti` signed out, same as every other admin route. Everything uncommitted.
- **Next:** Staff sign-in and a full click-through at 375/768/1024 px: create a booking from a free cell with the right sauna/date/hour prefilled and submit it successfully; right-click menu on a free cell and on a booked one; select several cells and bulk close, then bulk reopen; confirm the selection toolbar and context-menu bulk actions clear selection afterward.
- **Docs:** `components/ui.md` (new `ContextMenu` row), `components/common.md` (`SaunaGrid` row rewritten), `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Tabs: auto height on the shared TabsList

- **Changed:** `components/ui/tabs.tsx` — horizontal `TabsList` now uses `h-auto` instead of the fixed `h-11`; `bg-muted` moved from the `default` variant to the base class so it's applied on every variant. This is the shadcn primitive shared by every `Tabs` usage in the app (admin and public).
- **Status:** No typecheck/lint issues expected (pure Tailwind class change), not yet run or browser-checked.
- **Next:** Verify in the browser at 375/768/1024 px across a few `Tabs` usages (admin sidebar tabs, apyrankes category tabs with many items). The apyrankes `overflow-y-hidden` fix (2026-11-07, below) was a workaround for the old fixed height and is now likely unnecessary — drop it next time those files are touched.
- **Docs:** `components/ui.md`, `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Klientai planned (full Grabby-parity roadmap), migration written but blocked on apply

- **Changed:** Checked `app.begrabby.com/dashboard` (the owner's other wake-park admin system) via the aside-browser skill and compared it against `/admin`, confirming the gaps ADR-0040's sitemap already named: a standalone Klientai, Operatorius, Priežiūra, Analitika, and Kasa (POS). Agreed a 6-phase roadmap starting with Klientai (plan saved at `~/.claude/plans/purring-greeting-nygaard.md`). Mid-plan, found an uncommitted, undocumented migration already applied live (`20261107150000_rider_grabby_import`, now documented as ADR-0041) that made `riders.plan_id` nullable and bulk-imported ~8,940 Grabby contacts — 140 of 141 `riders` rows are now plain customer contacts with no plan. That reversed the original plan (a new `customers` table) to reusing `riders` as the identity anchor instead (ADR-0042). Wrote `supabase/migrations/20261107160000_klientai.sql`: additive `klientai`-permission RLS on `riders`/`rider_comments`/`rider_documents`/`purchases` + its two storage buckets, a nullable `rider_id` on `bookings`/`quad_rentals`/`event_tickets`/`coupons` with read-only `klientai` policies, and a backfill linking the ~12 existing rows in those four tables to a rider (matching by `private.norm_phone` or email, creating one where neither matches).
- **Status:** Migration file written, verified against live schema/row-counts via read-only `execute_sql` queries first; first `apply_migration` attempt was blocked by Claude Code's auto-mode production-deploy classifier, so I explained and asked — the owner said go ahead. One retry hit a `riders_surname_check` violation (single-word names splitting to an empty surname), fixed with a `'-'` fallback, rolled back cleanly, then applied successfully. Security advisor showed no new findings; `lib/supabase/database.types.ts` regenerated (the known `create_inquiry.p_date` nullable hand-edit reapplied) and `tsc --noEmit` is clean. All 12 pre-existing rows across the four tables backfilled; `riders` separately jumped to 8,945 while this ran, from the real Grabby CSV import (ADR-0041) finishing concurrently and independently — confirmed unrelated by checking `grabby_id` coverage before concluding it wasn't a bug in this migration. Then built the full app layer: `klientai` permission; `riderId` on `Booking`/`QuadRental`/`TourTicket`/`Coupon` (types + mappers); nine rider actions in `app/admin/actions.ts` relaxed to accept `apyrankes` or `klientai`; standalone nav item; extracted `RiderProfileTab`/`RiderDocumentsTab`/`RiderCommentsTab` out of `RiderPage` into a shared `components/admin/rider-profile-tabs.tsx`; new `/admin/klientai` (`KlientaiView`, paginated 25/page — `riders` is 8,945 rows now, so an unpaginated list would've been a real problem) and `/admin/klientai/[id]` (`CustomerPage`: Profilis, a new Veikla activity timeline, Dokumentai, Komentarai). `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean; verified both new routes compile and redirect correctly via curl against the owner's already-running dev server (no credentials available to check in a real browser this session).
- **Next:** Staff sign-in and a full browser click-through of Klientai (search, open a profile, edit contact info, Veikla, documents, comments, delete) at 375/768/1024 px, then commit. After that: Analitika, Priežiūra, Operatorius, Kasa (POS), Nuoma equipment inventory, per the roadmap in the plan file.
- **Docs:** `decisions-log.md` (ADR-0042), `database.md` (migration row, schema annotations, permission table), `changelog.md`, this entry, `status.md`.

## 2026-11-07 — Committed Apyrankės, opened PR #14, tabs vertical-scroll fix

- **Changed:** Committed the full Apyrankės session (branch `feat/apyrankes-bracelet-passes`, left `package-lock.json` out — stray npm artifact, project uses pnpm), pushed, opened [PR #14](https://github.com/dzekuza/vanduomarse-redesign/pull/14). Then added `overflow-y-hidden` to the three horizontally-scrolling `TabsList`s (rider page, plan catalogue, plan picker) so the fixed-height pill (`h-11` from shadcn's Tabs) never shows a vertical scrollbar alongside the intentional horizontal one.
- **Status:** `tsc` and full-repo `eslint` clean. The overflow fix is made after the PR's last push and is **not yet committed**.
- **Next:** staff sign-in and a full click-through of PR #14, then commit and push the overflow fix (or fold it into the same PR before merge).
- **Docs:** `changelog.md`, this status/session-log update.

## 2026-11-07 — Apyrankės (bracelet pass scanning), ported from pass-scanner and expanded

- **Changed:** Ported the user's separate `pass-scanner` prototype (localStorage) into a real Supabase-backed feature: new `/admin/apyrankes` staff screen behind a new `apyrankes` page permission (ADR-0038). Scanning uses a ported, layout-robust USB keyboard-wedge reader (`lib/card-scanner.ts` + `hooks/use-card-scanner.ts`). New tables `ride_plans`, `riders`, `rider_cards` (migration `20261107120000_bracelet_passes`). Then expanded riders into full customer records (phone, second phone, birthdate, email, avatar) with a detail page covering sales history, active services, subscriptions, documents and comments: new `purchases` (snapshotted sales log), `rider_comments`, `rider_documents` tables and two private Storage buckets `rider-photos`/`rider-documents` served via 1-hour signed URLs (migration `20261107140000_rider_profiles`, ADR-0039). `ride_plans` gained a `category` column and was reseeded with the owner's real 13-item "Plaukimas" price list, replacing four placeholders. UI iterated per the owner's feedback: the rider side drawer became a full page `/admin/apyrankes/[id]` (`RiderPage`, matching `/admin/pirtis/[id]`); the plan dropdown in Pardavimas became a 4-column grid of plan cards under category tabs (`RidePlanPicker`); fixed an overlapping-tabs bug (shadcn `TabsList` has a fixed single-row height, so `flex-wrap` on 6-7 tabs overflowed onto content below — switched to horizontal scroll). Admin sidebar regrouped per the owner's dashboard-merge sitemap: Apžvalga ungrouped, new "Pardavimai" section holds Rezervacijos/Užimtumas/Keturračiai/Kuponai/Apyrankės/Užklausos (ADR-0040; `AdminNavGroup` gained `"apzvalga"`, `ADMIN_NAV_GROUPS` entries can have `label: null`). Also added `127.210.108.239` to `next.config.ts` `allowedDevOrigins` (cross-origin HMR fix).
- **Status:** Both migrations applied directly to the live "Vanduo" project via the Supabase MCP (`apply_migration`); security advisor showed no new findings each time; generated types matched the hand-written `lib/supabase/database.types.ts` edits exactly both times. `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean after every change in this session. **Not checked in a real browser session** — no staff credentials available here; only verified via curl that `/admin/apyrankes` and `/admin/apyrankes/[id]` compile and 307-redirect to `/admin/prisijungti` when signed out. Everything is uncommitted.
- **Next:** staff sign-in and a full click-through (scan a real bracelet, sell a plan to a guest and an existing rider, rebind, upload a rider photo and a document, add/delete a comment, delete a rider) at 375/768/1024 px, then commit. Fill in pricing for the other till categories (Įranga, Abonementai, Pramogos, Apgyvendinimas, Parduotuvė, Dubenėlyje) from Planai once the owner has it. Consider whether "active"/"abonementai" need real expiry/visit-count tracking later (ADR-0039 flags this as a known simplification).
- **Docs:** `database.md` (schema rows, migrations list, permission table), `api-architecture.md` (new actions), `routing.md` (new route, sidebar grouping), `hooks.md` (`useCardScanner`), `utils.md` (`RIDE_PLAN_CATEGORIES`, new mappers, `CardScanner`, `formatPlanPrice`), `changelog.md` (one line per change), `decisions-log.md` (ADR-0038, ADR-0039, ADR-0040), this status and session-log entry.

## 2026-11-05 — Favicon from the badge
- **Changed:** `app/favicon.ico` (RGBA 16/32/48), `app/icon.png` (512), `app/apple-icon.png` (180) cropped from the owner's badge PNG. `76c2c78` pushed earlier; the gate is live on production.
- **Status:** icons linked and served on the dev server (also while gated); local `pnpm build` fails on a pre-existing Google font resolve error, same on HEAD without the icons. Uncommitted.
- **Next:** commit and push the icons; check the tab icon on production.

## 2026-11-05 — /apie-marsa removed, coming-soon gate
- **Changed:** deleted `app/apie-marsa` + `components/about/`; nav and sitemap entries gone. New `lib/site-gate.ts`, `lib/site-gate-schema.ts`, `app/actions/site-gate.ts`, `components/coming-soon.tsx`, `components/gate-code-form.tsx`, `app/netrukus/page.tsx`; proxy matcher widened; `.env.example` (`SITE_GATE`, `SITE_GATE_CODE`); `dev-gate` launch config (dummy local code). ADR-0037.
- **Status:** `tsc` and eslint clean; gate, bypass code and gate-off behaviour checked in the browser; uncommitted.
- **Next:** owner sets `SITE_GATE=1` + `SITE_GATE_CODE` in Vercel, commit, redeploy; then Supabase Auth URLs.
- **Docs:** routing (`/netrukus` row, `/apie-marsa` row removed), `components/common.md` (`ComingSoon`, `GateCodeForm`; `TeamSection` removed), `utils.md` (site-gate helpers), `seo-metadata.md`, ADR-0037, changelog, status "Next up".

## 2026-11-05 — Domain env + webhook confirmed
- **Changed:** owner set `SITE_URL` to the www host and moved the Stripe webhook; confirmed via the Stripe API (one app endpoint on `www.vanduomarse.lt`, five events, enabled) and `.env.local`.
- **Status:** robots/sitemap/metadataBase still uncommitted; Vercel env not checked from here.
- **Next:** Supabase Auth URLs, deploy, Search Console sitemap.

## 2026-11-05 — Custom domain check
- **Changed:** checked `vanduomarse.lt` (apex → 308 → `www.vanduomarse.lt`, Vercel); added `lib/site.ts`, `metadataBase`, `app/robots.ts`, `app/sitemap.ts`; `.env.example` SITE_URL note.
- **Status:** `tsc` and eslint clean; robots and sitemap render locally; uncommitted.
- **Next:** SITE_URL to the www host in Vercel and `.env.local`, Stripe webhook on the www host, Supabase Auth URLs, Search Console sitemap.

## 2026-11-05 — PR #13 merged
- **Changed:** PR #13 (discount codes) merged into `main`; Vercel preview build had passed, no open review threads.
- **Status:** migrations already applied; production redeploys from `main`.
- **Next:** staff sign-in to check `/admin/nuolaidos`; one checkout with a code.

## 2026-11-05 — PR #13 review fixes
- **Changed:** per-activity discount code in both checkout paths, submit blocked while a code check runs, 0 € plans filed unpaid, delete refused for used codes, non-optimistic admin toggle/delete, integer-cent preview, schema limits shared with the form, FK relationships in the types, a11y fixes; docs wording.
- **Status:** `tsc` and eslint clean; replies posted on the review threads.
- **Next:** staff sign-in to check `/admin/nuolaidos` and an applied code.

## 2026-11-05 — Discount code migrations applied
- **Changed:** applied `20261104190000`, `20261104191000` and `20261105150000_discount_codes` to `mwngljhcvqkvncwbmgeo` (owner approved); grants and advisors checked; security review findings recorded in ADR-0036.
- **Status:** live code check works at the checkout; admin screen not yet checked (needs staff sign-in).
- **Next:** test code in `/admin/nuolaidos`, applied-code summary, 375 / 768 / 1024 px, delete the test code.

## 2026-11-05 — Discount codes
- **Changed:** migration `20261105150000_discount_codes` (table, `nuolaidos` permission, RLS, `check_discount_code`, `discount_code_usage`, booking RPCs with `p_discount_code`); `lib/discount-codes.ts`, `lib/discount-code-schema.ts`, `app/actions/discount-codes.ts`, `app/admin/discount-actions.ts`; checkout `DiscountCodeField` + discount in `PlanSummary`; `/admin/nuolaidos` (`components/admin/discounts/`); types merged by hand. ADR-0036.
- **Status:** PR #13 open (commit 4bc0776). Migration tested in a rolled-back transaction on `mwngljhcvqkvncwbmgeo`, not applied; approval asked. Checkout field checked at 375 px (error path); `/admin/nuolaidos` needs a staff sign-in in the browser pane.
- **Next:** apply `20261104190000`, `20261104191000`, then `20261105150000`; check the applied code, the summary and `/admin/nuolaidos` at 375 / 768 / 1024 px; one checkout with a code.

## 2026-11-05 — Twilio sender name check
- **Checked:** Twilio account, Messaging Services and senders, last messages (read-only API); `.env.local` and Vercel Twilio vars; production deploy after the change.
- **Status:** setup correct; last real attempt failed 21212 (From set to the `AI…` sender SID). No SMS sent by me.
- **Next:** confirm Supabase phone provider uses `MGd815…`; one test SMS and one sign-in code to a real number.

## 2026-11-05 — PR #12 merged
- **Changed:** PR #12 (email notifications, confirmed-email lookup, marketing copy, review fixes) merged into `main` as 9699683; Vercel preview build had passed.
- **Status:** migration `20261105120000` already applied; production redeploys from `main`.
- **Next:** check the production deploy picked up the Stripe and email env vars; one test booking and checkout.

## 2026-11-05 — Marketing copy of booking emails
- **Changed:** `STAFF_BOOKING_COPY` (marketingas@vanduomarse.lt) in `lib/contacts.ts`, added once to every new-request and paid staff email in `lib/email/notify.ts` (not double-charge). Needed because `STAFF_NOTIFY_EMAIL` is only the fallback for services without an inbox.
- **Status:** `tsc`/eslint clean; not sent for real.
- **Next:** redeploy production; one test booking.

## 2026-11-05 — Stripe configured
- **Checked:** Vercel now has `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`; status note rewritten so no paragraph still asks to register the webhook (it is registered).
- **Next:** redeploy production; checkout test (live charge + refund, or sandbox).

## 2026-11-05 — Stripe recheck
- **Checked:** `.env.local` key (clean `sk_live_`, API 200), webhook secret format, Vercel env names.
- **Status:** local config OK; Vercel has `STRIPE_SECRET_KEY` only (no `STRIPE_WEBHOOK_SECRET`, `SITE_URL`). No checkout run.
- **Next:** add the two Vercel vars (webhook secret from the vercel.app endpoint in Stripe) and redeploy; decide sandbox vs live test.

## 2026-11-05 — Stripe configuration check
- **Checked:** `.env.local` Stripe vars (names/prefixes only), a read-only Stripe API call, webhook endpoints, Vercel env names.
- **Status:** key value malformed (`secret - ` prefix) and live mode; Vercel lacks all Stripe vars; webhook endpoint registered with the right five events. No checkout run.
- **Next:** fix the key line (sandbox key recommended for testing), add Stripe vars + `SITE_URL` in Vercel and redeploy, then run a checkout.

## 2026-11-05 — PR #12 second review
- **Changed:** `accountEmailFor` logs lookup failures; `notify` comments in requests/quads say email goes only to an account-confirmed address; vault: migration consistently named as required (ADR, changelog, status), webhook RPC named correctly, database row narrowed, frontmatter dates bumped.
- **Status:** `tsc`/eslint clean; pushed to PR #12.
- **Next:** signed-in test bookings with `EMAIL_IN_DEV=1`; env vars in Vercel.

## 2026-11-05 — Confirmed-email lookup for notifications
- **Changed:** migration `20261105120000_notify_account_email` (`account_notify_email`, `payment_notify_email`, service role only); webhook and admin outcome email only that address; types hand-added; `lib/supabase/admin.ts` doc.
- **Status:** `tsc`/eslint clean; migration applied to `mwngljhcvqkvncwbmgeo` via MCP (ref checked against `.env.local`, ledger aligned, grants and null-for-unconfirmed verified); pushed to PR #12. Regenerated types not adopted (unrelated drift: `graphql_public`, `create_inquiry.p_date`).
- **Next:** test bookings through `/rezervacija` signed in, with `EMAIL_IN_DEV=1`; look at the `create_inquiry.p_date` type drift.

## 2026-11-05 — PR #12 review fixes
- **Changed:** `Requester.notifyEmail` (account email only) for customer emails; admin outcome emails need a `user_id`; webhook used `payment_state` (later replaced by `payment_notify_email`, next entry up); 8 s fetch timeouts (Resend, Twilio); dev email skip returns false; `formatEuro` in emails; no relative `/admin` link; vault notes corrected (audiences, signatures, routing).
- **Status:** `tsc` and eslint clean; pushed to PR #12.
- **Next:** one sauna and one stay booking through `/rezervacija` (signed in) with `EMAIL_IN_DEV=1`; env vars in Vercel.

## 2026-11-05 — Security review: inquiry email
- **Changed:** `createInquiry` passes no customer email or phone to `notify` (the phone part was a pre-existing SMS-abuse path) (unverified form; would let anyone mail arbitrary addresses from our domain).
- **Status:** committed on `feat/email-notifications` with the email work, new PR into `main` (PR #10 was already merged); `tsc` clean.
- **Next:** test one sauna and one stay booking with `EMAIL_IN_DEV=1`; add the email env vars in Vercel.

## 2026-11-05 — Staff email per service
- **Changed:** `STAFF_INBOX` + `serviceOfReference` in `lib/contacts.ts`; `notifyRequestFiled` takes a service; staff paid/duplicate emails routed by reference prefix.
- **Status:** `tsc` and eslint clean; Resend keys added to `.env.local`, one direct test email accepted by Resend (HTTP 200). Booking emails through the app not tried yet.
- **Next:** set `RESEND_API_KEY` + `NOTIFY_FROM_EMAIL`, test one sauna and one stay booking with `EMAIL_IN_DEV=1`.

## 2026-11-05 — Email notifications (Resend)
- **Changed:** `lib/email/resend.ts` (shared sender, dev skip), `lib/email/notify.ts` (customer + staff email texts), `lib/notify.ts` (SMS + email per event); request, quad and admin status actions and the Stripe webhook call it (webhook reads `payments.customer_email` by `payment_id`); coupon email reuses the sender; `.env.example`, env note, utils catalog, api-architecture and ADR-0028 updated.
- **Status:** `tsc` clean, eslint clean on changed files. Not sent for real: no booking filed in the browser (it would write to the live project), dev logs emails instead of sending.
- **Next:** add `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `STAFF_NOTIFY_EMAIL`, `SITE_URL` (local + Vercel), verify the sender domain in Resend, then one test booking with `EMAIL_IN_DEV=1`.

## 2026-11-04 — PR #10 and payment hardening
- **Changed:** branch `feat/accounts-and-payments`, two commits and PR #10. After a security review: `checkoutUrl` only replaces a session Stripe reports expired (lookup errors fail instead of opening a second session), conditional `attach_payment_session` (loser's session is expired), webhook passes `p_payment_id` from metadata, `duplicate` payments are texted to staff; migration `20261104180000_payment_session_guards`.
- **Status:** migration tested in a rolled-back transaction (stale attach refused, old session paid is found by id, repeat event not a duplicate, double charge flagged); `tsc`/eslint clean. Applied afterwards through the Supabase MCP on your instruction: ledger repaired, signatures and privileges verified live, regenerated types identical.
- **Next:** restart dev with the Stripe keys, register the webhook, Stripe sandbox end-to-end test.

## 2026-11-04 — Mano rezervacijos rename and code-step buttons
- **Changed:** `/paskyra` is titled and linked "Mano rezervacijos" (nav label, metadata, H1, reservations left and account right); code-step buttons restructured (confirm on its own row, secondary buttons wrap, `h-auto whitespace-normal`).
- **Status:** `tsc`/eslint clean; signed-in page checked at 1024 px (shows PM-1068 and the profile); header nav wraps three labels at 1024 px (fits at 1280); button fix not yet seen live.
- **Next:** restart the dev server for Stripe, cancel the PM-1068 test booking, verify the code-step buttons next time a code is sent.

## 2026-11-04 — Account page /paskyra and sign-in tests
- **Changed:** `/paskyra` (`app/paskyra/page.tsx`, `components/account/*`, `lib/account*.ts`), `LoginForm` extracted from `AccountStep`, nav link, proxy matcher, migration `20261104170000_customer_own_requests` (applied via MCP, ledger repaired); added keys to the login views (fixes the uncontrolled-input warning on sign-out).
- **Status:** new-account sign-in through checkout worked (Supabase `user_signedup`, one account for the phone, not staff); returning sign-in failed only because no code reached the phone (test-OTP override inactive, Twilio `30003`); policies tested in a rolled-back transaction; `tsc`/eslint clean; signed-out `/paskyra` checked at 1280 px; signed-in view not seen.
- **Next:** make the test-OTP override take effect (check it is saved, format `37067312315=000000`), then sign in and check `/paskyra` and the checkout review/pay step; fix delivery (upgrade Twilio, alphanumeric or EU sender).

## 2026-11-04 — Applied the account and payment migrations
- **Changed:** security review fix: `private.account_owns_contact` now needs every contact on the row (phone and email) to be the account's own. Applied `20261104150000_customer_accounts` and `20261104160000_stripe_payments` to project `mwngljhcvqkvncwbmgeo` through the Supabase MCP (verified the project ref first), repaired the migration ledger to the local file versions, regenerated `lib/supabase/database.types.ts` (kept `create_inquiry.p_date` nullable).
- **Status:** objects verified live (payments table, 11 functions, `user_id`/`payment_id` columns, cron job, anon cannot call `start_payment`); `supabase db push --dry-run` says up to date; `tsc`/eslint clean.
- **Next:** Supabase Auth setup (phone provider, email code template, custom SMTP), register the Stripe webhook, then test a real code and a real payment end to end.

## 2026-11-04 — Account login at checkout instead of the phone gate
- **Changed:** ADR-0027. Removed `ReservationGate`; new `AccountStep` (phone or email one-time code via Supabase Auth, new account or sign-in), `app/actions/customer.ts`, `lib/customer.ts`, `lib/request-identity.ts` (`viaAccount` for the six booking actions); migration `20261104150000_customer_accounts` (`user_id`, trigger accepts the caller's confirmed phone or email); payments now matched by account; `proxy.ts` refreshes the session on `/rezervacija`.
- **Status:** database rules verified in a rolled-back transaction (own phone/email allowed, foreign phone, unconfirmed account and anon blocked; payment lifecycle by account); `tsc`/eslint clean; browser: no gate, account step renders, unsupported prefix rejected. No real code sent yet (needs your phone/email and the Supabase dashboard settings); migrations not applied.
- **Next:** apply both migrations in order, set up Supabase Auth (phone provider, email code template, custom SMTP), regenerate types, test real codes end to end.

## 2026-11-04 — Stripe payments on /rezervacija
- **Changed:** pay-at-submit (full total, hosted Checkout) per ADR-0026: migration `20261104160000_stripe_payments` (payments table, `payment_id` links, service-role payment functions, cron, paid requests exempt from the 48 h expiry and the pending cap); server action `startReservationCheckout` + `resumeCheckout`; webhook route; return page `/rezervacija/mokejimas`; `awaitingPayment` flag holds back request SMS; admin Payment badge and refund note; review step copy and "Mokėti N €" button; vault notes, `.env.example`.
- **Status:** `tsc` and eslint clean; migration logic verified in a rolled-back transaction (all cases pass); migration NOT applied (production push was refused in-session); no Stripe keys, so no Checkout round trip yet.
- **Also:** removed the manual Checkout idempotency key (clashes with the changing expiry on retry; the SDK adds its own); confirmed with payments off `/rezervacija` still reaches the old review step and "Rezervuoti" button.
- **Next:** apply the migration, regenerate types, add Stripe sandbox keys, register the webhook (`stripe listen` locally), run a test payment through paid / abandoned / refunded; consider an admin refund button.

## 2026-11-04 — Live database brought up to date with main
- **Changed:** `supabase migration repair` for three already-applied migrations, then `db push --include-all` for `20261103213000_program_sessions_only_via_program_ticket`, `20261104130000_stay_booking_units`, `20261104140000_mixed_quad_rentals` on project `mwngljhcvqkvncwbmgeo`. Verified `bookings.stay_units`, `quad_rental_items`, `create_stay_booking_with_units`, `create_mixed_quad_rental` and the program guard exist. All feature branches were already in main and were deleted locally.
- **Status:** `tsc` and eslint (app, components, lib, hooks) clean; `/rezervacija` checked at 1280 and 375 px (Pirtis, Nakvynė with live "Liko" counts, Keturračiai), no console errors, no overflow. Admin code on main already reads `stayUnits` and `quad_rental_items`; admin screens not seen logged in; no real submit tested.
- **Next:** staff login to check admin Nakvynė/Keturračiai views with a mixed rental; test a real booking with a verified phone.

## 2026-11-04 — Page-by-page consistency sweep
- **Changed:** ui Button/titles/tabs/table heads to font-bold; day-picker min-w so "Uždaryta" fits.
- **Status:** `/`, `/renginiai`, `/kuponai`, `/skaiciuokle`, all 5 `/embed/*`, `/admin/prisijungti` measured in the browser (Termina only, 400/700, no overflow); logged-in admin screens not seen (needs staff login).
- **Next:** log in and check admin pages; desktop width pass.

## 2026-11-04 — UI consistency audit and fixes
- **Changed:** Termina for body (Work Sans dropped); new type roles `text-item/figure/heading/total` mapped across ~50 files; weights 400/700 only; hairlines on `border-line` tokens; ui Title bases use `text-item`.
- **Status:** `tsc` + eslint clean; browser-checked /rezervacija (Pirtis flow through review, Nakvynė and Keturračiai tabs, extras popup) at phone width, no console errors; submit not exercised.
- **Next:** eyeball reservation, calculator, booking at 375 / 1024 px.

---
tags: [meta, session-log]
updated: 2026-11-05
---

# Session log

Append-only record of **what each working session changed and where it left the
project**. Newest first. Keep entries short (3–6 lines). Notable user-facing or
architectural changes also go in [[changelog]] / [[decisions-log]]; the live
snapshot lives in [[status]].

Entry format:

```
## 2026-11-04 — Unslop audit and polish
- **Changed:** removed negative tracking on small bold labels, put half-step paddings on the 4 px grid, fixed `text-micro` size in design-system.md.
- **Status:** `tsc` clean; not checked in the browser.
- **Next:** eyeball the reservation option cards, calculator pickers and the landing ticker at 375 / 1024 px.

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
