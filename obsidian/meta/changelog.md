---
tags: [meta, changelog]
updated: 2026-10-30
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-10-30 — Several saunas

- **What:** `/admin/pirtis` lists saunas (cover, "nuo X €/val.", on/off,
  order, delete) above the shared extras catalogue; `/admin/pirtis/nauja` and
  `/admin/pirtis/[id]` edit name, description, features, rates and hours,
  offered extras (RHF + Zod) and photos (upload, reorder, remove; Supabase
  Storage). `/pirtis` and `/embed/pirtis` start with "Pasirink pirtį" when more
  than one sauna is active (`?pirtis=<id>` preselects); the rest of the flow
  runs for the chosen sauna. Užimtumas and the manual booking dialog pick a
  sauna. Migration `20261030100000_saunas.sql` (ADR-0017).
- **Why:** the park is adding sauna types with different prices and capacity.

## 2026-10-30 — Plugin admin page is its own menu item

- **What:** plugin 1.2.1 moves the settings from Settings → Vanduo Marse to
  a top-level admin menu item "Rezervacijų sistema" (calendar icon, below
  Comments) and shows the "settings saved" notice there. First release to
  reach installed copies through the Plugins page updater.
- **Why:** staff should find the booking system in the main admin menu.

## 2026-10-30 — Sauna hides start times that have passed

- **What:** `/pirtis` (and its embed) get the Vilnius hour from the server
  (`SaunaPageData.nowHour`). Today's starts up to and including the current
  hour show "Praėjo" and are disabled; days with no open start are disabled
  in the day strip ("Uždaryta" once today is over, "Užimta" when fully
  booked) and the form opens on the first bookable day. `createSaunaBooking`
  refuses past dates and starts too, for pages left open for hours.
- **Why:** at 17:00 the form still offered 10:00 today.

## 2026-10-30 — WordPress plugin updates from the Plugins page

- **What:** `pnpm build` runs `build:wp-plugin` first, publishing
  `/wordpress/vanduo-marse-booking.zip` and `.json` (version manifest) with
  every deploy. Plugin 1.2.0 has an `Update URI` header and
  `includes/updater.php`, so WordPress shows "Update now", "View details" and
  the auto-update toggle. Updates come only from the fixed HTTPS update
  origin, not the configurable app address. New dev dependency `fflate`
  (ADR-0016).
- **Why:** no more re-uploading the zip for each change.

## 2026-10-30 — Widget appearance from the WordPress admin

- **What:** plugin 1.2.0 adds Settings → Vanduo Marse → Išvaizda: colour
  pickers for background, content, summary bar, text/borders, accent, tab,
  active tab and its text; text and heading fonts (any Google Fonts family,
  with suggestions); heading case; and a live preview. Values go on the iframe
  URL; `EmbedTheme` + `lib/embed-theme.ts` validate them and override the
  tokens. New `--tab*` tokens in `BookingTabs` (ADR-0015).
- **Why:** the widgets have to match the WordPress site's look.

## 2026-10-30 — Booking widgets fit any block width

- **What:** the embed drops its side padding below `sm`, so a widget fills
  the block it sits in. Fixed three narrow-width overflows that also hit
  phones at 320 px: tab label + count badge now wrap (`BookingTabs`), the
  sauna extras grid can shrink (`grid-cols-1` in `UpsellPicker`), and
  `Stepper` controls wrap under a long label. Every widget now fits from
  285 px (sidebar width). Plugin 1.1.0: the iframe sits in a full-width
  `.vm-booking` wrapper (block uses `get_block_wrapper_attributes()`, so
  wide/full alignment and spacing work), and the app URL defaults to
  `https://vanduomarse-redesign.vercel.app`.
- **Why:** the widget goes on vanduomarse.lt in blocks of any width.

## 2026-10-30 — WordPress booking widgets

- **What:** `/embed/pirtis|keturraciai|miegas|renginiai|kuponai` render the
  booking flows without site chrome (`EmbedFrame` reports height, keeps links
  inside the widget). `proxy.ts` restricts framing to `EMBED_ALLOWED_ORIGINS`.
  New plugin `wordpress/vanduo-marse-booking/`: `[vm_booking type="…" tab="…"]`,
  block "Vanduo Marse rezervacija", classic widget, Settings → Vanduo Marse for
  the app URL. `QuadRules` extracted from `/keturraciai` (ADR-0014).
