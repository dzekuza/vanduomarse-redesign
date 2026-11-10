- 2026-11-10 Added the shared monthly availability calendar to the stay page. Dates show available cabins for one night, with a breakdown by type when opened.
- 2026-11-10 Matched the quad calendar cards to the sauna schedule and moved hourly availability into a dialog. Dimmed the inactive time field, grouped the booking reminders, and put the help contacts in one row.
- 2026-11-10 Widened the sauna introduction, moved the light background to each calendar session card, and shared the color-coded seat counts with the booking time list.
- 2026-11-10 Added 12 optimized WebP lodging photos to the shared cabin gallery and used the new façade photo for the service and homepage covers.
- 2026-11-10 The stay sidebar shows the three unit types and prices in one row, then asks for dates and quantity. The plan appears as soon as an available stay is selected and updates the total when the type, quantity or dates change.
- 2026-11-10 Centered the month and year between the calendar arrows and shared the date control across activity sidebars. Sauna calendar entries open session details directly and show color-coded remaining seats. Expanded the sauna page description, listed private hire rates and linked directly to Google Maps reviews.
- 2026-11-10 Added venue detail galleries to the event calculator, a four-step buffet price slider, and inline drinks and service sections below catering.
- 2026-11-10 Simplified availability marks in the reservation strip and calendar. Red activity icons now mark dates with no available slots. Added optional long descriptions to sauna session details while keeping the listing summary short.
- 2026-11-10 Restored the original `ČIA NAKTIS NESAKO „TYLIAU“.` heading in the homepage celebration section.
- 2026-11-10 Updated the home hero introduction and public footer contacts. The header logo closes the navigation menu. Activity landing pages now share the same hero photo proportions.
- 2026-11-09 Updated the homepage introduction, public contacts and reservation help number. Clarified that paper vouchers are used in one visit and that cabin rates are per cabin per night. Added individual quotes for stays of three or more nights and removed unsupported event equipment from public venue descriptions.
- 2026-11-09 Moved the price unit (€, €/asm., min. sąsk. €, …) inside the amount field itself, ahead of the number, instead of a separate muted line under the label — new `UnitAmountInput` (`components/admin/unit-amount-input.tsx`, a bordered box with the unit text + a borderless native input inside it), used by `PriceGroupForm` (Kainodara's Erdvės/Maitinimas/… tables) and `SaunaRatesFields` (Pirtis rates). Also bumped a few more `font-normal` row-title spots the earlier sweep missed to `font-medium`: `EventsView`'s event/ticket titles (Renginiai screenshot) and the customer-name line in `BookingSheet`/`InquirySheet`/`CouponSheet`/`RentalSheet`. `tsc`, full-repo `eslint` and `next build` clean.
- 2026-11-09 Removed the unused "Laimėta"/"Prarasta" inquiry statuses (ADR-0047): confirmed zero live rows used either value, then narrowed the `inquiry_status` Postgres enum itself (migration `20261109150000_drop_inquiry_won_lost.sql`, applied live) rather than only hiding the two filter chips — `InquirySheet`'s status-change dropdown reads from the same `INQUIRY_STATUS` record as `InquiriesView`'s chips, so hiding only the chips would've left the statuses settable with no way back to filter them. Narrowed `InquiryStatus`/`INQUIRY_STATUS`/`INQUIRY_TONE`/`setInquiryStatus` to match; `database.types.ts` regenerated. `tsc`, full-repo `eslint` and `next build` clean.
- 2026-11-09 Swept the rest of `/admin` for the same flat-title pattern now that Termina Medium exists: every row/item title that was `text-sm font-normal` sitting between a muted meta line and a bold value/badge is now `font-medium` — `PriceGroupForm`/`SaunaRatesFields`'s rate labels (the "Erdvės"/"Maitinimas"/"Kainos" screenshots), `ProgramsCard`/`SaunasCard`/`UpsellsCard`/`SaunaUpsellsField`/`QuadTypesCard`/`CouponProductsCard`/`PlansTab`'s item names, `Overview`'s today's-bookings/inquiries/upcoming-event row titles and its "Apyrankės" section label, `StatCard`'s KPI label, `CustomerPage`'s Veikla row labels, `RiderDocumentsTab`'s file names, and three fieldset legends (`BookingExtrasFields` "Papildomai", `SaunaDetailsFields` "Savybės", `RoleDialog` "Skyriai" + each permission's own label) plus two sheet subsection headers (`CouponSheet` "Panaudojimai", `InquirySheet` "Pastabos", `RedeemForm` "Nuskaityti panaudojimą"). Left secondary/meta text (prices, dates, counts already in `text-muted-foreground`) at `font-normal` — only titles moved. `tsc`, full-repo `eslint` and `next build` clean.
- 2026-11-09 Added the missing Termina Medium (500) and SemiBold (600) weights: `app/fonts/Termina-Medium.otf` and `Termina-SemiBold.otf` (from the owner's full licensed Termina family, `~/Desktop/termina/`, renamed from `Termina-Demi.otf`), registered in `app/layout.tsx`'s `localFont` call alongside the existing Regular/Bold. `font-medium`/`font-semibold` now render their own real faces everywhere (site-wide, same `--font-termina` variable) instead of silently snapping to the nearest of only two weights — previously undocumented-as-stale comments in `design-system.md` and `globals.css` said "Regular + Bold only"; both corrected (the `.theme-marse` h1–h6 forced-bold rule is a brand choice, not a font-availability one, and stays). Used the new `font-medium` on `StaysStrip`/`QuadsStrip`'s resource labels ("Nameliai"/"Keturračiai"/"Kemperiai:") so they read as a step between the plain date label and the bold count, not flat — the owner flagged this exact spot from a screenshot of the new Kalendorius tab. `tsc`, full-repo `eslint` and `next build` clean.
- 2026-11-09 Grouped Pirtis/Namukai/Keturračiai into expandable sidebar domains (ADR-0046): `admin-nav.ts`'s `ADMIN_NAV` is now `(AdminNavItem | AdminNavDomain)[]`; each domain expands to a "Kalendorius" child (Pirtis and Namukai both point at the shared `/admin/rezervacijos?view=kalendorius` from ADR-0044) and a "Valdymas" child (Pirtis → `/admin/pirtis`, Namukai → `/admin/kainos`, Keturračiai → `/admin/keturraciai?tab=parkas`, which `QuadsView` now reads). New `flattenNav` splices domain children into one list for the mobile bottom nav/"Daugiau" sheet; new `isActiveHref` compares path-only so a child's `?view=`/`?tab=` query doesn't break active-row matching; `activeNavItem` now also returns the containing domain id so `AppSidebar` auto-expands it. `AppSidebar` renders domains with `Collapsible` + the sidebar's existing (previously unused) `SidebarMenuSub` primitives; added `components/ui/collapsible.tsx` by hand (no CLI network step available). `KlientaiView`'s activity chip filters now sync to a `?activity=` URL param, and each domain's settings page got a small "Žr. klientus →" link into it. `tsc`, full-repo `eslint` and `next build` all clean. Not yet browser-checked (`localhost:3001` still returning HTTP 431).
- 2026-11-08 Set the panoramic lake photo as the shared sauna cover. Marked the 25-person wood-fired sauna as unavailable while it is being fitted out. Listed capacity for the Finnish sauna (20) and the anteroom (30). The sauna schedule shows session names and remaining seats on the dates, and the booking time options show available seats for each session.
- 2026-11-08 Replaced the public sauna cover and gallery with five photos from the owner. The same cover appears on the homepage, in the reservation gallery and in the sauna page's social preview.
- 2026-11-08 Widened the `/pirtis` desktop hero to 2:1 and moved the booking type above the shared inline month calendar. Private hire uses active venue programs and real start availability, with contact details for venues without a program. The schedule has an independent calendar for published sessions and opens the existing session dialog to view details or add tickets to the plan. See ADR-0050.
- 2026-11-08 The quad service sidebar marks daily and hourly availability for the selected route. The booking action appears when the selection is valid and can prepare a reservation email draft. Added ID and 48-hour cancellation information with compact inquiry, phone and email links.
- 2026-11-08 Built `/admin/instruktorius` (ADR-0045): a new, narrow page for instructor staff — scan a rider's bracelet to check them in/out of the water and see who's currently out and for how long. New `instruktorius` permission (own nav row), new `rider_sessions` table, new server action `scanRiderSession` (toggles check-in/out on the same scan), new `InstruktoriusView` (`components/admin/instruktorius/`) showing the scanned rider's card (photo, name, surname, phone, plan) plus a live "Šiuo metu vandenyje" list ticking via a new shared `useElapsed()` hook (`hooks/use-elapsed.ts`). Migration `20261107180000_instructor_sessions.sql` applied directly to the live "Vanduo" project via the Supabase MCP (owner's go-ahead); `database.types.ts` regenerated for real (the `create_inquiry.p_date` hand-edit reapplied, per ADR-0042's convention). Security advisor showed no new findings. `tsc --noEmit`, `eslint` and `next build` all clean. Not yet checked in a browser.
- 2026-11-07 Aligned the service landing pages around a gallery with thumbnails and a booking or contact panel. Added a photo mosaic with a full-size viewer and visible visitor reviews. The quad sidebar now starts with a route and shares dates with the hourly fleet availability calendar. See ADR-0050.
- 2026-11-07 Selecting an arrival date on `/rezervacija` or `/nakvyne` now defaults to one night, shows the dates under the picker and makes available stays selectable immediately. A later checkout can extend the stay up to 14 nights.
- 2026-11-07 Refreshed the home activities intro, the two-rider quad note, and the “WAKEBOARD” card with seasonal wake training in Kaunas. Renamed the celebration section “NAKTYS” and updated its description.
- 2026-11-07 Added public pages for sauna, quads, stay, restaurant, wakeboarding and celebrations. Home cards link to the pages. Each page has a photo gallery, service information, price guidance, schedule, a review link and FAQ. Sauna and stay use the existing reservation flow in a service-specific sidebar. See ADR-0049.
- 2026-11-07 Moved the public sauna ticket quantity next to the selection button. Added a shareable session details dialog with date, time, venue, open seats, description, price and a quantity shared with the card. Sessions added from the dialog go through the existing reservation plan. See ADR-0048.
- 2026-11-07 Flattened the admin IA per the owner's punch list (ADR-0044): regrouped `admin-nav.ts` (Klientai group now has a heading, Nuolaidos moved next to Kuponai in Pardavimai, mobile primary tabs are now Apžvalga/Rezervacijos/Klientai); Apžvalga's "Laukia patvirtinimo" now sums pending bookings + coupons + quads + new inquiries (`useNavCounts`' new `pendingAll`, also badges the Apžvalga nav row); merged Apyrankės → Naudotojai into `KlientaiView`/`CustomerPage` (one rider list, one rider profile; `/admin/apyrankes?tab=nariai` and `/admin/apyrankes/[id]` redirect there; `riders-tab.tsx`/`rider-page.tsx` deleted); merged `/admin/uzimtumas` into Rezervacijos as a "Kalendorius" tab (`BookingCalendarTab`, `?view=kalendorius`) and added a `QuadsStrip` (daily rented quad units vs. active fleet) to it; `/admin/uzimtumas` now redirects there, `availability-view.tsx` deleted. `requirePermission` (`lib/admin/guard.ts`) can now take an array of permissions for these merged pages. `tsc`, full-repo `eslint` and `next build` all clean.
- 2026-11-07 Unslop pass over `/admin`: removed a stray `uppercase` Tailwind utility from two places that didn't go through the brand's deliberate `font-display`/Termina uppercase treatment (`--display-case: uppercase` in `.theme-marse`, `app/globals.css`) — the sidebar's section labels ("Pardavimai"/"Turinys"/"Nustatymai" in `app-sidebar.tsx`'s `SidebarGroupLabel`) and the "Kainos"/"Rezervacijos taisyklės" subsection headers in the Pirtis sauna editor (`sauna-rates-fields.tsx`). Both now render in the sentence case their source strings already use. Also added `127.0.0.1` to `allowedDevOrigins` in `next.config.ts`: without it, Next's dev server silently blocks the HMR cross-origin request and client components never hydrate when the dev server is opened via `127.0.0.1` instead of `localhost`.
- 2026-11-07 `/admin/apyrankes` → Naudotojai now explicitly sorts newest-registered first (`riders-tab.tsx`, `.toSorted` on `createdAt` descending) instead of relying on the incoming array order — guarantees the newest-first behavior regardless of how `loadAdminData`'s query is ordered. The large profile photo on a rider's own page (`rider-page.tsx`) is now a 90×120px (3:4) rounded-lg portrait instead of a 40px circle, since a tiny circular crop of a selfie-style registration photo was hard to make out.
- 2026-11-07 Found and fixed why a just-registered rider never showed up anywhere in `/admin` even after a refresh: `loadAdminData`'s `riders` query (`lib/admin/repository.ts`) ordered `created_at` **ascending** with no limit, and Supabase's REST API silently caps every response at 1000 rows — with `riders` at 8,957 rows (since ADR-0041's Grabby import), the admin dashboard only ever loaded the **oldest** 1000, so every rider created since, including every `/registracija` self-registration, was never in the data staff searched at all (confirmed with a direct `Content-Range: 0-999/8957` check against the API). Flipped to `.order("created_at", { ascending: false })` — newest-first, so a brand new signup is always inside the loaded window. Not a full fix (a table this size needs server-side search/pagination, not one bulk client-side load — noted as a follow-up), but it closes the actual gap that was hiding real, recent customers.
- 2026-11-07 Found and fixed the actual cause of `/registracija`'s upload failure: `anon` has no `SELECT` grant on `riders`/`rider_waivers` at all (confirmed with `set local role anon`: `permission denied for table riders`), so the Storage policies' `EXISTS` subqueries could never see the row — silently rejecting both the photo and the signature upload from the start, not just the photo my previous fix addressed. Migration `20261107172000_fix_rider_upload_privileges.sql`, applied to the live project: two new `security definer` helper functions (`rider_awaiting_photo`, `rider_waiver_awaiting_signature`, same pattern as `private.has_permission`) that the two upload policies now call instead of querying the tables directly. Verified both functions return the right answer `set local role anon`.
- 2026-11-07 Hardened `CameraCapture` (`/registracija` step 2) so a live photo always makes it through "Toliau" cleanly, not just the file-upload fallback: "Padaryti nuotrauką" is now disabled until the `<video>`'s `onLoadedMetadata` fires (capturing the instant the stream attaches could draw a 0×0 blank frame that still "succeeded" silently), a failed `canvas.toBlob()` now shows an inline error instead of doing nothing, and the captured frame is mirrored to match the selfie-view preview (the `<video>` is CSS-mirrored for a natural look; the canvas wasn't, so the saved photo came out flipped relative to what was shown).
- 2026-11-07 Fixed `/registracija` silently failing to upload the photo on every submission ("Registracija įrašyta, bet nepavyko įkelti failų"): the `public rider photo upload` Storage policy's `EXISTS` subquery wrote a bare `name`, which Postgres resolved to `riders.name` (the rider's own first-name column) instead of `storage.objects.name` (the uploaded path) — `riders` has a `name` column, `rider_waivers` doesn't, so the sibling signature-upload policy was unaffected and only photos broke. Migration `20261107171000_fix_rider_photo_upload_policy.sql`, applied to the live project, redefines the policy with an explicit `objects.name`. The three test riders created while this was broken (`Rys Gv`, `Rysard Gv` ×2) still have no photo — re-register or add one manually from their admin profile.
- 2026-11-07 Added a fast year jump to the shared `CalendarGrid` (`components/ui/date-picker.tsx`'s popover, used by every `DatePicker`): the month/year title is now a button that switches to a 12-year grid (its own prev/next-page arrows, years outside `min`/`max` disabled) instead of only stepping one month at a time — picking a birthdate decades back was a lot of clicking otherwise. Site-wide wherever `DatePicker` is used, prompted by the `/registracija` birthdate field.
- 2026-11-07 Two fixes to `/registracija` from the owner's screenshots: widened the page container (`max-w-xl` → `max-w-2xl`) since the big display heading had a lot of unused width beside it at desktop; replaced the native `<input type="date">` for Gimimo data with the shared `DatePicker` (`components/ui/date-picker.tsx`, the same styled month-calendar popover used on `/admin`'s rider profile), capped at today.
- 2026-11-07 Built public self-registration at `/registracija` (ADR-0043): a 3-step wizard (`components/registration/`) — contacts, a required camera/file photo, then both rule documents (`lib/park-rules.ts`) with a canvas signature pad — submitting through a new server action `registerRider` (`app/actions/registration.ts`). Added `riders.self_registered` and a new `rider_waivers` table/bucket (migration `20261107170000_public_rider_registration.sql`, applied to the live project), plus two new anon-only `security definer` RPCs (`register_rider_public`, `finalize_rider_registration_public`) so the public write never touches a table or bucket directly, same contract as every other public form. `/admin/apyrankes` → Naudotojai and `/admin/klientai` now show an "Internetu" badge on self-registered riders; the shared `RiderProfileTab` shows a signed-waiver line with a link to the signature. `tsc`, full-repo `eslint` and `next build` all clean (also re-applied the project's known `create_inquiry.p_date` type hand-edit after regenerating `database.types.ts`, per the documented convention in ADR-0042). Not yet checked in a real browser.
- 2026-11-07 Two follow-ups to the Pardavimas per-item cart (`SalesTab`): (1) "Naujas svečias" no longer asks for a name/surname — it's a single "Priskirti kaip naują svečią" button that creates the rider with a placeholder (`Svečias` + a 4-char random tag, since `riders.name`/`surname` are NOT NULL in the DB); staff can rename them later from the rider's profile. (2) `RiderSelect` (the "Esamas naudotojas" picker) gained a scan toggle next to the search field — tap it, then tap a bracelet, and `useCardScanner` resolves the card against `riderCards` and selects that rider directly, with an inline "apyrankė nepriskirta" message if it has no owner — so staff can find a returning customer by scanning their old bracelet instead of typing their name.
- 2026-11-07 Rebuilt `/admin/apyrankes` → Pardavimas (`SalesTab`) as a per-item cart, on top of the multi-plan rework below (which this supersedes): `RidePlanPicker` cards now add a cart line on every click (`counts`/`onAdd`), instead of toggling a shared selection, so the same plan can be sold to two different customers in one session. Each `CartItem` gets its own "Priskirti klientui" `Dialog` (pick an existing rider — selecting one sells that line immediately — or create a guest; then scan a bracelet or skip), so every card ends up assigned to its own customer rather than one recipient for the whole sale.
- 2026-11-07 Reworked `/admin/apyrankes` → Pardavimas (`SalesTab`) to sell several plan types in one sale and fold the bracelet scan into a popup: `RidePlanPicker` became multi-select (`value: string[]`), the sidebar showed the selected plans as removable chips with a running total, and selecting an existing rider from `RiderSelect` immediately opened a `Dialog` (new rider) to scan the bracelet, replacing the old full-page "bind" step; a new guest's "Priskirti planą" button opened the same dialog after creating them. Superseded by the per-item cart rework above within the same session, once the owner asked for a customer per card instead of one recipient for the whole sale.
- 2026-11-07 Removed the `mx-auto max-w-7xl` cap from `AdminPage` (`components/admin/admin-page.tsx`), the shared heading+body wrapper used by every `/admin/*` screen: content now fills the full available width instead of centering at a 1280px cap. Padding/spacing (`space-y-6 px-4 py-6 md:px-6 md:py-8`) unchanged.
- 2026-11-07 Made `RiderSelect` (used by Pardavimas → "Esamas naudotojas") searchable: it was a plain shadcn `Select` rendering all ~8,940 `riders` into the DOM with no filter. Replaced with a `Popover` + text input combobox, filtering by name or phone client-side, capped at 50 results with a "narrow your search" hint when truncated. No new dependency (`cmdk`/shadcn's Command wasn't needed — a plain filtered button list sufficed). List items are `min-h-11` for touch.
- 2026-11-07 Restyled `/admin/apyrankes` → Pardavimas (`SalesTab`) into a two-column layout at `lg`: plan picker on the left (full width below `lg`), "Priskirti" (recipient toggle, user/guest fields, submit) in a sticky `Card` on the right, so the assign panel stays visible while scrolling a long plan grid. Single column, unchanged order, below `lg`.
- 2026-11-07 Added Apyrankės/Namukai/Keturračiai activity chip filters (multi-select, OR'd) to `/admin/klientai` (`KlientaiView`): narrows the rider list to those with a `purchases` row, a `namelis`-kind booking, or a quad rental, computed client-side from data already in `useAdmin()`. Also added a second KPI row to `/admin/apzvalga` (`Overview`) for apyrankės: bracelets bound (`riderCards.length`), active abonementai (riders on a plan whose `category` is "Abonementai"), total riders, and today's bracelet-plan sales (count + revenue).
- 2026-11-07 Fixed collapsed-sidebar icons sitting flush left instead of centered: `components/ui/sidebar.tsx`'s `SidebarMenuButton` (`size="lg"`, used by `AppSidebar`'s nav) zeroes padding in icon-collapsed mode, which removed the equal padding that centered the icon and left nothing to center it horizontally; added `group-data-[collapsible=icon]:justify-center` to the shared base class so every size variant centers correctly.
- 2026-11-07 Fixed the collapsed (icon-only) desktop admin sidebar showing a sliver of each nav item's first label letter next to the icon: `components/admin/app-sidebar.tsx`'s nav-item and "Į svetainę" label `<span>`s were missing `group-data-[collapsible=icon]:hidden` (shadcn's `SidebarMenuButton` doesn't hide labels itself in icon mode — the consumer must, and the header/footer spans already did this correctly, just not these two).
- 2026-11-07 Reworked cell interaction on the `/admin/uzimtumas` sauna calendar (`SaunaGrid`): clicking a free cell now opens `NewBookingDialog` prefilled with that sauna, date and start hour (previously it toggled the cell closed/open); right-click opens a new `ContextMenu` (`components/ui/context-menu.tsx`, Radix `ContextMenu`, same shape as `DropdownMenu`) with "Nauja rezervacija čia", "Pažymėti langelį", and close/reopen; a booked cell's menu offers "Redaguoti rezervaciją". Selecting one or more free cells (via the menu or, once selection has started, by clicking) switches plain clicks to toggle selection and surfaces a small toolbar plus matching context-menu entries to bulk-close ("Padaryti neprieinamus") or bulk-reopen selected cells — calls the existing per-cell `toggleBlock` action once per selected cell client-side (no new bulk server action). `NewBookingDialog` gained an optional `initial` prop (`saunaId`, `date`, `startHour`) to support the prefill; the header's and bookings list's "Nauja rezervacija" are unaffected (prop omitted there defaults to the old behaviour).
- 2026-11-07 Swapped section order on `/admin/uzimtumas`: "Nameliai ir kemperiai" (cabin/camper occupancy, `StaysStrip`) now renders above the sauna week/day grid (`SaunaGrid`), not below it (`components/admin/availability/availability-view.tsx`).
- 2026-11-07 Changed the shared `TabsList` (`components/ui/tabs.tsx`) so horizontal lists size to content (`h-auto`) instead of the fixed `h-11`, and moved `bg-muted` from the `default` variant onto the base class so it applies regardless of variant. Site-wide (every admin and public `Tabs` usage); supersedes the per-screen `overflow-y-hidden` workaround noted below for apyrankes, since the pill no longer has a fixed height to overflow against.
- 2026-11-07 Built the Klientai app layer on top of the applied migration (ADR-0042): new `klientai` permission (`lib/admin/permissions.ts`); `riderId` on `Booking`/`QuadRental`/`TourTicket`/`Coupon`; nine existing rider actions (`updateRiderProfile`, `deleteRider`, avatar upload/remove, comments, documents, signed URLs) now accept either `apyrankes` or `klientai`, matching the additive RLS; new standalone sidebar item (`AdminNavGroup` gained `"klientai"`, `label: null`); `/admin/klientai` (`KlientaiView`, search + 25/page pagination like Apyrankės's Naudotojai tab, since `riders` is now 8,945 rows) and `/admin/klientai/[id]` (`CustomerPage`: Profilis, a new Veikla tab unifying purchases/bookings/quad rentals/event tickets/coupons into one timeline, Dokumentai, Komentarai). Extracted the profile/documents/comments tabs out of `RiderPage` into a shared `components/admin/rider-profile-tabs.tsx` so both pages use the same ~150 lines instead of duplicating them. `tsc --noEmit`, full-repo `eslint --max-warnings 0` and `next build` all clean.
- 2026-11-07 Applied the Klientai migration `20261107160000_klientai.sql` to the live project (ADR-0042): a new `klientai` permission with additive RLS on `riders`/`rider_comments`/`rider_documents`/`purchases` and the two rider storage buckets, a nullable `rider_id` on `bookings`/`quad_rentals`/`event_tickets`/`coupons` with read-only `klientai` policies, and a one-time backfill linking every existing contact (12 rows) to a rider by phone/email, creating 2 new ones. No new `customers` table — `riders` (already the Grabby-imported contact list per ADR-0041) is the identity anchor. Security advisor clean; types regenerated, `tsc --noEmit` clean.
- 2026-11-07 Added client-side pagination (25/page, `CaretLeftIcon`/`CaretRightIcon`) to the Naudotojai tab in `/admin/apyrankes`: after the Grabby import it was rendering all ~8,940 rider cards at once. Search still filters the full in-memory list (cheap); only the matched page is rendered. Data is still bulk-loaded into `useAdmin()` for every admin page view, unchanged — see the note on `riders` scale in [[status]].
- 2026-11-07 Imported 8,940 customers from a Grabby CSV export into `riders` (ADR-0041), verified by row count after: `riders.plan_id` is now nullable (imported contacts have no plan/bracelet yet) and a new unique `riders.grabby_id` column makes the import idempotent (`insert ... on conflict (grabby_id) do update`). `Rider.planId` and `PlanBadge`'s prop are now `string | null`. Migration `20261107150000_rider_grabby_import`, applied to the live project; the CSV itself isn't committed.
- 2026-11-07 Added `overflow-y-hidden` to the three horizontally-scrolling `TabsList`s in apyrankes (rider page, plan catalogue, plan picker) so the fixed-height pill never shows a vertical scrollbar, only horizontal.
- 2026-11-07 Regrouped the admin sidebar per the owner's dashboard-merge sitemap (ADR-0040): Apžvalga is now its own ungrouped item, and Rezervacijos, Užimtumas, Keturračiai, Kuponai, Apyrankės and Užklausos moved into a new "Pardavimai" section. `AdminNavGroup` gained `"apzvalga"`; `ADMIN_NAV_GROUPS` entries can now have `label: null` to render without a group header.
- 2026-11-07 Replaced the Pardavimas plan dropdown with `RidePlanPicker`: a 4-column grid of plan cards (name + price) under horizontally-scrolling category tabs, matching the till's own layout. Removed `ride-plan-select.tsx`.
- 2026-11-07 Replaced the rider detail side drawer with a full page, `/admin/apyrankes/[id]` (`RiderPage`), matching the `/admin/pirtis/[id]` pattern: same profile/sales/documents/comments content, a "Visi naudotojai" back link to `/admin/apyrankes?tab=nariai`, and `ApyrankesView` now reads `?tab=` to reopen the right tab on the way back.
- 2026-11-07 Fixed overlapping tabs in the rider sheet (6 tabs) and the plan catalogue (7 category tabs): shadcn's `TabsList` has a fixed single-row height, so `flex-wrap` made extra rows overflow onto the content below instead of pushing it down. Both now scroll horizontally (`overflow-x-auto`, `shrink-0` triggers) instead of wrapping.
- 2026-11-07 Expanded riders into full customer records (phone, additional phone, birthdate, email, profile photo) and added a rider detail page (ADR-0039): Pardavimai (sales history), Aktyvios paslaugos (today's non-subscription purchases), Abonementai (subscription-category purchases), Dokumentai (private file uploads with signed-URL downloads), Komentarai (staff notes), and removing the rider. Every plan sale is now logged in a new `purchases` table. Replaced the four placeholder starter plans with the real 13-item "Plaukimas" price list and added a `category` column to `ride_plans` for the till's other tabs. Migration `20261107140000_rider_profiles`, applied to the live project; two new private Storage buckets (`rider-photos`, `rider-documents`).
- 2026-11-07 Added bracelet pass scanning, ported from a separate `pass-scanner` prototype (ADR-0038): new `/admin/apyrankes` screen (Skenavimas / Pardavimas / Naudotojai / Planai) behind a new `apyrankes` page permission, backed by new `ride_plans` / `riders` / `rider_cards` tables (migration `20261107120000_bracelet_passes`, applied to the live project). `lib/card-scanner.ts` + `hooks/use-card-scanner.ts` is the layout-robust USB IC/RFID keyboard-wedge reader handler. Seeded with four starter plans (Dienos bilietas, 10 kartų, Sezono bilietas, Darbuotojas).
- 2026-11-06 Added 12 px top padding to the mobile activity-tab buttons so their icons clear the border while preserving 44 px targets. Stay variants and nightly rates now show before dates are complete; remaining-unit counts, quantity/selection controls and availability errors appear only after arrival and departure have both been selected. Range behavior, pricing and backend checks are unchanged.
- 2026-11-06 Shortened the home activities heading to “PRAMOGOS IR POILSIS” and its matching secondary navigation label to “Pramogos ir poilsis”, keeping the `/#kryptys` destination.
- 2026-11-06 Made `/kuponai` form-first: the sticky order form is immediately visible, with an editable unverified phone instead of the initial phone gate. Validated submission opens deferred phone verification with the typed number prefilled, then the existing final order action. Signed-token and database phone enforcement (ADR-0018), order pricing, honeypot and payment-arrangement behavior remain unchanged.
- 2026-11-06 Simplified Mini/Midi/Maxi route cards: vehicle quantity and expanded inline Priedai controls appear only after a valid start time is selected. Moved “Bent 3 keturračiai” directly below the vehicle stepper and replaced the accessories popup with shared inline Stepper controls, catalogue prices and an optional extras total. Independent drafts, selected-plan updates, invalid-slot removal and preview-only booking/payment boundaries remain unchanged.
- 2026-11-06 Compacted the mobile reservation view: the main sauna-type filters scroll in one horizontal row, tab buttons retain 44 px targets with less vertical padding, and the mobile dock/sheet hide disabled reservation actions until the selection is ready. The compact plan summary stays visible; removing the last selection hides the actions again. Desktop actions and booking submission are unchanged.
- 2026-11-06 Made home activity-card titles wrap according to the available card width instead of forced line breaks: wide cards keep titles on one line, with two-line notes remaining on the right. Numbered kickers span the full footer row and stay unbroken, including “05 / VANDENLENČIŲ SPORTAS”.
- 2026-11-06 Gave home activity-card titles intentional two-line breaks and kept all notes in two lines in the right-hand column. The mobile gallery heading stays VAIZDAI / IŠ MARSO with controls below it. The public header’s Rezervuok CTA turns white only while the hamburger menu is open, and the secondary menu uses the current home-section labels under Pagrindinis puslapis, retaining its five destinations.
- 2026-11-06 Updated the home arrival block to “06 / KAIP ATVYKTI”, “VANDUO MARSE YRA VOS 20 MIN. NUO KAUNO CENTRO.” and the “TIK 20 MIN.” photo sticker, retaining the aerial image, address, route link and phone.
- 2026-11-06 Renamed the home gallery to “VAIZDAI IŠ MARSO”, with “04 / GALERIJA”, “APŽIŪRĖK PARKĄ.” and one clear caption per photo (park, wakeboarding, Finnish sauna and cabins). Added mouse/pen dragging alongside native touch scrolling, preserving vertical page pan, arrows, counter and reduced motion. Retained the existing higher-resolution aerial image matching the attachment. Increased the FAQ email-link spacing.
- 2026-11-06 Updated the night section’s celebration/event labels, company wording and “Skaičiuoti šventės kainą” link to `/skaiciuokle`. The circular hero CTA now opens `/rezervacija`. Shortened the wake tile title to “WAKE” and split the party/food notes into two readable lines for narrow screens.
- 2026-11-06 Refined the home activity-card labels, titles and notes, including compact sauna capacities, explicit celebration/stay/wake/food descriptions and naturally wrapping single-sentence notes. Hero and activities intro now flow as continuous paragraphs without forced sentence breaks; inactive home category chips have a stronger ink outline.
- 2026-11-05 Updated the home hero park/location copy, sauna photo badge to “MALKINĖ PIRTIS IR SAUNA” and quad title to “KETURRAČIŲ NUOMA.”. The activity filter now reuses the outlined events FilterChip with Visi / Pramogos / Poilsis ir nakvynė / Šventės and counts derived from the cards. Per the owner’s request, this filter row scrolls horizontally instead of wrapping; the exception is limited to the home activity filter.
- 2026-11-05 Replaced the home sauna card’s short tagline with the wood-fired sauna capacity (up to 25 people) and Finnish sauna with a water view capacity (up to 20 people), allowing the longer note to wrap within the card.
- 2026-11-05 Updated home hero and activities copy: “REZERVUOK LAIKĄ MARSE”, “Ką gali rezervuoti?” and “PRAMOGOS, ŠVENTĖS IR POILSIS”, with the requested supporting text about celebrations, activities, food and stays. Existing section links, artwork and CTA styling are retained.
- 2026-11-05 Replaced the home ticker with the four requested Kaunas-centre, events, quad/private-sauna and food/stay messages, retaining the continuous branded-star loop. Joined Žemaitkiemio and k. in the compact address with a nonbreaking space to prevent an orphaned abbreviation on small screens.
- 2026-11-05 Added the activity strip’s outside left/right borders, renamed desktop/mobile plan surfaces to Rezervuoti and removed the photo badge. The shared ServiceGallery now has a compact reservation variant with 44 px photo arrows; activityPhotos combines sauna uploads with the Marse gallery and supplies the desktop panel, mobile sheet and activity-info dialog.
- 2026-11-05 New favicon and app icons from the Vanduo Marse badge: `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`.
- 2026-11-05 Removed `/apie-marsa` (and `TeamSection`) and its nav and sitemap entries. Added the coming-soon gate (ADR-0037): `SITE_GATE=1` shows `/netrukus` (503) on every public page, `/admin` and `/api` stay open, and `SITE_GATE_CODE` adds a preview-code field that lets a browser in for 30 days.
- 2026-11-05 Custom domain: `robots.txt` and `sitemap.xml` (public pages; `/admin`, `/paskyra`, `/embed`, `/api`, payment return disallowed) and `metadataBase`, all from `lib/site.ts` (`SITE_URL`, default `https://www.vanduomarse.lt`).
- 2026-11-05 Merged PR #13 (discount codes and `/admin/nuolaidos`) into `main`.
- 2026-11-05 Added optional pošalmis and clothing quantities through each tour card’s Priedai dialog. Independent accessory drafts and catalogue prices update the selected preview plan and checkout summary; no real booking/payment contract changes. Removed the redundant price note below the three route cards.
- 2026-11-05 Restyled phone/email code verification with LoginCodeStep: centered heading, destination hint and spaced-digit field with a key icon, full-width confirmation, alternate-contact link and resend countdown. Existing one-time-code autofill, digit filtering, 4–10 digit server validation and authentication actions are unchanged.
- 2026-11-05 Replaced inline quad-route disclosures with separate warm-white Mini/Midi/Maxi information dialogs. Each shows its route photo, fuller supplier-paraphrased description, duration, distance, price and practical tour details without changing the plan.
- 2026-11-05 PR #13 review fixes: the discount code goes only with the activities it covers (mixed plans no longer fail), the final submit waits for a running code check, a 0 € total is filed unpaid instead of opening Stripe, used codes cannot be deleted (switch them off), admin toggle/delete wait for the server, preview rounding uses integer cents, stricter value and service validation, dates show the year, a11y on the service chips and end date.
- 2026-11-05 Discount codes (ADR-0036): "Nuolaidos kodas" in the /rezervacija checkout (live check, error on the field, discount and new total in the summary, "Mokėti" uses the discounted total) and a new `/admin/nuolaidos` screen (create, edit, switch off, delete, uses and discount total) behind the `nuolaidos` page permission. Every booking RPC prices the code again and stores it on the row; Stripe charges the stored totals. Migration `20261105150000_discount_codes` applied to the live project together with the pending `20261104190000` and `20261104191000`.
- 2026-11-05 Restyled ReservationAccountDialog with the activity dialog's warm-white surface, fixed heading, labelled contact/plan sections and separated footer. Phone/email verification, focus return, dismissal guards and final submission paths are unchanged.
- 2026-11-05 Split the shared quad tour preview into separate Mini/Midi/Maxi cards after the date, matching the stay-card layout with three columns from lg. Each card owns its information/photo disclosure, time and editable quantity. Unselected drafts are independent; one picked tour stays synchronized with the plan. Pricing, preview guards and backend paths are unchanged.
- 2026-11-05 Moved final phone/email registration into the dust/ink ReservationAccountDialog opened by either plan action. The activity selection stays visible behind it; summary, existing OTP account form and final submit share the popup. Dismissal creates no reservation, and the existing cash/online routes and local-only quad preview guards are unchanged.
- 2026-11-05 Centered both reservation-plan action labels consistently while keeping the primary action arrow at the right.
- 2026-11-05 Added shared Rezervuoti and outlined Atsiskaitysiu vietoj grynais actions to desktop/mobile plans. Both open verified phone/email registration directly; cash uses the existing unpaid request path without Stripe. The choice stays in UI state (no universal persisted cash-method field), and supplier quad previews still finish locally.
- 2026-11-05 Removed the intermediate plan confirmation from /rezervacija at the owner’s request. Toliau now opens the final phone/email registration step directly, headed Užbaik rezervaciją. Real submit/payment and local-only quad preview completion remain unchanged.
- 2026-11-05 Removed the additional-activities popup from /rezervacija. Selection now opens one plan confirmation before the final phone/email account step, without a repeated review screen. Plan edits require confirmation again. Real picks retain existing submission/payment; supplier quad previews finish locally without requests or payment.
- 2026-11-05 Unified the quad preview into one date-first card in /rezervacija and /keturraciai: Mini/Midi/Maxi, route details, time and one vehicle quantity. One or two riders share the same package rate. Preview plans show combined totals but cannot enter real booking or payment actions.
- 2026-11-05 Added an isolated interactive /keturraciai design preview with Mini/Midi/Maxi routes, source package prices, route-first choices, Marse location, gear and FAQ. Downloaded all 15 unique quad photos from the supplied Ciongo page with a replacement manifest. No route booking or schema changes, per the owner’s preview-only clarification.
- 2026-11-05 Quad reservations choose start and duration before adding vehicle quantities. Time choices are visible immediately and quantity limits reflect availability for the chosen slot.
- 2026-11-05 Moved date and time into each activity entry in the plan, review and confirmation. Stays show arrival and departure, and the plan no longer has a shared facts section.
- 2026-11-05 Added “Keisti laiką” to private sauna entries in the desktop plan and mobile sheet. Available times reuse the booking card rules and stay synchronized with it.
- 2026-11-05 Merged PR #12 (booking email notifications) into `main`.
- 2026-11-05 Every staff booking email (new request, paid) is also sent to marketingas@vanduomarse.lt (`STAFF_BOOKING_COPY`); double-charge alerts are not.
- 2026-11-05 Confirm/cancel and payment emails take the address from the account's confirmed email (`auth.users`), not the request row; migration `20261105120000_notify_account_email`, applied to the live project.
- 2026-11-05 PR #12 review: customer emails go only to account-confirmed addresses (the anonymous phone-code forms get SMS only); the webhook reads the paying account's confirmed email through `payment_notify_email` (after `complete_payment`); Resend and Twilio calls time out after 8 s; amounts in emails use a decimal comma; the `/admin` link is left out without `SITE_URL`.
- 2026-11-05 Calculator inquiries no longer email or text the customer's typed address and phone (no verification on that form); staff are still alerted and reply themselves.
- 2026-11-05 Staff booking emails are routed per service: sauna and quads → renginiai@vanduomarse.lt, stays → miegas@vanduomarse.lt; other requests → `STAFF_NOTIFY_EMAIL`. Payment emails follow the reference prefix (ADR-0028).
- 2026-11-05 Booking email notifications through Resend: customers with an account-confirmed email get "užklausa gauta", "patvirtinta/atšaukta" and "apmokėjimas gautas" next to the SMS; staff get new-request, paid and double-charge emails at the service inbox (`STAFF_NOTIFY_EMAIL` only for other requests). New `lib/notify.ts` dispatches every channel; `lib/email/resend.ts` is the one Resend sender (coupon email now uses it). New env `NOTIFY_FROM_EMAIL`, `STAFF_NOTIFY_EMAIL`, `EMAIL_IN_DEV`. Migration `20261105120000_notify_account_email` (entry above). ADR-0028.
- 2026-11-04 Moved removal into the selected sauna card and Toliau into the desktop and mobile plans. Removed the selection footer divider and the Bendra filter.
- 2026-11-04 Private sauna reservations choose only a time. Ticket quantity remains available for public sessions.
- 2026-11-04 Put published sauna sessions first in reservation and grouped each private program
  into one card with a time picker. Session cards show their named attendant and live seat
  count. Added database checks that reserve session time at Pirtis Marse and let the combined
  flow sell tickets to legacy sauna sessions. Staff can set sauna event duration in minutes.
- 2026-11-04 Staff get the new-request SMS for every web reservation, including those from email-only accounts (only the customer text needs a phone).
- 2026-11-04 Added sauna filters that count matching unblocked time slots for the selected day.
  Session categories use stable published program IDs. Seansai includes family and custom
  programs, and Privati offers a Su pirtininku filter alongside the existing hourly add-on.
- 2026-11-04 Added direct two-click stay dates to the Nakvynė strip and calendar. Pick arrival
  first, then a later departure within 14 nights. An earlier click restarts a pending range,
  and the next click after confirmation starts a new one. Room availability and prices appear
  after both dates are selected. Departure can extend past the arrival cutoff and leaves the
  other activities on the shared arrival date.
- 2026-11-04 Grouped the calculator's food controls into Maitinimas, Gėrimai and Aptarnavimas
  tabs and made the pirtininkas option visible before adding the sauna. The stay starts on the
  event date, with the night count and departure above the cabin cards. Double and four-person
  cabins can be priced together using the same nightly unit rates as the reservation.
- 2026-11-04 Added quantity editing and activity removal to the desktop and mobile reservation
  plans. Each selected quad type has its own control. Sauna headcount and stay units are editable,
  and the total updates as the plan changes.
- 2026-11-04 Enabled direct number entry in the event calculator. Moved day type next to the
  calendar and grouped guest counts under Svečiai. WAKE, sauna, quad tours and cabins now use
  matching option cards, with the cabin card visible as soon as Nakvynė opens.
- 2026-11-04 Removed the shared guest field from the reservation flow. Sauna cards own their
  group size. Quad rentals use vehicle quantities and send one driver per quad.
- 2026-11-04 The event calculator uses the reservation date strip and calendar, with optional
  dates and future months available for inquiries. Coupon steps use small ink numbers. Public
  accents share the brand coral #ED5257.
- 2026-11-04 Reservation quantities start at one and the minus button is disabled at the
  minimum. Each quad type has its own add and remove action.
- 2026-11-04 Unified home photo label backgrounds, used a coral accent in the FAQ heading,
  and kept the arrow only on the footer’s back-to-top link. Named the two cabin options
  “Dvivietis namelis” and “Keturvietis namelis” in the reservation flow.
- 2026-11-04 Payment hardening (security review): one payable Checkout Session per payment, conditional session attach, webhook matches by payment id and flags double charges for refund. Migration `20261104180000` applied to the live project.
- 2026-11-04 The account page is now titled and linked "Mano rezervacijos" (reservations first, account details beside them); the code step's buttons wrap so the resend countdown label fits.
- 2026-11-04 Added the account page `/paskyra` (code sign-in, name, own reservations with status and payment, sign out; nav link "Paskyra") and migration `20261104170000_customer_own_requests` (customers read only their own rows). Extracted `LoginForm`; fixed an uncontrolled-to-controlled input warning when signing out at checkout.
- 2026-11-04 Applied migrations `20261104150000_customer_accounts` and `20261104160000_stripe_payments` to the live project; a signed-in customer's request must now carry only their own confirmed phone and email.
- 2026-11-04 Removed `components/reservation/reservation-gate.tsx` (the phone gate on `/rezervacija`); `proxy.ts` now also refreshes customer sessions on `/rezervacija`.
- 2026-11-04 `/rezervacija` no longer asks for a phone code before booking (ADR-0027). After the plan, a
  "Prisijungimas" step signs the visitor in or creates an account with a phone or email one-time code
  (Supabase Auth), then payment follows; requests and payments are tied to the account. Needs migration
  `20261104150000` and Supabase Auth settings (phone provider, email code template, custom SMTP).
- 2026-11-04 Added Stripe payment to `/rezervacija` (ADR-0026): the review step becomes "Mokėti N €",
  all requests of the reservation are filed and paid in one hosted Checkout, the webhook confirms,
  expires or refunds, and `/rezervacija/mokejimas` shows the result with "pay again". Admin lists and
  sheets show a payment badge and a refund reminder. Checkout relies on the Stripe SDK's own retry idempotency. Off until Stripe keys are set; needs migration `20261104160000`.
- 2026-11-04 Applied the stay-units, mixed-quad-rentals and program-ticket migrations to the live
  database and repaired the migration history, so the reservation page's stay and quad bookings work in production.
- 2026-11-04 Moved hero orbit centering and sizing into the shared artwork utility so
  production builds place the guide at the center of the first viewport.
- 2026-11-04 The reservation summary shows quads first, followed by sauna and overnight stay.
- 2026-11-04 Quad rental on the reservation page accepts quantities of both quad types for one
  shared time and duration. The plan and staff view show each type under one rental reference.
- 2026-11-04 Every reservation activity tab has an independent information button. Stay cards
  select quantities of two-person cabins, four-person cabins or camper pitches. The plan prices
  each unit for each night, and staff availability counts all units in the single booking.
- 2026-11-04 The reservation strip scrolls each month title with its dates. At the left edge,
  the current title stays in view until the next month pushes it out. The view toggle stays at
  the right of the same row.
- 2026-11-04 Extended the reservation date strip and live availability to 60 days. The strip
  heading follows the first visible dates. The calendar shows the year and can browse 12 months,
  with dates beyond the booking cutoff disabled. Sauna session cards label the count “Kiekis”.
- 2026-11-04 Clicking the selected cabin or camper type again removes the stay from the plan.
  Clicking the other type switches the stay.
- 2026-11-04 Made the desktop reservation plan photo fill the card width while keeping its
  192 px height cap.
- 2026-11-04 Moved the active month and view toggle into one reservation date toolbar and removed
  the “Diena” heading. The active activity tab has an info button, and both plan photos follow
  the active tab. The desktop photo is shorter and the extras dialog keeps the aerial photo.
  Sauna cards have their own editable group count and a separate select button. The selected
  card edits the shared count, and the other activities use the shared stepper. Published sauna
  sessions show remaining seats against total capacity from Supabase. Private cards show the
  maximum group size. Reduced the footer gap between contact titles and links by 4 px.
- 2026-11-04 Added a thumbnail at the left of the mobile reservation plan bar. It follows the
  active activity tab and reuses the corresponding landing service photo.
- 2026-11-04 Brought email and phone text closer together across the public footer contact grid,
  with a separate 44 px tap target for each link.
- 2026-11-04 Set the decorative hero ring layer behind the photo to 50% opacity.
- 2026-11-04 Placed the centered hero rings behind the clipped photo and above the grid so they
  show around the photo cutout.
- 2026-11-04 Matched the hero rings’ center and scale to the AD Night reference. The dashed guide
  centers on the first viewport and scales with its width in landscape or height in portrait.
  Portrait turns the SVG 90° and uses a 1.5× span from 768 px wide.
- 2026-11-04 Reworked the hero ring motion based on the AD Night reference. The large rings
  orbit clockwise, while each small ring travels counterclockwise around its moving large ring
  and the dashed center turns counterclockwise. The loops share the same 54-second cycle.
- 2026-11-04 Matched the calculator subsection labels to the small reservation labels.
- 2026-11-04 Extended `/rezervacija` to 30 days of availability. The people field accepts digits
  only, the intro is removed, and sauna sessions use event-style cards. Phones and tablets show a
  live plan bar that opens the full summary.
- 2026-11-04 Added month labels to the reservation date strip and direct entry to the group-size
  stepper. The plan card and extras dialog now use a Vanduo Marse aerial photo.
- 2026-11-04 Added thin vertical separators between the activity tabs on `/rezervacija`.
- 2026-11-04 Added the supplied `animacijai.svg` as `public/landing/hero-orbits.svg` at the lower
  edge of the home hero photo, beneath the hero content. Its two motifs rotate together counterclockwise in a 54-second loop inspired
  by AD Night. The artwork stays static with reduced motion.
- 2026-11-04 Removed the two orbit outlines and the hairline above the contact strip in the home
  hero. The coral ticker has a border along its top edge only.
- 2026-11-04 Organized the calculator into “Vieta ir laikas”, “Maistas”, “Pramogos” and
  “Nakvynė”, each with a small neutral index. Food service and hospitality sit together in
  “Maistas”, and activity choices sit in “Pramogos”. Light public backgrounds use `#eed9ce`,
  and supporting copy uses the shared neutral `text-copy` color.
- 2026-11-04 Kept the activity card arrows visible by giving their photos square corners.
  The circular hero CTA now responds to hover immediately with a short motion separate from its
  entrance. The hero info strip uses “Sausinės g. 20, Žemaitkiemio k.” and a number-only phone
  link. On tablets and desktops, the address, centered phone and scroll link fit in one row.
  On phones, the address and number stack on the left and the scroll link sits on the right.
- 2026-11-04 Changed the second homepage ticker phrase to “VOS 20 MINUČIŲ NUO MIESTO CENTRO.”
- 2026-11-04 Added the “Apie Marsą” page to the main navigation. Its “Komanda” section
  uses portrait cards for sauna practitioners, the wakeboarding park lead and the marketing lead.
  The sauna cards link to public sauna booking so visitors can continue to available sessions.
- 2026-11-04 Restored the home hero info strip with “Sausinės g. 20, Žemaitkiemio k., Kauno r.”,
  a centered “Skambinkite - +370 640 57504” phone link and a right-aligned “Leiskis žemyn” link.
  The hero and ticker fit in the first desktop viewport, and the circular CTA keeps two proportional
  lines at each size. Removed long dashes from the hero and ticker copy.
- 2026-11-04 Restored “ŽEMĖ TA PATI. JAUSMAS — KITAS.” as a plain text line above the home hero headline.
- 2026-11-04 Home FAQ accordion: questions bold 14 px (16 px from `md`), answers 14 px, so question and answer no longer read as the same text.
- 2026-11-04 Home hero: removed the top kicker ("ŽEMĖ TA PATI. JAUSMAS — KITAS.") and the bottom info bar (Kauno rajonas / address / "Leiskis žemyn").
- 2026-11-04 Phone gate: env-flagged skip for live testing (`PHONE_VERIFICATION_SKIP=1`, migration `20261104100000_phone_verification_skip.sql`, ADR-0023). Off by default.
- 2026-11-04 Consistency sweep of all public pages + embeds + admin login: shadcn buttons/titles/tabs/table heads now bold; day-picker cells grow to fit "Uždaryta" (`min-w-14`).
- 2026-11-04 UI consistency pass: Termina body, role text steps, weights, border tokens.

---
tags: [meta, changelog]
updated: 2026-11-05
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`. Record *why*, not just
*what*; the diff already covers *what*.

## 2026-11-04 — Unslop polish pass

- `/rezervacija` plan panel: removed the filler "Trumpai ir aiškiai" row with its decorative arrow and the period on the "Tavo pasirinkimas" headline.
- New `text-rust-ink` (`--raw-coral-ink` #a8282d, 5:1 on blush) for small coral text: notices and errors in the reservation flow and phone gate used `text-rust` / `text-destructive` at ~2.7:1. Extras popup copy switched to the informal "nori".
- Landing "Ką šiandien veikiam?": the Pirtis, Ciongo (quads) and Rytas Marse (cabins) tiles now link to `/rezervacija?veikla=pirtis|keturraciai|nakvyne` instead of opening the service drawer; the page opens that activity tab. Party, wake and food tiles still open their drawer (no reservation tab for them).
- Extras popup ("Tą dieną turime ir daugiau"): bold display title so it outranks the option names, option names one step smaller, padding 20 px, and the offer copy in `lib/reservation.ts` switched to the informal imperative (Pasilik, Pavažinėk, Pasikaitink) to match the rest of the flow.
- `/renginiai` restyled to the reservation / calculator look: `.theme-reservation`, `BookingHeader`, two columns with a sticky `EventsAside` (link to the calculator + phone), hairline `border-line` filter chips and event cards on `bg-card`, quiet outlined category tags, `ArrowButton` for registering. `PageIntro` is no longer used there.
- Quad start times that fall in the visitor's own sauna booking now say "Šiuo metu būsite užimti" instead of "Jūsų plane"; disabled `ChoiceTile`s strike through only the time, so the reason stays readable.
- Removed the `/pirtis`, `/miegas` and `/keturraciai` pages (now 404). `/rezervacija` replaces them: header and menu show one "Rezervacija" link, event tickets and tour CTAs point to `/rezervacija?veikla=…`, admin saves revalidate `/rezervacija`. The `/embed/pirtis|miegas|keturraciai` widgets are kept for the WordPress plugin.
- `/renginiai` cleanup: repeated utility strings extracted into `Panel`, `Eyebrow`, `PhoneHelp` and `FilterChip`; ad-hoc `text-ink/60|70` became the `text-muted-foreground` token and the `[4rem]` / `[4.5rem]` grid columns became `w-16 md:w-18`. `PlanPanel` uses `PhoneHelp` too (its decorative arrow dropped).
- One header for the whole public site: new `MainHeader` replaces `PageHeader` and `LandingHeader`. Same logo (links to `/`), links (Rezervacija, Renginiai, Skaičiuoklė, Dovanų kuponai), coral "Rezervuok" CTA to `/rezervacija` and menu on the home page and every inner page; the home anchors moved into the menu (`SECTION_LINKS`). `LANDING_NAV`, `BOOKING_LINKS` and `PAGE_NAV` are gone.
- `/kuponai` restyled like the reservation / calculator pages: `.theme-reservation`, `BookingHeader`, two columns (steps + coupon cards left, sticky order form right). `CouponIntro` replaced by `CouponSteps`; coupon cards use `OptionCard`; order form and confirmation use `Panel` / `Eyebrow`, errors `text-rust-ink`, prices Termina instead of the wordmark face. The `/embed/kuponai` widget renders the shop without header or steps.
- `/rezervacija` header: removed the "Tavo laikas Marse" kicker row and its tagline (the `kicker` / `tagline` props of `BookingHeader` are simply not passed there).
- `/renginiai` header: removed the "Renginiai Marse" kicker row.
- `/renginiai` filter row: removed the top / bottom hairlines and vertical padding around the category chips.
- `/kuponai` header: removed the "Dovanų kuponai" kicker row, so the booking-style pages (rezervacija, renginiai, kuponai, skaiciuokle) share the same breadcrumb + title + intro header.
- `/rezervacija` date + guests block (`WhenStep`): removed the top / bottom hairlines and the 24 px vertical padding.
- `/rezervacija`: under the activity tabs a short description of the chosen activity and a "Sužinoti daugiau" button that opens a dialog with the details (saunas and programs / cabin and camper prices / quad types and rental conditions). All figures come from the live data, nothing hard-coded.
- Extras popup ("Tą dieną turime ir daugiau") redesigned: square dialog with the park photo behind the title under an ink scrim, one row per free activity (icon, name, offer line, "Peržiūrėti" link, hairline dividers), and the dark "Ne, tęsti" button in the footer. `ExtrasOfferDialog` takes a `photo` prop (the same cover as the plan panel).
- "Sužinoti daugiau" dialog on `/rezervacija` now opens with a photo carousel (the landing `ServiceGallery`): the saunas' uploaded photos for Pirtis, the landing galleries for Nakvynė and Keturračiai; the details scroll under it. New `DialogPhotoClose` shared with the extras popup.
- Footer contacts: each contact is now a `ContactItem` with a hairline on top, the name, and email and phone stacked in a flex column (no `<br>`), with a coral hover on every link; row gap 32 px.
- Home "Ką šiandien veikiam?" section: removed the "01 / PASIRINK KRYPTĮ · VIENA VIETA. DAUG SCENARIJŲ." kicker row and the top margin it left on the heading.
- Home activity filter row: removed the top / bottom hairlines.
- Home party drawer: "Apskaičiuok šventės kainą" is now a link to `/skaiciuokle` (the `service.cta.href`) instead of opening the calculator drawer. `openCalculator` / `CalculatorDrawer` are no longer used by anything.
- Home night section: "Planuojam šventę" now links to `/skaiciuokle` instead of opening the party drawer.
- Home location block: the "Rodyti maršrutą" button and the phone number sit in a flex row with a 32 px gap (they touched before) and wrap on phones; phone gets a hover colour.
- `/skaiciuokle` chapters (`CalculatorGroups`): now independent accordions (`type="multiple"`, first open by default) and the "scroll the opened chapter into view" effect is gone. The old single-open accordion collapsed the chapter above while the new one grew, shifting the page under the cursor, then scrolled again. `AccordionContent` (shared, also the home FAQ) now uses 250 ms with the `ease-out-strong` curve.
- One footer for the whole public site: the home page now uses `SiteFooter` (contacts grid, "Susitinkam Marse" line, link row) like every inner page; `LandingFooter` and its "Rezervuok savo Marsą" tagline block are gone.
- Dropped negative tracking from small bold labels (option cards, session rows, space / stay pickers, preset chips, month title); moved the half-step paddings (`px-4.5`, `py-3.5`) to the 4 px grid; `design-system.md` now says `text-micro` is 11 px. Brand look (bold uppercase Termina) deliberately kept.

## 2026-11-04 — Program sessions can only be booked through the program function

- **What:** security review finding: `create_event_ticket` priced any published event at `events.price` per person, including program sessions, bypassing the child price and using a stale price after a program change. New migration `20261103213000_program_sessions_only_via_program_ticket.sql` adds `program_id is null` to its event lookup. **Written, committed, not yet applied to the live project** (apply with the Supabase MCP or `supabase db push`); no program sessions exist yet, so nothing is exposed meanwhile.

## 2026-11-04 — Calculator: event types no longer preselect anything

- **What:** choosing an event type used to select the venue, the day type, catering and services as well. `PRESETS` now carry only a typical group size (`apply: { adults, kids }`); `applyPreset` sets the type marker and those guest numbers and leaves every other choice as it was (a venue picked first stays picked). The typical price per guest still shows once a type is chosen. The hint under the types was reworded.

## 2026-11-04 — Calculator: opened chapter scrolls into place

- **What:** opening a calculator chapter collapses the one above it and used to leave the page scrolled past the new chapter. `CalculatorGroups` now scrolls the opened chapter's title to just under the header (the page's own 112 px `scroll-padding-top` plus a 16 px `scroll-mt-4`) after the collapse animation, smoothly unless reduced motion is on; nothing scrolls on first load.

## 2026-11-04 — Calculator: choices can be deselected

- **What:** pressing a selected event type, day type, venue or catering option again clears it (back to nothing chosen). Deselecting an event type only drops the type marker and keeps the values it filled in.

## 2026-11-04 — Calculator: grouped chapters, event date, token cleanup

- **Groups:** the calculator is three chapters (chapter numbers are as large as the titles and coral) (`CalculatorGroups`): Proga ir vieta, Skoniai ir veiksmas, Pasiliekam Marse (the stay accordion is now the third chapter; spelled as in the design reference). One chapter open at a time, the first by default.
- **Date:** `EstimateInput.date` and a date picker in "Svečiai ir data". Choosing a date sets the day type (Mon-Thu workday, Fri-Sun evening / weekend; `dayTypeOf`), the day tiles can still change it, presets keep the chosen date, and the inquiry now uses this date instead of its own field.
- **Cleanup:** `StepLabel` is 24 px bold and the calculator chapter sub-labels 18 px bold; `Stepper`, `ChoiceTile` and every reservation / calculator component use the `border-line` token instead of `border-ink/NN` opacities (the `data-slot` CSS override is gone) and `font-bold` instead of the unshipped medium weight. Shared steppers and tiles on the other booking pages now have the lighter `--line` border and bold values. The calculator header no longer has the kicker row (`BookingHeader` `kicker` is optional).

## 2026-11-04 — Calculator: "Pasiliekem Marse" accordion

- **What:** new last section of `/skaiciuokle` (and step of the home drawer): an accordion where Pirtis, Keturračiai and Nakvynė each expand into a few choices (sauna hours + pirtininkas, quad riders, cabin guests + nights) that feed the estimate and the inquiry. The same controls were removed from "Paslaugos ir pramogos" so nothing appears twice. No real booking is made there; it only adds to the quote.

## 2026-11-04 — Calculator: nothing preselected

- **What:** `EstimateInput.space`, `.day` and `.catering` are now `null` until the visitor chooses (`DEFAULT_INPUT`); "Be maitinimo" (`"none"`) stays an explicit choice. `estimate()` skips the space, service fee, minimum bill and catering lines while they are unset and warns when a venue is picked without a day; `perGuest` is null at 0 €. The page opens with an empty estimate ("Pasirink renginio tipą ar erdvę…", 0 €), `SpacePicker` shows "nuo X €" until a day is chosen, and "Siųsti užklausą" appears only once a venue and a day are chosen. Event-type presets still fill everything. The guest steppers keep their starting numbers (20 adults).

## 2026-11-04 — /skaiciuokle restyled like the reservation

- **What:** the calculator page now uses the reservation's design: `.theme-reservation` scope (softer coral and slate teal, hairline borders, washed fields), the new shared `BookingHeader` instead of the dark `PageIntro` band, a two-column layout (header and questions left, sticky estimate right at `lg:top-32`), sections separated by hairlines, `PresetPicker` / `SpacePicker` / `OptionToggle` / `EstimateSummary` restyled (light borders, bold title-case options, beige text on ink). The reservation page now uses `BookingHeader` too. The home calculator drawer shares the restyled components.

## 2026-11-04 — /rezervacija restyled to the client's booking design

- **What:** measured the reference page's computed styles (Termina 400/700, palette `#382E39` ink, `#DD5D58` coral, `#EED9CE` beige, `#2F545B` slate teal, 1px borders at 19% ink, square corners, white wash on panels and fields) and applied them to `/rezervacija` only through a new `.theme-reservation` scope in `globals.css` (design-system note updated). Components: bold title-case card titles with tight tracking, smaller supporting text, light borders, text on ink in beige (`text-dust`), calendar in a washed panel with slate-teal weekday labels, side panel with beige image tag and a "Lengviau pasikalbėti?" phone line. Page header: breadcrumb, water-dot kicker ("Tavo laikas Marse" / "Mažiau derinimo. Daugiau patirties."), big title, loose slate-teal intro.
- **Kept:** the site-wide palette elsewhere; the earlier layout choices (tabs on top, two columns, no step bar). Font sizes are slightly larger than the reference's 8-12 px for readability.

## 2026-11-04 — /rezervacija: sauna and quads can't overlap in time

- **What:** a sauna in the plan (say 12:00–15:00) occupies those hours: the quad start tiles for 12:00, 13:00 and 14:00 are disabled ("Jūsų plane"), earlier starts are shortened to end before 12:00, and longer durations that would run in are disabled. The reverse holds too: quads in the plan grey out the sauna seansai that overlap them ("Kertasi su jūsų planu"), including scheduled program sessions. Helpers: `planHours` and a `busy` argument on `planSauna` / `planQuads` / `sessionRows`; `planAll` plans each pick without the other first, then again with the other's hours. `StartGrid` / `DurationGrid` take an optional `busy`. Stays have no clock time and never conflict.

## 2026-11-04 — /rezervacija: plan timeline and calendar view

- **Plan overview:** the side panel lists the plan as a timeline ("Dienos planas"): lines ordered by start time (stays last), activity icons on a vertical line with arrows between them (`PlanLine.startMin`, sorted in `describePlans`).
- **Dates:** new `DayCell` (today dot, quieter style when nothing is free) and a "Juosta | Kalendorius" switch: the strip, or a month calendar (`MonthCalendar`) with the same cells and availability icons. The booking pages keep `DayPicker`.

## 2026-11-04 — /rezervacija: "we also have quads" popup

- **What:** pressing Toliau on the selection step opens a dialog when other activities are still free that day and not yet in the plan ("Tą dieną turime ir daugiau": quads before the sauna, a cabin for the night, ...). Each offer has "Peržiūrėti" (jumps to that tab, stays on step 1); "Ne, tęsti" continues to the contact step. Each activity is offered at most once per day (so adding quads later still offers the sauna if it was never offered), never when nothing else is free. With quads in the plan the sauna line reads "prieš keturračius ar po jų". `ExtrasOfferDialog`, `extraOfferText` in `lib/reservation.ts`.

## 2026-11-04 — /rezervacija: no heading above the selection step

- **What:** the icon legend under the day strip, the numbered step bar (`StepNav`, now deleted), the "Seansai" label above the Pirtis timetable, the "01 / Tavo pasirinkimas — Ką veiksi?" heading and the "…: įtraukta į planą" status line are removed (the coral dot on the tab and the side panel already show it); the selection step starts straight with the activity's choices. Contact and review keep their headings.

## 2026-11-04 — /rezervacija: Pirtis types and times merged into one seansai list

- **What:** the Pirtis tab no longer has program cards plus a separate start-time grid. It lists the day's **seansai** in one timetable (like a class schedule): scheduled program sessions, each open start of the private programs, and each open start of hourly hire, earliest first. Picking a row is picking the type and the time at once; family sessions then ask for children, hourly hire for duration and extras. `ProgramOptions` is removed; `lib/sauna-programs.ts` gains `programRateLine`.

## 2026-11-04 — /rezervacija: one two-column layout, sticky plan overview

- **What:** the plan overview is now a sticky right column that starts level with the page title; the title, intro, tabs, date and guests, stepper and step content all stack in the left two thirds. `ReservationFlow` and `ReservationGate` take a `header` node from the page (the gate shows it above the phone card, so the title is visible before verification). `WhenStep` stacks the day strip and the guests stepper.

## 2026-11-03 — /rezervacija: choices visible without selecting

- **What:** the "Pridėti: …" gate card is gone. Each tab shows its choices (sauna programs and hourly hire, quad types, stay types, with descriptions and prices) immediately; choosing one adds the activity to the plan and then shows the follow-up options (sessions, start times, duration, extras, cabin size, nights). The notice ("Pasirink seansą.") only appears once an activity is in the plan; "Pašalinti iš plano" removes it; the button sits below the options, the status line stays on top.

## 2026-11-03 — /rezervacija layout: tabs and date on top

- **What:** the activity tabs (Pirtis / Nakvynė / Keturračiai) now sit above everything, followed by the date strip and guests, then a three-step form (Pasirinkimas, Kontaktai, Peržiūra). The "Data ir svečiai" step is gone; tabs and date stay visible on every step, and clicking a tab returns to the selection step. `ActivitiesStep` takes the chosen `tab` as a prop; `ACTIVITY_TAB_ORDER` lives in `lib/reservation.ts`.
- **Fix:** `DayPicker` buttons are `relative`, so the screen-reader text of the availability icons is clipped by the scrolling strip instead of widening the page (it caused horizontal scroll at 375 px).

## 2026-11-03 — Sauna programs in admin and on /rezervacija

- **Admin:** `/admin/pirtis` has a "Programos" card (`ProgramsCard`, `ProgramDialog`, `program-schema.ts`): create, edit, hide, delete programs; the event dialog gets a "Pirties programa" picker for `pirtis` events (the price then follows the program and the field is locked). Data flows through `AdminData.programs`, `saveProgram` / `deleteProgram` (permission `pirtis`) and `ManagedEvent.programId`.
- **Public:** `/rezervacija` Pirtis tab shows a card per active program plus "Pirtis valandoms". A session program lists that day's scheduled sessions (seats, children stepper for the family program) and files through `createProgramTicket`; a private program shows its own start grid and files through `createProgramBooking`. Program sessions no longer appear in the old `/pirtis` events tab (their price needs the adults/children split). Helpers: `lib/sauna-programs.ts`, `planSauna` modes in `lib/reservation.ts`.
- **Not verified:** the admin screens (staff login needed), the session booking path (no program sessions exist yet; staff create them in Renginiai), and any real submit.

## 2026-11-03 — Sauna programs migration applied

- **What:** `supabase/migrations/20261103180450_sauna_programs.sql`: table `sauna_programs` (session and private programs, per-person / adult+child / per-group pricing, RLS on the `pirtis` permission), `events.program_id`, `bookings.program_id`, `event_tickets.children`, RPCs `create_program_ticket` and `create_program_booking`, and the six programs from the client design as reference data. See ADR-0022.
- **State:** **applied to the live Vanduo project** (`mwngljhcvqkvncwbmgeo`) through the official Supabase MCP on 2026-11-03; the six programs are in the table. The local file was renamed to the version the MCP recorded (`20261103180450`). `lib/supabase/database.types.ts` regenerated (additive). Security advisors show nothing new beyond the by-design anon-callable booking RPCs. App code for programs (admin editor, public cards) is not built yet.
- **Ledger caveat:** the remote history still lacks `20261030100000` (saunas) and `20261030120000` (phone verification); their objects exist. Run `supabase migration repair --status applied` for those two before the next `supabase db push`, or a push will try to re-run them.

## 2026-11-03 — Combined booking page `/rezervacija`

- **What:** new `/rezervacija` route: one form for a whole visit. Step 1 picks
  day, start hour and group size; step 2 picks any mix of sauna, quads and a
  stay, each with its variants (sauna + length + extras, quad type + count +
  length, cabin size / camper + nights); step 3 shows the plan and takes the
  contact. Components in `components/reservation/`, rules in
  `lib/reservation.ts`. See ADR-0021. The separate `/pirtis`, `/miegas` and
  `/keturraciai` pages are unchanged.
- **Restyle (same day):** layout follows the live-site booking design: big title, 4-step nav, tab row, radio option cards and a sticky side panel with photo and running total (no dark intro band or gallery). Steps are now Data ir laikas, Pasirinkimas, Kontaktai, Peržiūra.
- **Start time per activity:** step 1 is now only date and guests (step "Data ir svečiai"). The start hour moved into the sauna and quad options in step 2 (`startHour` in `SaunaPick` / `QuadPick`), because each has its own free hours; a stay needs none. Tabs share the row width equally.
- **Availability icons:** each day cell shows sauna, stay and quad icons (`DayPicker` `icons` prop, `dayAvailability` in `lib/reservation.ts`): dark when something is still bookable for that day and group size, faint when not. Re-evaluated when the group size changes.
- **Not done:** gift coupons (single-service) are not accepted on this page;
  `/embed/rezervacija`, header/menu links and sitemap entry are not added yet.

## 2026-11-03 — Dev server reachable from the Tailscale host

- **What:** `next.config.ts` sets `allowedDevOrigins: ["100.66.120.126"]`, so
  opening the dev server from that address no longer blocks `/__nextjs_font/*`
  and other dev resources. Dev-only; no effect on production builds.

## 2026-11-03 — Homepage invitation copy

- **What:** changed the hero headline to "UŽSUK Į MARSĄ." and aligned the
  homepage title with it, using the requested invitation to visit the park.

## 2026-11-01 — Docs sweep after the redesign

- **What:** removed references to deleted components from `utils.md` and
  `design-system.md`; `routing.md`, `README.md`, `AGENTS.md` (Map) and
  `folder-structure.md` now describe the new home page, `components/landing/`,
  the shared shell and `app/actions/`; `Wordmark` is marked unused;
  `updated:` dates refreshed.

## 2026-11-01 — Sticker dock removed

- **What:** deleted `StickerDock` (the fixed bar of zone stickers) and its
  mount in the root layout. The `public/brand/sticker-*.svg` files stay in the
  repo, unused. Nothing sits over the bottom of the page any more, so the
  footer's last row is never covered.

## 2026-11-01 — Gallery sizes and image quality

- **What:** `BentoGallery` served small, blurry versions (`sizes` said 50 vw / 12 vw)
  and squeezed a 2x2 grid into a phone. `sizes` now match the real tile widths,
  photos render at `quality={90}` (`images.qualities: [75, 90]` in
  `next.config.ts`, which Next 16 requires), the Unsplash stand-ins are
  requested at 1800 px / q90, and phones get one wide photo plus a thumbnail row.
  The drawer and home galleries use quality 90 too.

## 2026-11-01 — Type sizes: micro for labels only

- **What:** `--text-micro` is now 11 px (was 10) and reserved for uppercase
  labels. Sentence-like text that used it (activity card notes, gallery
  captions, footer link row) moved to `text-xs`; the hero's kicker and bottom
  strip go to `text-xs` from `md`. A scan of the home page and `/pirtis` finds
  no sentence under 12 px on desktop.

## 2026-11-01 — Phone sizing of drawers and booking forms

- **What:** below `sm` the nested paddings shrink (drawer `p-4`, card `px-4`),
  the drawer titles step down (`text-2xl`), booking tabs use `text-xs` labels,
  the day strip tiles are `w-14` with 10 px notes, `ChoiceTile`s are `text-xs`,
  and the stepper's total + Back / Toliau stay on **one row** (`BAR_STEPPED`).
  Desktop sizes are unchanged.

## 2026-11-01 — Fix: phone drawer gap, stepper scroll on open

- **What:** the bottom-sheet drag handle in `ui/drawer` now floats over the top
  edge instead of sitting in the flow, so the photo / header starts flush with
  the sheet (the ~36 px gap is gone). The stepper only scrolls its card into
  view when the step changes, not on mount, so the drawer opens at the top.

## 2026-11-01 — Fix: card heading colour, calculator cards

- **Heading colour:** the activity card title used `md:text-card`, but `text-card`
  is also the *card colour* (near white), which won on desktop. The type step is
  now `text-tile` (rule added to `design-system.md`).
- **Calculator / form cards:** `Stepper` keeps its controls on the right with a
  `min-h-15` row (no more wrapping under a long label); `OptionToggle` matches
  its height; one gap everywhere. Columns follow the container (`@container` +
  `@xl:grid-cols-2`): one column in the drawer, two on `/skaiciuokle`. The cabin
  and sauna steppers use the same rule.

## 2026-11-01 — Fix: CTA text colour on hover, card tag size

- **What:** the header "Dovanų kuponai" / "Rezervuok" button lost its `text-ink`
  (a `text-micro` override made `cn()` drop it), so on hover pale text sat on a
  pale background; its label words were also spread apart. Fixed; the activity
  card tags had the same clash and rendered at 16 px instead of 10 px. Rule
  added to `design-system.md`.

## 2026-11-01 — Event calculator as a drawer

- **What:** on the home page, "Apskaičiuok šventės kainą" (party drawer) opens
  the event price calculator in its own drawer: a stepper (type → guests →
  space → catering → drinks → extras → summary) with the live total pinned in an
  ink header. The last step shows the breakdown and the inquiry form. The
  `/skaiciuokle` page is unchanged; both use the same `useEventCalculator` state
  and `CALCULATOR_SECTIONS`.

## 2026-11-01 — Smooth scroll

- **What:** in-page anchor links glide instead of jumping (`scroll-behavior:
  smooth` under `prefers-reduced-motion: no-preference`; reduced-motion visitors
  get the instant jump). `<html>` carries `data-scroll-behavior="smooth"` as
  Next.js 16 requires, so route changes still reset scroll instantly.

## 2026-11-01 — Sticker dock no longer reserves space

- **What:** removed the empty spacer `div` from `StickerDock` that added a
  dock-height gap under the page. The fixed dock now overlays the bottom of the
  page, so the last footer row can sit behind it until scrolled past.

## 2026-11-01 — Sticky header

- **What:** `SiteHeader` is `fixed` at the top on the home page and every inner
  page. It stays transparent over the hero and turns solid ink with a blur and
  a hairline after 8 px of scroll (menu open keeps it transparent over the coral
  panel). Anchors already clear it (`scroll-padding-top` 7 rem).

## 2026-11-01 — Drawer gallery and rounded corners

- **What:** the activity drawer's photo is a swipeable carousel
  (`ServiceGallery`, photos listed in `SERVICE_GALLERY` in `landing/content.ts`;
  dots + arrows when there is more than one) and the drawer has `rounded-tile`
  corners.

## 2026-11-01 — Activity drawer and stepper booking

- **What:** the home page activity dialog is now a drawer (`ui/drawer`, new
  dependency **`vaul`**): a floating right panel (16 px margins) on desktop, a
  bottom sheet with a drag handle and swipe-down on phones. The booking forms
  inside run as a **stepper** (progress bar, Back / Toliau, confirm on the last
  step; Toliau waits for required choices such as a sauna start time). The
  booking pages keep the single long form: `BookingCard` takes `steps` and only
  stacks them one at a time inside `SteppedBooking`.
- **Also:** contact fields stack in narrow containers; the dialog height fix
  and `dialog-motion` helpers now serve the drawer only.

## 2026-11-01 — Home dialogs host the real booking forms

- **What:** clicking an activity opens a dialog with its real booking form
  instead of the request planner: Pirtis (private hire / event seats), Nakvynė
  (days, type, nights, guests, coupon, contact) and Keturračiai (rental /
  guided tours), each behind the shared phone check. Availability loads when
  the dialog opens (`loadBookingData`), so the home page stays static. Party,
  wake and food have no online form and show contacts (parties also get the
  price calculator). Header "Rezervuok", hero sticker, footer CTA jump to the
  activities; "Planuojam šventę" opens the party dialog.
- **Removed:** the 3-step planner, `createPlanRequest`, `lib/plan-schema.ts`
  and the `PlanDialog` / `plan-*` files. ADR-0020 is superseded below.
- **Notes:** bookings made here go through the same actions as `/pirtis`,
  `/miegas`, `/keturraciai`, so they need a phone verified in the database
  (the dev skip button only helps the planner-style flows, not these).

## 2026-11-01 — Custom date picker

- **What:** the home planner's date and the calculator inquiry's date use the
  new `DatePicker` (popover + `CalendarGrid`) instead of the browser's native
  date input: Lithuanian month and weekday names, Monday first, past days
  disabled, keyboard navigation, 44 px cells. Value stays `yyyy-mm-dd`, so the
  schemas are unchanged. New `ui/popover`.
- **Not changed:** admin forms keep native date inputs.

## 2026-11-01 — No SMS in local dev

- **What:** under `next dev` the phone gate asks for the number only:
  `requestPhoneCode` returns the code to the form (`devCode`), which confirms
  it straight away through the normal `confirmPhoneCode`, so the database still
  records a real verification (booking tables check it). `sendSms` is a logged
  no-op in dev, so booking and staff notifications never text either, even with
  Twilio keys in `.env.local`. `SMS_IN_DEV=1` restores real SMS locally.
- **Safety:** keyed on `NODE_ENV === "development"` (`smsSkippedInDev`), which
  is `production` in every build and on Vercel. Per-phone limits (3/h, 5/day)
  still apply, so use another number if you hit them.
- **Skip button:** under `next dev` the phone step also shows "Praleisti
  telefono patvirtinimą (tik dev)": it takes the typed number (or
  `+37060000000`) as verified with a locally signed token, no code. The action
  `skipPhoneVerification` refuses outside dev and the button is compiled out of
  production builds. Fine for the home planner; booking tables still need a
  verification recorded by the database. If the database's send limits block a
  code, the fixed dev code `000000` also verifies locally.

## 2026-11-01 — Phone gate fields and buttons fill their card

- **What:** `PhoneNumberStep` / `PhoneCodeStep` inputs lost their `max-w`, the
  resend and "Keisti numerį" buttons are equal-width (stacked on phones), and
  `BookingCard`'s action button is full width below `sm`. Applies to every
  booking flow and the home planner.

## 2026-11-01 — Home planner sends a real request

- **What:** the planner dialog no longer ends in a `mailto:`. Step 3 collects
  name, phone/email (honeypot included) and **Siųsti užklausą** calls the new
  `createPlanRequest` action (`lib/plan-schema.ts`), which stores an inquiry
  for `/admin/uzklausos` and sends the staff SMS alert. A sent screen links to
  the real booking pages for the chosen activities. `ServiceDialog` leads with
  "Rezervuoti dabar" for bookable activities. The email link is kept as a
  fallback.
- **Why:** staff get the request in the system instead of hoping a visitor
  presses "Siųsti" in their mail app.
- **Phone check:** the planner opens on the same `PhoneGate` as the booking
  pages (number → SMS code). `createPlanRequest` verifies the signed token
  server-side (`verifiedPhone`, `UNVERIFIED` otherwise) and stores the E.164
  number; the visitor and staff get an SMS. The `mailto:` fallback was removed
  because it bypassed verification.
- **Notes:** no migration: it reuses `create_inquiry` (source shows as
  "Skaičiuoklė"; a dedicated source needs a migration). The database's
  `require_verified_phone` trigger only covers `renginys` inquiries, so the
  check for this one lives in the action.

## 2026-11-01 — Inner pages restyled to match the new home

- **What:** `/pirtis`, `/miegas`, `/keturraciai`, `/renginiai`, `/kuponai`
  and `/skaiciuokle` now share the home page's look. New `SiteHeader` /
  `PageHeader` (ink header, coral CTA, full-screen `MenuPanel`), `PageIntro`
  (dark title band with the hero's grid and orbit, load-in cascade), and a new
  `SiteFooter` (contacts + giant "Susitinkam Marse" + link row). `BookingHero`
  = `PageIntro` + sticky gallery + form (form first on phones). `ArrowButton` /
  `ArrowLink` are the dark `Cta`; chips, tiles and tabs press with `scale-97`.
  Coupon cards lost `rounded-tile`.
- **Moved / removed:** `Cta`, `Reveal`, `StarMark`, `SectionKicker`,
  `MenuPanel` now live in `components/`. Removed `ContactBar`, `MobileMenu`,
  `BrandLogo` (phone/email are in the footer and menu).
- **Docs:** `design-system.md` gained "The look" and the motion rules.
- **Not changed:** admin, `/embed/*` widgets (they keep their own shell and
  theme) and all booking logic.

## 2026-11-01 — Motion layer on the home page

- **What:** hero load sequence, `Reveal` scroll reveals on every section,
  press/hover feedback on CTAs, chips, tiles and round buttons, enter/exit
  animations for both dialogs and the menu panel (links stagger), step
  transitions in the planner. Marquee and the spinning star are now
  `motion-safe:` too.
- **Reduced motion:** nothing moves and nothing is hidden: verified with
  emulated `prefers-reduced-motion: reduce` (no element has an animation, no
  `Reveal` is hidden, dialogs have none). The service dialog keeps its content
  while it animates out.

## 2026-11-01 — New home page "Išsuk į Marsą"

- **What:** `/` is rebuilt from the Claude design (`components/landing/`):
  hero, ticker, filterable activity cards with detail dialogs, party block,
  accordion, gallery, FAQ, location, footer, and a 3-step day planner that
  ends in a prepared `mailto:` (not a booking). Photos in `public/landing/`,
  logos in `public/brand/logo-{light,dark}.svg`. Removed `Hero`,
  `SectorTiles`, `TrackStats`, `StatusBar`, `Equipment`, `Pricing`, `FindUs`,
  `DistortWordmark` and `lib/distort-gl.ts`.
- **Deviations from the design:** no prices on the page (rule 5; the design's
  80 € / 72 € quad figures are dropped, quads link to `/keturraciai`); filter
  chips wrap instead of scrolling; "Dovanoti Marsą" links to `/kuponai`;
  menu panel and activity dialogs link to the real booking pages; planner
  mail for events goes to `info@` (no `renginiai@` in `lib/contacts`).
- **Also:** `NAV_LINKS` `/#zonos` → `/#kryptys` (`/#kainos` removed);
  `StickerDock` Akademija/Skoniai jump to `/#kryptys`; new `ui/accordion`.

## 2026-10-30 — SMS phone check before every public booking

- **What:** `/pirtis`, `/miegas`, `/keturraciai`, event registration on
  `/renginiai`, the `/kuponai` order form and the same `/embed/*` widgets
  start with a `PhoneGate`: phone → 6-digit SMS code → the booking flow, with
  the verified number locked in the contact step. Every public action
  (`createSaunaBooking`, `createStayBooking`, `createEventTicket`,
  `registerForEvent`, `createQuadRental`, `createTourTicket`,
  `createCouponOrder`) checks a signed token against the booking's phone and
  stores the verified E.164 number; a database trigger refuses anon web
  inserts without a recently verified phone. Coupons now keep `buyer_phone`.
  The calculator quote request (`createInquiry`) is not gated.
- **Why:** stop fake and spam bookings that hold inventory. The send side is
  an SMS-pumping target, so codes are capped per phone, per IP and site-wide,
  limited to the allowed country prefixes. ADR-0018.
- **Env:** new `PHONE_VERIFICATION_SECRET`; `SUPABASE_SERVICE_ROLE_KEY` and
  Twilio become required for online booking.

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