- **Why:** the client's WordPress site needs the same bookings without a second
  implementation of the flows or prices.

## 2026-10-29 — Detailed sauna booking SMS

- **What:** sauna bookings send a full summary right after submit
  (`notifyBookingReceived` + `saunaSummary` in `lib/sms/notify.ts`):
  "rezervacija PM-1063 gauta. Pirtis 2026-11-11 18:00-20:00, 4 zm., 140 EUR.
  Patvirtinsime netrukus." The staff alert and the admin confirm/cancel SMS use
  the same time range. Bookings still wait for staff confirmation; other
  request types keep the short "gavome jusu uzklausa" text.
- **Verified:** real SMS delivered from the Twilio trial number (trial adds a
  "Sent from your Twilio trial account" prefix and only reaches verified numbers).

## 2026-10-29 — Booking SMS (Twilio)

- **What:** `lib/sms/twilio.ts` (REST, no SDK) + `lib/sms/notify.ts` (ASCII-only
  texts, 160-char segments). Customers get "request received" right after the
  public actions store a request (sauna, stay, tickets, registrations,
  calculator, quads) and "confirmed / cancelled" when staff change the status
  in /admin (website-sourced rows only). Optional staff alert via
  `STAFF_NOTIFY_PHONE`. Sends run in `after()` and never fail a booking.
- **Env (server only):** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_FROM_NUMBER`; without them SMS is skipped.
- **Not covered:** automatic 48 h expiries (pg_cron) and status changes made
  outside the admin actions send no SMS.

## 2026-10-28 — Per-contact caps hardened

- Phones compare in one canonical form (`private.norm_phone`: `+370`, `8…`,
  `00370…` and bare 8 digits match); web requests need an email or a phone with
  8+ digits; concurrent requests from one contact are serialised with advisory
  locks. `20261028150255_contact_limit_hardening.sql`.
- Migration history repaired: earlier hand-applied migrations were recorded in
  `supabase_migrations.schema_migrations` so `supabase db push` is consistent.
- Known limit: contact-keyed caps can be used to block someone else's contact
  for 48 h; a CAPTCHA/email confirmation would be the real fix.

## 2026-10-28 — Pending web requests expire and are capped

- **Why:** public requests hold their slot as `laukia`, so a script could hoard
  sauna hours, cabins and seats without logging in.
- **What:** `20261028140000_pending_request_limits.sql`: web requests (source
  `svetaine`) still `laukia` after 48 h are cancelled by a pg_cron job every 30
  minutes (`expire_pending_requests()`); a trigger on bookings, event tickets
  and quad rentals lets one email/phone hold at most 3 pending requests (5 new
  inquiries per day). Staff-entered rows are untouched.

## 2026-10-28 — Public requests are stored

- **What:** private sauna hire, cabin/camper stays, event tickets, event
  registrations and calculator quotes used to end in a client-side receipt with
  a made-up reference (or a `mailto:`), so nothing reached the dashboard.
  They now call server actions (`app/actions/requests.ts`) → security definer
  RPCs (`20261028130000_public_requests.sql`) that re-price, re-check
  availability and store a `laukia` / `nauja` row. Forms gained a contact step.
- **Admin:** `/admin/renginiai` lists tickets for non-quad events; event
  registrations and quotes appear in Užklausos.
- **Receipt wording** now says the request was received, not confirmed.

## 2026-10-27 — Hero wordmark melts under the cursor

- **What:** the home hero wordmark reacts to the pointer like the Max Bennet
  reference: letters smear sideways and dissolve into spray around the cursor,
  then settle back. New `DistortWordmark` (client) + `lib/distort-gl.ts`
  (raw WebGL, no new dependency). See [[components/common]], ADR-0013.
- **Refined:** slower, low-frequency liquid smear; edge spray only (fine device-pixel
  grain, no stray specks); strength follows pointer speed and eases back when the
  cursor rests.
- **Safe fallbacks:** touch devices, `prefers-reduced-motion` and no-WebGL keep
  the plain `Wordmark`; the footer repeat is unchanged.

## 2026-10-28 — Staff roles and per-page permissions

- **What:** owners create staff logins and give each person a role; a role is a
  set of admin pages (Apžvalga, Rezervacijos, Užimtumas, Užklausos, Keturračiai,
  Kuponai, Renginiai, Pirtis, Kainodara). New screen `/admin/darbuotojai`
  (owner-only): staff list (role, on/off, reset password, remove) and roles
  (switch per page, with plain hints). Anyone can change their own password.
- **Enforced in the database:** every staff policy now checks the page
  permission (RLS), not just the menu; the menu, tab bar, header shortcut and
  page guards follow the role. Pages that show another page's data get read-only
  access to it (listed in [[database]]), so a role never opens onto empty data.
- **Safety:** the last owner can't be removed, demoted or switched off; the owner
  role can't be edited; you can't switch off or remove yourself. Switched-off
  and page-less accounts see a "no access" screen that says why.
- **Existing staff become owners** when the migration runs, so nobody is locked out.
- **Env:** `SUPABASE_SERVICE_ROLE_KEY` is now used (server only) to create,
  reset and delete logins; without it only that screen reports it (ADR-0012).
- **Order matters:** apply `20261028120000_staff_roles.sql` **before** deploying
  this code, or `/admin` fails for everyone. Applied to the live project; see [[database]].
- **Internal:** action helpers moved to `lib/admin/action-helpers.ts`;
  `staffClient(need)` replaces `staffClient()`; capacity/consistency triggers are
  `security definer`.

## 2026-10-28 — Quads (keturračiai): rental page and admin

- **Public:** `/keturraciai` with two tabs: hourly rental (day, quad type and
  count, riders, start, length, contact) and guided tours (seats on a departure).
  Both store a **request** that staff confirm: availability counts pending and
  confirmed rentals, and the confirmation says the spot isn't guaranteed yet.
  Nav gained "Keturračiai"; tours also appear in `/renginiai` (category
  "Keturračiai", CTA → the tours tab).
- **Admin:** `/admin/keturraciai` (tabs Nuoma / Žygiai / Parkas): status chips and
  details sheet, "Nauja nuoma" for phone bookings, tour seat confirmations,
  fleet editor and opening hours / max length / deposit / min age / rules text.
  Nav badge counts pending rentals and tour seats.
- **Data:** three migrations (ADR-0011): `quad_types`, `quad_settings`,
  `quad_rentals` + hourly capacity trigger + 3 anon-safe RPCs; tours reuse
  `events` (new category `keturratis`) and `event_tickets`. **Not applied to the
  live project yet**, and the seeded fleet and prices are placeholders: see
  [[database]].
- **Header:** eight nav links overflowed by 45 px at 1024, so link padding is `px-2` at `lg` and `px-3` from `xl`.
- **Not done:** coupons can't be redeemed against quad rentals yet (the coupon
  service enum has no `keturratis`), and there is no per-day closure (switch a
  quad type off to hide it).

## 2026-10-27 — Gift coupons as products

- **Shop:** `/kuponai` sells euro-value coupons (25 / 50 / 100 €) and experience
  coupons (plaukimas, pirtis, nakvynė). Orders are stored as "laukia apmokėjimo";
  there is **no online payment yet**, so the team arranges it by email and then
  presses „Pažymėti apmokėtu ir išsiųsti kodą" in `/admin/kuponai`, which issues
  a 12-character code (valid 12 months) and emails it (Resend, optional).
- **Redemption:** the sauna and cabin flows have a coupon field that checks the
  code and shows the discount; the receipt carries the code and says the balance
  is deducted on arrival. Staff record the spend in the admin (partial spends
  allowed). Public bookings still aren't saved, so the online discount is not
  linked to a stored booking (`coupon_redemptions.booking_id` is ready for it).
- **Admin:** `/admin/kuponai` (orders, search by code/ref/name/email, details
  sheet, products editor) + nav item with a pending-orders badge.
- **Data:** migrations `20261027203000_coupons.sql` and
  `20261027203100_coupon_products.sql` (ADR-0010), applied to the live project
  and checked as anon; types regenerated. A test order `KP-1001` is in the
  database: cancel it in /admin/kuponai. See [[database]].
- **Changed:** `FindUs` links to `/kuponai` instead of the external shop and no
  longer claims coupons never expire; `NAV_LINKS` gained "Kuponai";
  `ArrowButton` accepts `type="submit"`.
- **Env:** optional `RESEND_API_KEY` and `COUPON_FROM_EMAIL` (`.env.example`).

## 2026-10-27 — Landing page restyled after max-bennet.webflow.io

- **Look:** giant full-width coral wordmark, tiny uppercase meta row, rounded
  photo tiles with captions, pill CTAs, borderless blush header, wordmark
  repeated in the footer. The ink full-bleed bands became rounded panels
  (`Pricing`) and `bg-card` tiles (`Equipment`, `FindUs`, `StatusBar`).
- **New:** `Wordmark`, `SectorTiles` (replaces `MissionPatches`, whose dashed
  patch circles used inline `style`), `TrackStats`; `rounded-tile` token and
  the `font-wordmark` / `wordmark-size` / `wordmark-fit` utilities; `ArrowLink`
  `pill` prop (ADR-0009).
- **Removed:** `TrackPanel`, `CableLoop` (and `.cable-rider` CSS),
  `AtmosphereStrip`. The park numbers live on as `TrackStats`.
- **Follow-up:** `TrackStats` figures lost their top rules; the hero meta row
  is top-aligned with balanced, relaxed-leading text. `StatusBar` now leads with a
  large status line and lists each season's hours as aligned day/time pairs.
  Tablet fix: `TrackStats` is 2 columns below `lg` and its numerals scale
  `7xl` / `8xl` / `9xl`, because 4 columns at 768 px made "620 m" run into "6".
  Dev-log cleanups: the first sector tile loads eagerly (it is the LCP image;
  Next 16 deprecates `priority`), and Big Shoulders sets `adjustFontFallback: false`.
- **Placeholders:** sector tiles use Unsplash photos until real park photos
  are supplied (`components/sector-tiles.tsx`).

## 2026-10-22 — Mock data removed: site and admin run on Supabase

- **Removed:** `lib/admin/mock-data.ts` and every runtime generator of fake data
  (pseudo-random sauna hours, cabin occupancy and ticket counts, hard-coded
  park events and sauna templates, default extras). The same demo data now
  lives in the "Vanduo" database (`supabase/seed.sql`, compacted to
  multi-row inserts), dated relative to load day.
- **Admin:** staff login at `/admin/prisijungti` (Supabase email + password).
  `proxy.ts` refreshes the session, and the panel checks `public.staff`.
  All 12 store actions now persist through server actions; new bookings get
  their `PM-`/`MM-` number from the database. The sidebar and mobile sheet gain
  „Atsijungti", and the "Demonstraciniai duomenys" notes are gone.
- **Public:** `/pirtis` shows real taken hours, live rates (including the facts
  box) and extras, and session spots from ticket sales. `/miegas` shows real
  free cabins per size, and `/renginiai` lists published events from the
  database. Confirmations still don't save.
- **Deps:** `@supabase/supabase-js`, `@supabase/ssr`, `server-only`.
- **Env:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
  now required (`.env.example` updated).
- ADR-0007 supersedes ADR-0005.
- Admin info texts no longer say "kol duomenų bazė neprijungta" (Užimtumas,
  Renginiai, Pirtis, Kainodara); Kainodara now says the prices are saved but
  don't change the site or calculator yet.
- Verified in the browser as staff (admin@admin.com, display name "Administratorius"):
  all seven screens load DB data. Status change, closing and reopening an hour,
  a new phone booking (PM-1062, extras snapshot) and an inquiry note all
  persisted and were rolled back. The phone layout and sign-out work. Not
  covered: event create/delete, saving sauna rates or prices, the
  conflict-error path in the UI (covered by SQL tests).

## 2026-10-22 — Supabase project "Vanduo" migrated

- All migrations applied to the new project (`mwngljhcvqkvncwbmgeo`) through
  the Supabase MCP. Local files renamed to the versions the project recorded.
- The first advisor run showed `is_staff()` callable as an RPC by anon, because
  Supabase grants execute on public functions to anon directly. A follow-up
  migration moves it to a `private` schema, revokes RPC access to trigger
  functions and adds a missing FK index. Only the two intended availability RPCs
  remain flagged.
- Generated `lib/supabase/database.types.ts`. The app still uses the in-memory
  store; no env vars or clients are added yet.

## 2026-10-22 — Supabase migrations prepared (not connected)

- `supabase/` added with `config.toml`, four migrations and a demo `seed.sql`.
  They're ready to push to a fresh project, and nothing in the app uses them yet.
- The database itself rules out double-booked sauna hours, booking over staff
  blocks, overselling cabins by size and overselling event tickets. RLS keeps
  customer data staff-only, and public pages get availability through two
  functions instead.
- Data audit found the cabin size missing on bookings, cabin prices charged per
  guest in the calculator but per cabin in booking, no contact details in the
  public flows and fake public availability. Listed in [[database]].
- Checked in PGlite with 32 passing checks. Not yet run on real Supabase.

## 2026-10-19 — Home: hero redesign

- Audit of the old hero: the cable-loop SVG floated as a faint dotted outline
  with no frame, so the right half read as empty; the park's numbers were
  buried in a paragraph; the boxed eyebrow wrapped awkwardly at 375 px; the
  "Visos zonos" link was under 44 px.
- Now a 7/5 split from `lg`: copy left, `TrackPanel` right, an ink block
  with the loop drawn in foam and the numbers (620 m, 6 bokštai, 17 kliūčių,
  8 raiteliai vienu metu) as a scannable `dl`. The panel gives the hero a
  visual anchor until real photography lands.
- Eyebrow is a rust tick + text (no box); "Visos zonos" is a 44 px link.
- Load-in: blocks fade up in a 0–500 ms cascade (`tw-animate-css`,
  `motion-safe:` only); the orbiting rider stays the one looping motion.
- `CableLoop` draws in `currentColor` so the parent sets its tone.

## 2026-10-19 — Admin: export bookings to CSV

- `/admin/rezervacijos` has an **Eksportuoti** button (outline, 44 px) that
  downloads the rows currently shown — kind, time, status and search filters
  all apply — as `rezervacijos-YYYY-MM-DD.csv`. Disabled when nothing matches.
- Built for Lithuanian Excel: UTF-8 with BOM, `;` separator, `1234,50` amounts,
  Lithuanian headers. Dates are `2026-10-19` / `2026-10-19 14:05` rather than
  the UI's "Pr, 19 Spalio" so they keep the year and sort in Excel.
- Cells starting with `=`, `@` or a non-numeric `+`/`-` get a leading `'`
  (names and notes come from public forms); phone numbers stay untouched.
- CSV building is pure (`lib/admin/export.ts`); the browser download is
  `lib/download.ts`. Reads only from `useAdmin()` via the view's filtered rows.

## 2026-10-19 — Contact bar above the header

- New `ContactBar` (dark strip) above the sticky header on every public page:
  +370 630 80 444 (tap to call), info@vanduomarse.lt and a map link.
- Contact details moved out of `SiteFooter` into `lib/contacts.ts`, now
  shared by the bar, footer and `FindUs` (map URL), so they change in one place.

## 2026-10-19 — Pirtis: group price wording

- Feedback "price doesn't change for 7+ people" is the sheet's rule: the
  hourly rate is per group in two bands (≤6 asm. 70 €/val., 7–20 asm.
  100 €/val.), so 7 and 20 people pay the same. Kept, per the owner.
- The Grupė step now shows "Jūsų grupei – N €/val. už visą pirtį", which
  updates with the stepper, and the hint says "Kaina visai grupei, ne žmogui".

## 2026-10-19 — Sticker dock for the zones

- New `StickerDock` in the root layout: the brand-kit zone stickers
  (`public/brand/sticker-{vanduo,akademija,skoniai,miegas}.svg`) as a sticky
  bottom menu. Phones/tablets: full-width bar; from `lg`: a floating dock that
  hugs the stickers, 24 px above the edge. A spacer keeps the footer clear.
  Background is frosted glass: half-transparent blush paper with a strong
  backdrop blur, so the page shows through softly.
- Akademija and Skoniai have no pages yet, so they link to `/#akademija` and
  `/#skoniai` (new anchors on the `MissionPatches` cards). Pirtis and
  Renginiai have no sticker in the kit.
- Not shown in `/admin` (own bottom bar) or below `lg` on `/skaiciuokle`
  (calculator total bar).
- `/miegas` facts: "Iki 6 vienam nameliui" → "Nameliai 2 arba 4 asmenims".

## 2026-10-19 — Home: zones section on white

- "Šeši Marso sektoriai" (`MissionPatches`, `#zonos`) sits on `bg-card`
  (warm white `#fffaf7`) to break up the blush page. No pure-white token
  exists; `--card` is the brand's white.

## 2026-10-19 — Real Termina font replaces the Archivo stand-in

- Termina Regular + Bold (client-supplied OTFs) now load from `app/fonts/`
  via `next/font/local`; headings are Bold, body text Regular, site-wide and
  in `/admin`. Archivo dropped. See ADR-0006.
- Checked all public routes and `/admin/rezervacijos` at 375 px: no page-level
  horizontal scroll. Note: a stale Turbopack cache kept serving the old CSS
  until `.next` was cleared.

## 2026-10-19 — Miegas: 2- or 4-person cabins, free count per day

- `/miegas` booking: choosing **Namelis** now asks for the size (2 or 4
  asmenims). Guests are capped at the size; the tile reads "nuo 50 €".
- Each arrival day shows **"liko N"**: cabins of any size free for every
  night of the chosen stay. Full days and booked-out sizes are disabled; a
  booked-out preferred size falls back to the other one.
- Prices: the sheet's "cabins 50–60 €/night" is read as **50 € double, 60 €
  quad** (was a flat 65 €). Needs confirming with the client.
- Public availability is still deterministic pseudo-data in `lib/cabin.ts`
  (like the sauna), not the admin store. Admin bookings don't record the
  cabin size yet; `CABIN_COUNT` is now derived from `CABIN_SIZES` (14).

## 2026-10-19 — Agent files and docs brought in line with the code

- `AGENTS.md` (loaded by `CLAUDE.md` and `.cursorrules`) now carries the
  project summary, 10 hard rules, a code map and commands; it previously held
  only the auto-generated Next.js block (kept intact at the end).
- `README.md` replaced the create-next-app boilerplate (routes, status,
  how to run, stack, where docs live). `.env.example` added (planned
  Supabase vars, commented) and allowed through `.gitignore`.
- Vault: filled system overview, data flow, env vars, hooks catalog, SEO
  per-route table (gaps: `/pirtis` and `/miegas` descriptions, sitemap,
  robots), backend overview, tech-stack tooling/not-used; rewrote
  folder-structure, routing, component conventions, the new-page playbook and
  note templates, which described a `src/` + `views/` layout this repo
  doesn't use. No empty template tables remain outside `templates/`.

## 2026-10-19 — Admin: manual bookings (phone / walk-in)

- **Rezervacijos → Nauja rezervacija** opens a form for bookings taken by
  phone or on site: Pirtis / Namelis / Kemperis, date, guests, customer
  (email optional), status, channel, internal note.
- Sauna: only free start times and lengths are offered (existing bookings
  and staff-closed hours respected, using the admin's sauna rules); active
  upsells can be added. Cabins: rejected if every cabin is taken on any
  night; guest limits per type. Price is computed from the admin's own rates
  and upsells, with an optional manual override (discounts).
- Bookings carry `source` (svetainė / telefonu / vietoje) and `note`; the
  list tags phone/on-site bookings and the sheet shows both. A new booking
  opens in the sheet after saving. Occupancy helpers moved to
  `lib/admin/occupancy.ts` (shared by the grid and the form).
- **Mobile admin navigation is a bottom tab bar** (`AdminBottomNav`, below
  `lg`): Apžvalga, Rezervacijos, Užimtumas, Užklausos plus "Daugiau" (bottom
  sheet: Renginiai, Pirtis, Kainodara, Į svetainę). Live count badges, 56 px
  tabs, safe-area padding, `aria-current`. The sidebar and its toggle are
  desktop-only now; the mobile header shows the badge logo. Content gets
  bottom padding and toasts sit above the bar on phones.
- All admin dialogs keep the title pinned at the top and the actions pinned
  at the bottom while the form scrolls; footer buttons sit side by side on
  phones instead of stacking (shared `components/ui/dialog.tsx`).
- Overview KPI cards sit in a 2×2 grid on phones (4 across from `xl`); the
  value steps down to `text-xl` so amounts like "12 655 €" stay on one line.

## 2026-10-19 — Admin: sauna rates, rules and upsells

- New **Pirtis** admin section (`/admin/pirtis`): edit hourly rates
  (small / large group and the threshold), 4 h package, max people, min/max
  hours and opening hours, with Zod cross-field checks and a live
  "what the guest pays" table. Sauna items left Kainodara.
- **Upsells** are now data (`lib/sauna-upsells.ts`): name, description,
  price, unit (per booking / person / item / hour), max items, on/off.
  Admin can add, edit, hide and delete them; Pirtininkas (100 €), Beržinė
  vanta and Rankšluostis (5 €/item) are seeded.
- The public `/pirtis` booking renders the active upsells generically in a
  "Papildomai" step (toggles or steppers capped at the group size) instead
  of hard-coded pirtininkas/vantos; receipts and calendar details list them.
  `SaunaRates` + `sessionPrice(hours, party, rates)` let the admin preview
  any rates. Admin edits still reset on reload and don't reach the public
  page until the database exists (ADR-0005).

## 2026-10-19 — Admin dashboard (UI-first, mock data)

- New `/admin` area (noindex) with a shadcn/ui sidebar layout: **Apžvalga**
  (today, pending, new inquiries, month total, sauna occupancy, upcoming
  events), **Rezervacijos** (filters, status transitions, details sheet),
  **Užimtumas** (sauna hour grid with close/reopen hours, nightly cabin and
  camper occupancy; one day at a time on phones), **Užklausos** (status
  pipeline, notes), **Renginiai** (create/edit/delete, publish toggle, sales)
  and **Kainodara** (grouped price editor with range validation; label and
  inputs stay on one row at every width, buffets numbered as packages 1–4).
- Data is seeded mock data in an in-memory store (`AdminStoreProvider`),
  generated relative to today; edits reset on reload and do not affect the
  public site yet. Copy on each screen says so. See ADR-0005.
- shadcn/ui initialised (radix, Nova preset) with tokens mapped to the live
  brand (aubergine primary, blush surfaces, coral ring, `--radius: 0`), Geist
  dropped in favour of Archivo. Control heights raised to 44 px
  (button/input/select/tabs). The sidebar switches to a drawer below 1024 px.
- Forms use React Hook Form + Zod (event dialog, inquiry notes, price groups).
- `hooks/use-mobile.ts` rewritten on `useSyncExternalStore` with a
  breakpoint argument (the generated version failed the React lint rules).

## 2026-10-19 — Pirtis booking on real prices

- `/pirtis` private hire now uses the 2026–27 price sheet instead of
  placeholder rates: 70 €/h up to 6 people, 100 €/h for 7–20, minimum 2 h,
  4 h package 350 € (applied when cheaper), capacity 20, pirtininkas +100 €
  per booking (flat, not hourly).
- Group size comes first in the flow (it sets the rate); start-time tiles
  show the longest available run; duration tiles price for the actual group.
- `lib/sauna.ts` is the single source of sauna rates; the event calculator
  imports `sessionPrice` / `MASTER_PRICE` from it.
- Open question for the client: pirtininkas is 100 € on the sauna rows but
  200 € in the contract terms. Booking uses 100 €; the calculator shows
  100–200 €.

## 2026-10-19 — Responsive pass (375 / 768 / 1024 / 1280)

- Audited every route for page overflow, horizontal scrollers, text spilling
  out of its box, tap targets under 44 px and text under 12 px.
- **Mobile nav:** below `lg` the header shows a menu button (`MobileMenu`,
  Escape closes it) instead of hiding the nav entirely. Links come from
  `NAV_LINKS`, which now also includes Miegas Marse. The inline nav starts at
  `lg`, where all six links fit.
- **Tap targets:** stepper buttons 28 → 44 px, header CTA, filter/preset
  chips, `ArrowLink` and calendar buttons all `min-h-11`+.
- **No sideways scrolling for choices:** Renginiai category chips wrap
  instead of scrolling. Only the day strips scroll horizontally, on purpose.
- **Layout:** homepage hero stacks until `lg` (no one-word-per-line headline
  on tablets); Įranga / Papildomai stack until `lg`; equipment prices never
  break mid-value; calculator space cards go one column at `lg` and two at
  `xl`, with a wrapping header row.

## 2026-10-19 — Event price calculator (/skaiciuokle)

- New `/skaiciuokle` page: pick an event type (8 presets from the price
  sheet), guests (adults + children 3–10), day type, space, catering,
  drinks, services and activities; a live estimate shows a min–max total,
  per-guest figure, the sheet's typical per-guest range, warnings and a
  `mailto:` inquiry with the breakdown. Mobile gets a sticky total bar.
- All prices come from the client's `Kainodara'26-'27.xlsx` and live in
  `lib/event-pricing.ts` (see ADR-0004). Linked from the header nav and the
  Renginiai page.
- Known sheet inconsistencies, shown as ranges until the client confirms:
  pirtininkas 100 € (space sheet) vs 200 € (terms sheet). (The `/pirtis`
  booking moved to sheet prices in a later change.)

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
