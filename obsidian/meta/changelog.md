- 2026-11-13 Refund hardening (ADR-0081): requests are found by kind and id (`request_refunds` unique on `(kind, request_id)`), a pending refund is never dropped on a timeout, 5xx, 409 or 429 but reconciled against Stripe (list refunds by payment intent, match `metadata.reference`), a `failed`/`canceled` refund releases the reservation, no new Stripe call after the 24 h idempotency window. Migration `20261113210000_request_refunds_by_kind.sql` APPLIED and verified. tsc/eslint clean.
- 2026-11-13 Admin cancel can refund (ADR-0081): cancelling a request paid online (booking, quad rental, event/tour ticket) opens a dialog to cancel and refund its share through Stripe, cancel without refund, or leave it. New `request_refunds` table + `begin/finish/fail_request_refund` (migration `20261113200000_request_refunds.sql`, APPLIED and verified), `lib/refund.ts`, `cancelRequest` action, `useCancelRequest` / `CancelRefundDialog`. tsc/eslint clean; not tested with a real Stripe payment.
- 2026-11-13 Review follow-ups to PR #53: my two migration files get unique versions (`20261113151000_rider_plan_orders`, `20261113161000_my_riders_registered`; file rename only, the live DB history is unchanged); the WAKE coupon dialog no longer submits the surrounding `/rezervacija` form; `registerRider` checks the plan id and payment setup before saving the rider; failed `online_plans` and photo signing are logged. tsc/eslint clean; not browser-checked.
- 2026-11-13 /admin/apyrankes → Planai: "Internetu" switch per plan (row, from `sm`, and in the plan dialog) toggles `ride_plans.sold_online`, i.e. whether the plan is sold on the public WAKE page; it needs a price above 0 (`saveRidePlan` forces it off otherwise). `RidePlan.soldOnline`. tsc/eslint clean; not browser-checked.
- 2026-11-13 WAKE page: "Plaukimas" now lists the swim plans from `ride_plans` (category Plaukimas), bought like the season passes (registration, Stripe, plan attached). `WakeOffer.planCategory` splits rides from season passes; plan wording (emails, return page) says "planas", not "abonementas". Migration `20261113190000_sell_swim_plans_online.sql` (APPLIED, verified: 12 of 13 swim plans and both passes online) sets `sold_online` for the swim plans (not "Papildoma valanda"). tsc/eslint clean; not browser-checked.
- 2026-11-13 Security: `my_riders()` returns registration details (e-mail, phones, birth date, photo, waiver) only when the account's confirmed e-mail or phone equals the rider's own (`primary_match`); a `phone2`-only match gets name, plan, bracelets and purchases, no details, no photo URL, and does not hide "Užbaigti registraciją". Migration `20261113180000_my_riders_primary_match.sql` APPLIED and verified. tsc/eslint clean.
- 2026-11-13 /paskyra → Vandenlentės: "Užbaigti registraciją" shows only when none of the matched riders is registered (it showed whenever any old row was unfinished), and `visibleRiders` hides leftover unfinished rows with no plan, bracelet or purchase once one registered rider exists (the tab count read 10 from old test attempts). tsc/eslint clean; not browser-checked.
- 2026-11-13 /registracija photo step: drag and drop an image onto the photo frame (highlight + "Paleiskite nuotrauką čia" overlay). The file picker and the drop share one check: JPG, PNG or WebP up to 5 MB (as `registerRider` requires), otherwise a message shows; a chosen file releases the camera. The unavailable-camera message now mentions dragging. tsc/eslint clean; not browser-checked.
- 2026-11-13 /registracija: from `xl` the heading wrapper is `w-4xl` (wider than the `max-w-2xl` form column), and the title is two lines, "TAPK VANDUO" / "MARSE NARIU" (the second line is coral), instead of four. Not browser-checked.
- 2026-11-13 Sign-in code field is a proper OTP input (`components/ui/otp-input.tsx`): 8 digit blocks over one transparent input (typing, paste, autofill). `LOGIN_CODE_LENGTH = 8` in `lib/customer-schema.ts`; the confirm button still enables from 4 digits and the server accepts 4–10, so a 6-digit SMS code works. tsc/eslint clean; not browser-checked.
- 2026-11-13 `LoginCodeStep` heading and hint ("Patvirtinimo kodas" / "Įvesk kodą, kurį išsiuntėme…") are left-aligned (were centered); it is shared by /paskyra sign-in and the checkout dialog. Not browser-checked.
- 2026-11-13 Signed-out /paskyra heading is "Prisijunkite arba / sukurkite paskyrą" (the breadcrumb and the signed-in heading stay "Mano rezervacijos"). The longest word, "PRISIJUNKITE", is as wide as "REZERVACIJOS", so it fits the split title size; the coral line wraps on narrow columns. Not browser-checked.
- 2026-11-13 `BookingHeader` `split` prop: from `lg` the title uses the new `text-display-split` token (`clamp(2.5rem, 4.2vw, 4.5rem)`) so "REZERVACIJOS" no longer runs under the photo on the signed-out /paskyra. Not browser-checked.
- 2026-11-13 /paskyra signed-out view: heading and sign-in stay left-aligned (the centering was reverted, `BookingHeader` has no `centered` prop), and a second column at the page root (beside the heading and the sign-in, from `lg`; below them on phones) shows the aerial park photo. Not browser-checked.
- 2026-11-13 /paskyra → Vandenlentės: "Mano registracija" shows the customer's own registration details (contacts, birth date, photo, signed rules). `my_riders()` gains email/phones/birthdate/avatar_path/signed_at/terms_version (migration `20261113170000_my_riders_registration_details.sql`, APPLIED to the live DB and verified). tsc/eslint clean; not browser-checked.
- 2026-11-13 /paskyra → Vandenlentės: buttons "Naršyti planus ir abonementus" and, when registration is unfinished, "Užbaigti registraciją". `my_riders()` gains `registered` (migration `20261113161000_my_riders_registered.sql`, APPLIED to the live DB and verified). tsc/eslint clean; not browser-checked.
- 2026-11-13 WAKE season passes are real bracelet-plan purchases (ADR-0080): "Užsakyti abonementą" opens `/registracija?abonementas=…`, the registration continues into Stripe Checkout, and the webhook attaches the plan + a purchase to the rider (staff bind the bracelet at the park). New `rider_plan_orders`, `online_plans()`, `lib/plan-checkout.ts`, `lib/plan-payment.ts`, `/registracija/apmoketa`. Rides keep the coupon dialog. Migration `20261113151000_rider_plan_orders.sql` APPLIED to the live database and verified; tsc/eslint clean; not tested end to end.
- 2026-11-13 WAKE pass / ride purchase opens a checkout dialog (`WakeCheckoutDialog`: name, email, phone, then Stripe) instead of redirecting to `/kuponai`. Same coupon order + webhook flow underneath. tsc/eslint clean; not browser-checked.
- 2026-11-13 `paid_request_details` classifies sauna sessions by `events.category = 'pirtis'` (their `program_id` is empty), so the confirmation says "Pirties seansas" for them; migration `20261113160000_paid_details_sauna_category.sql`.
- 2026-11-13 Paid reservations are confirmed automatically (ADR-0079): `complete_payment` sets the requests to `patvirtinta` (not when the payment needs review) and returns `confirmed`; new `paid_request_details`. The customer SMS and email now list the booking ("Pirties seansas: ..., Data, Laikas" and the contact) instead of "patvirtinsime netrukus"; staff payment alerts say "Apmoketa ir patvirtinta". New `lib/paid-request.ts`, `lib/payment-notice.ts`; return page copy updated. Migration `20261113150000_auto_confirm_paid_requests.sql` NOT yet applied to the live DB. `tsc`/eslint clean; the SMS text was previewed, no real payment run.
- 2026-11-13 Footer contacts: five entries (Vanduo Marse ir renginiai, Marso Akademija, Pirtis Marse, Partneriai, Skoniai Marse) with the owner's emails and phones, from `FOOTER_CONTACTS`. `/kontaktai`, service pages and `MAIN_CONTACT` unchanged.
- 2026-11-13 Home hero phone is now `MAIN_CONTACT.phone` (+370 630 80 444); the reservation plan panel and mobile dock still use `RESERVATION_PHONE`.
- 2026-11-13 `/rezervacija` stay cards: the stepper label is "Namelių kiekis" (cabins) / "Kemperių kiekis" (camper pitches).
- 2026-11-13 Home hero phone is now `MAIN_CONTACT.phone` (+370 630 80 444) instead of `RESERVATION_PHONE`; the reservation plan panel and mobile dock still use `RESERVATION_PHONE`. Not browser-checked.
- 2026-11-13 Footer contacts: five entries (Vanduo Marse ir renginiai, Marso Akademija, Pirtis Marse, Partneriai, Skoniai Marse) with the owner's emails and phones, from `FOOTER_CONTACTS`. `/kontaktai`, service pages and `MAIN_CONTACT` unchanged. Not browser-checked.
- 2026-11-13 `/rezervacija` stay cards: the stepper label "Kiekis" is now "Namelių kiekis" (cabins) / "Kemperių kiekis" (camper pitches). Not browser-checked.
- 2026-11-13 Payments below Stripe's 0,50 € minimum (e.g. 45 € with a 99 % code = 0,45 €) used to fail with the generic "Nepavyko pradėti mokėjimo". `MIN_CHARGE_EUR` (`lib/payments.ts`): the checkout dialog shows the reason and disables the pay button, and `checkoutUrl` throws `BelowMinimumError` (held slots are freed) as a second guard. Not browser-checked.
- 2026-11-13 The "Nuolaidos kodas" field is visible again in the "Užbaik rezervaciją" dialog (removed the `SHOW_DISCOUNT_CODE_FIELD = false` flag). Not browser-checked.
- 2026-11-13 Browser Back from Stripe Checkout cancels the customer's unpaid payments automatically (`useReleaseOnBrowserBack` in `ReservationFlow`, `releaseMyUnpaidPayments`, ADR-0078); the form leaves "Nukreipiame..." and says the payment was not made. `tsc`/eslint clean; not browser-checked.
- 2026-11-13 Admin: removed the "Pažymėti įvykdyta" (mark done) button from confirmed requests (`StatusActions`, and `NEXT_STATUSES` in `booking-actions.tsx`); a confirmed request now only offers "Atšaukti". The `ivykdyta` status itself is unchanged for existing rows. `tsc` clean; not browser-checked.
- 2026-11-13 Release hardening (security-review follow-up to ADR-0077): `ownsPayment` compares the payment's `user_id` with the signed-in user, and `closeCheckoutSession` frees slots only after the session is confirmed expired (or stops when it is paid); used by both `releaseCancelledPayment` and `cancelUnpaidPayment`. `tsc`/eslint clean; not browser-checked.
- 2026-11-13 Coming back from Stripe Checkout unpaid (`/rezervacija/mokejimas?atsaukta=1`) now frees the held slots immediately (`lib/payment-release.ts`: expires the Checkout Session, then `abandon_payment`) and the page says so, instead of "vietas dar laikome trumpai" (ADR-0077). Closing the tab without coming back still holds the slot until the session expires (about 31 minutes, released by the `checkout.session.expired` webhook, cron as backup). `tsc`/eslint clean; not browser-checked.
- 2026-11-13 `create_coupon_order` is service-role only and refuses a missing IP key (migration `20261113140000_coupon_order_service_only.sql`); `createCouponOrder` stores orders through the admin client and fails closed without the IP hash. Security-review follow-up to ADR-0076. Applied and verified after the PR #47 deploy.
- 2026-11-13 Coupons are bought with no staff step and no email to unverified addresses (ADR-0076): the manual "staff arrange payment" fallback and the order-time receipt/alert emails are removed; without Stripe the order is refused, and an order whose Checkout cannot open is dropped (`abandon_coupon_order`). Per-IP cap of 5 unpaid orders/hour (IP stored only as an HMAC in `coupons.ip_hash`, `lib/client-ip.ts`). `OrderConfirmation` removed. Migration `20261113130000_coupon_order_abuse_guards.sql` applied and verified. Staff still get the paid alert and can resend or activate old pending orders in /admin/kuponai.
- 2026-11-13 Wide date-strip tiles (`DayCell` `compact` + `wide`, the sauna session strips) are `w-18` instead of `w-14`, so the time and "19/20" seats fit on one row. Not browser-checked.
- 2026-11-13 `BookingHeader` intro paragraphs no longer have `max-w-xl`; width follows the page container (shared by all booking pages). Not browser-checked.
- 2026-11-13 Rider registration: the birth date is now three number fields (year / month / day, new `BirthdateInput`) instead of the calendar popover. Value stays `yyyy-mm-dd`; incomplete, impossible or future dates give "Neteisinga data". `tsc`/eslint clean; not browser-checked.
- 2026-11-12 Quad route tiles right-align duration and price and provide a separate route details icon on both booking pages.
- 2026-11-12 Quad route tiles show the scheduled tour duration from the catalogue on the service and reservation pages.
- 2026-11-12 Removed the extra separator and reduced the space above the inline quad reservation plan.
- 2026-11-13 `BookingHeader` intro paragraphs no longer have `max-w-xl`, so they span the full header width on every page that uses it (the coupon page intro was the trigger). Not browser-checked.
- 2026-11-13 Gift coupons are paid automatically with Stripe Checkout (ADR-0075): `createCouponOrder` opens a Checkout Session (`lib/coupon-checkout.ts`) and the form redirects to it; the webhook (`lib/coupon-payment.ts`) issues the code and emails it to the buyer and the recipient, alerts staff, cancels the order when the session expires and cancels the coupon on a full refund. New return page `/kuponai/apmoketa`. Without Stripe (or if it refuses) the old manual flow stays. Migration `20261113120000_coupon_stripe_payment.sql` applied to the live database and verified (5 service-role-only functions). `tsc`/eslint clean; no Stripe test payment run.
- 2026-11-13 `/paskyra`: a reservation whose payment is still "Laukia apmokėjimo" now has "Mokėti" (reopens its Stripe Checkout through `resumeCheckout`) and "Atšaukti rezervaciją" (two-step; new `cancelUnpaidPayment` expires the Stripe session, then `abandon_payment` frees the held time). Before, the badge showed with no way to pay or release the slot. `MyRequest.paymentId` added. `tsc`/eslint clean; not browser-checked (needs a signed-in account with an unpaid payment).
- 2026-11-13 Coupon emails: an optional recipient email on the order form; placing an order emails the buyer a receipt and staff (`STAFF_NOTIFY_EMAIL`, else info@, plus marketing copy) an alert; marking paid or resending emails the code to the buyer and the recipient (`sendCouponEmails`). Migration `20261113110000_coupon_recipient_email.sql` (adds `coupons.recipient_email`, new default arg on `create_coupon_order`) Applied to the live database and verified (ADR-0074).
- 2026-11-13 Gift coupon (dovanų kuponai) orders no longer need SMS phone verification: phone is optional, the verification dialog is removed and migration `20261113100000_coupon_orders_no_phone_verification.sql` drops the `coupons_phone_verified` trigger (ADR-0073). Applied to the live database and verified (trigger gone).
- 2026-11-12 Public booking, coupon and event inquiry forms show the VAT-inclusive total before the full-width main action. Sauna session totals update immediately with seat quantity and reuse plan pricing. The WAKE panel shows 0 € and a disabled action before selection.
- 2026-11-12 The sauna session tab on `/rezervacija` starts on today and shows that day's sessions. On an empty date it offers the next date with bookable sessions and their start times. Opening the suggestion changes the date without adding a session.
- 2026-11-12 The WAKE order total uses the stacked reservation layout with the amount under the VAT label and coupon instructions below.
- 2026-11-12 Stay choices match the WAKE two-column layout in wide reservation panels. The info buttons appear once arrival is selected.
- 2026-11-12 The stay choices on `/rezervacija` remain visible and disabled until an arrival date is selected.
- 2026-11-12 The stay choices on `/rezervacija` use the Paslauga heading and the same list icon as WAKE.
- 2026-11-12 Added the sauna waves icon beside the Seansai heading in shared sauna booking.
- 2026-11-12 The WAKE tab on `/rezervacija` shows only its own order panel. Other activities stay in the reservation plan when switching tabs, and their desktop summary and mobile dock stay hidden on WAKE.
- 2026-11-12 On `/rezervacija`, the WAKE Paslauga selector has a list icon and starts with neither service selected. It shows a dimmed preview of the ride offers (or passes if there are no rides). Choosing a service enables its offers, and choosing an offer shows its total and checkout link.
- 2026-11-12 WAKE ride and season-pass options use the stay-card layout with icon headings, inline descriptions and prices, and a dark selected card. Offer details and order totals use the existing live coupon catalogue.
- 2026-11-12 WAKE type tiles show the name and live starting price in the same two-line layout as quad route tiles.
- 2026-11-12 Added a WAKE order summary to `/rezervacija` with its gallery, live selected offer price, coupon order link and academy contacts.
- 2026-11-12 Matched the quad route and WAKE type tiles to the sauna venue tiles for height, spacing and text alignment.
- 2026-11-12 Aligned the session and stay date headings with the other reservation tabs by matching the gap below Tipas.
- 2026-11-12 The stay booking date strip on `/rezervacija` matches the sauna strip, with wider tiles and dark arrival and departure dates.
- 2026-11-12 The stay date strip on `/rezervacija` uses the same inline view switch style as the sauna forms.
- 2026-11-12 Before choosing a private sauna, the disabled booking strip shows whether any bookable sauna is available that day. After selection it shows only that sauna’s availability.
- 2026-11-12 Highlighted the selected date in the sauna booking strip with a dark fill and high-contrast availability text.
- 2026-11-12 Added a visible Daugiau informacijos label to the sauna session details link.
- 2026-11-12 The desktop reservation summary shows a right-aligned final price for a sauna-only selection and omits the duplicate day plan.
- 2026-11-12 Private sauna booking on `/rezervacija` shows the date strip immediately and enables it once a bookable venue is selected.
- 2026-11-12 The sauna session tab on `/rezervacija` shows the date strip immediately, with wider day cells and the date label above the month beside the view switch.
- 2026-11-12 Matched the desktop reservation plan background to the booking forms.
- 2026-11-12 Reconciled the booking panels with main: announced saunas keep their disabled coming-soon cards, full-day start rules remain available, private calendars use Laisva/Pilna, and session calendars show start times and free seats. Review source labels follow main.
- 2026-11-12 The sauna session details dialog uses Rezervuoti and opens the reservation checkout with the chosen session and seat count. The free-seat count uses the same green or red as the calendar.
- 2026-11-12 Moved the sauna session rate beside its time and the free-seat count beside the selected card’s quantity controls.
- 2026-11-12 Removed the general Google Maps link below the sauna reviews. Individual review source links remain.
- 2026-11-12 The sauna session booking calendar and date strip show session start times and free seats. Dates without sessions have no visible availability badge.
- 2026-11-12 Matched the sauna booking type labels to the venue card title size.
- 2026-11-12 Shortened the sauna cancellation note to “Nemokamas atšaukimas likus bent 24 val. iki pradžios.”
- 2026-11-12 Sauna duration tiles show their base price for the selected day, or the starting price before a date is chosen. The selected base price remains beneath the tiles.
- 2026-11-12 Private sauna start times are shown in a compact grid labelled Pradžia. The selected time is highlighted, and changing it keeps the selected duration and attendant.
- 2026-11-12 Reduced the visible gap between stacked booking help contacts while preserving 44 px link targets.
- 2026-11-12 The sauna sidebar shows Galutinė kaina, su PVM with the amount right-aligned.
- 2026-11-12 Removed the duplicate day plan and quantity editor from `/pirtis`. The time and guest controls in the form update the total directly.
- 2026-11-12 The sauna booking calendar and date strip show green Laisva or red Pilna using the selected booking options and live availability.
- 2026-11-12 Simplified the `/pirtis` sidebar with compact type buttons, time controls after date selection, and no empty total. The cancellation note stays above the actions and sauna booking help uses the events inbox.
- 2026-11-12 The `/pirtis` booking panel shows the sauna choices beneath Tipas from the start. They become available after selecting Privati pirtis. The Finnish sauna is shown first.
- 2026-11-12 Reworked the `/nakvyne` booking sidebar with type tiles before dates, an inline calendar showing availability for the selected type, a total after dates are chosen, and help contacts below the booking buttons.

- 2026-11-12 Designed Open Graph images from the owner's files (`PIRTIS-OG`, `NAMELIAI-OG`, `RENGINIAI-OG`, 1200x630, compressed to JPEG with `sips`, 200-470 KB instead of up to 1.6 MB) in `public/og/`: `/pirtis` -> `pirtis.jpg`, `/nakvyne` -> `nameliai.jpg`, `/sventes`, `/vestuves`, `/imoniu-renginiai`, `/gimtadieniai` and `/skaiciuokle` -> `renginiai.jpg`. New `SERVICE_OG_IMAGES` / `EVENTS_OG_IMAGE` in `lib/seo.ts`, used by `app/[service]/page.tsx` and `app/skaiciuokle/page.tsx`; other service pages keep their activity cover, `/renginiai` and the home page keep the default. `tsc`/eslint clean; `og:image` and `twitter:image` checked on the dev server for every page above, files served as image/jpeg. Not checked in a social-media preview tool (needs the deployed URL; crawlers cache old images).

- 2026-11-12 `/sventes` calculator, Švediškas stalas card (`food-section.tsx`): the "Kaina vienam suaugusiajam" slider and its price labels were only as wide as their content (the card's controls row is a wrapping flex row); the wrapper is now `w-full`, so the slider spans the card and "Pasirinkti" wraps below. `tsc`/eslint clean; checked at 1280 px.

- 2026-11-12 Keyword pass on the public pages (from the OpenSEO research of 2026-11-12, project "Vanduo Marse"): titles, meta descriptions, summaries and FAQ in `service-content.ts`, home description in `app/page.tsx`. `/pirtis` "Pirties nuoma prie Kauno: suomiška sauna" (+ price, full-day and pirtininkas FAQ; no longer promises the malkinė pirtis in static copy, which is now "netrukus"), `/nakvyne` "Namelių nuoma prie ežero Kauno rajone" (+ price and camper FAQ), `/vandenlentes` "Wake parkas prie Kauno: vandenlenčių parkas" (+ "where" and "what is a cable park" FAQ), `/keturraciu-nuoma` got a meta description, home description leads with "wake parkas" and "nameliai prie ežero". Targets: wake parkas 590, wakeboard 480, vandenlenčių parkas 140, pirties nuoma 880, namelių nuoma prie ežero 590, keturračių nuoma 320 searches a month. No prices are written in the copy (they stay in the database). `tsc`/eslint clean; titles, descriptions, H1 and FAQ counts read from the dev server, `/vandenlentes` checked at 375 px (no overflow). Not checked: how Google shows the new titles; the site is still behind the launch gate in production.

- 2026-11-12 Removed the "„Google Maps“ per „Wanderlog“" link from the visitor review cards (`service-reviews.tsx`); those cards now name "„Google Maps“" as plain text. Booking.com and Restaurant Guru cards keep their links. Also removed the "Skaityti „Vanduo Marse“ atsiliepimus „Google Maps“" link under the reviews on /pirtis.

- 2026-11-12 Sauna booking calendar (`/pirtis`, `/rezervacija`): day cells show the number of free start times for the chosen length (private hire) or the number of sessions with room (Pirties seansai) instead of the wave icon; `dayDetails` with `AvailabilityCount` in `sauna-service-booking.tsx`, same recipe as the cabin counts. `tsc`/eslint clean; checked at 1280 px on /rezervacija (Suomiska sauna, 2 val.: 11 on a free day).

- 2026-11-12 "Visa diena" can start later than 10:00 (`/pirtis`, `/rezervacija`): the Laikas list offers every start from which the day is free to closing (10:00-17:00 on a free day), the session runs to closing (e.g. 13:00-22:00) and bills the full-day price. `fullDayStartHours` in `lib/sauna.ts`; `SaunaPlan.hours` is the real length and `SaunaPlan.fullDay` marks the full-day price; `DurationPicker` takes `sessionHours` for the end time. Migration `20261112190000_sauna_full_day_late_start.sql` APPLIED to the live project `mwngljhcvqkvncwbmgeo` (`get_project_url` checked): `create_sauna_booking` bills a run-to-closing length that is longer than the longest hourly length at the 12 h key. The older `SaunaBooking` widget (`/embed/pirtis`, home) still offers only 10:00 for a full day. Not submitted as a real booking. Also: the coming-soon sauna chip is dashed and faded (`sauna-service-options.tsx`); the `/rezervacija` Suspense fallback now uses the same padding and grid as `ReservationFlow`, so the header no longer sits flush left and jumps when the availability data arrives (checked at 1280 px on the dev server).

- 2026-11-12 Sauna "Netrukus atsidarys": a sauna can be announced before it opens. /admin/pirtis editor has a "Būsena" select (Rodoma ir galima rezervuoti / Netrukus atsidarys / Paslėpta) instead of the visibility switch; new `saunas.coming_soon` column (migration `20261112180000_sauna_coming_soon.sql`, APPLIED to the live project `mwngljhcvqkvncwbmgeo` after checking `get_project_url`; anon/authenticated read policies now allow `active or coming_soon`). Booking RPCs and the event calculator still read `active` only, so a coming-soon sauna is `active=false, coming_soon=true` and cannot be booked. `SaunaPageData.comingSoonSaunas` feeds `SaunaPicker`, which shows those cards after the bookable ones, dimmed, with the "Netrukus atsidarys" tag instead of a price and not selectable. Admin list/select label them "(netrukus)". `tsc`/eslint checked; not browser-checked.

- 2026-11-12 Merged `origin/nauji-pakitimai` (e34ce0c "fix: align public booking details and contacts", from another session) into `feat/quad-anytime-booking`. Conflicts resolved: `plan-panel.tsx` keeps no "Tavo planas" heading and takes their help block under the actions; `service-content.ts` takes their removal of the static quad facts (the page now builds one fact per route from `quad_tour_routes`, so "bent 5" comes from the data); docs keep both entries, their ADR renumbered 0071 -> 0072 (mine, the quad decision, stays 0071). My migration file was renamed `20261112170000_quad_tours_any_time.sql` -> `20261112171000_quad_tours_any_time.sql` (their `20261112170000_correct_seeded_sauna_copy.sql` had the same version; mine was already applied through the MCP, which stamps its own version). Also: removed the unused `quad-service-facts.ts`, and the /keturraciai meta description no longer promises "artimiausi išvykimo laikai". Their migration is a no-op on the live project (it only rewrites the old seed row named "Pirtis Marse"; the live sauna is "Malkine pirtis") and is not applied.

- 2026-11-12 Quad booking: each Laikas option shows the free quads ("10:00-12:00  Laisvų keturračių · 20", `TimeSelectOption` + `AvailabilityCount`, trigger shows just the time). The inline plan panel (service pages) no longer has the "Tavo planas" heading (`plan-panel.tsx`; the panel keeps `aria-label` "Rezervacijos planas"; the desktop panel keeps "Rezervuoti"). `tsc`/eslint clean; checked at 390 px on /keturraciu-nuoma. Note: the running dev server (started 19:50) serves a stylesheet from before PR #24, without the `availability-open` colour, so the count rendered ink instead of green there; restart `pnpm dev` to see it green (no code involved).

- 2026-11-12 Quad tours are booked at any time, minimum 5 quads (ADR-0071, reverses ADR-0055). Public: `quadTourStarts` now lists every start the free fleet covers for the route (no departures), `QuadTourPick` and `quadTourRentalSchema` lose `eventId`, `createQuadTourRental` calls `create_quad_tour_rental` (route, date, start hour) instead of `create_quad_tour_departure_rental`, `QuadPageData.departures` / `QuadDeparture` and the departures query are removed, the day markers no longer count tours. Admin /admin/keturraciai: the "Turų datos" card, the "Pridėti turą" button and `tour-departure-dialog.tsx` are removed, the route card text is updated, `saveEvent` stops writing `tour_route_id`. Copy: static fact "bent 5 keturračių". Migration `20261112171000_quad_tours_any_time.sql` (grant + `min_units` 5): APPLIED to the live project after checking `get_project_url` (the first attempt was blocked by the permission check, the second went through at the owner's request); verified: `anon` and `authenticated` can execute `create_quad_tour_rental`, every route has `min_units` 5 (it already was). Checked which local migration files the live project lacked: the departures pair, `notification_recipients`, `my_rider` and `my_rider_account_phone_plain` were applied earlier under other names (their tables, columns and function bodies exist), so nothing else was missing; `list_migrations` names do not match the files one to one. `tsc`/eslint clean; browser-checked at 390 px on /keturraciu-nuoma: Midi offers 10:00-18:00 starts on a free day, 12:00-14:00 gives "Bent 5 keturračiai", 5 quads = 395 € in the plan; admin pages not opened (staff login); no booking submitted.

- 2026-11-12 Quad booking panel rebuilt to the owner's mock (from the friend's `24f22ca` / `a669370` design, on the live data): "Trasa" legend with icon, `QuadRoutePicker` = one row of three tiles (name + price per quad from `quad_tour_routes`; the route's own `badge` as a red tag), "Daugiau apie trasas" link to `#kainos` (only where `pricesHref` is passed: service pages) that becomes the route dialog once a route is chosen, `DateField` (disabled until a route is chosen, day markers follow the route), then `QuadTourFields` (new): a Laikas select (disabled until route and date), and after a start the quads stepper and gear; the tour is in the plan from the moment a start is chosen and follows each change (no "Pasirinkti" button). The ID-document line moved from `QuadServiceHelp` up beside the cancellation note, above the buttons. `QuadServiceBooking` no longer uses `QuadTourCard` (still used by `ActivitiesStep`; it gained `routeId` and a badge tag). Applies to /keturraciu-nuoma, /keturraciai and the Keturračiai chip on /rezervacija. The friend's hard-coded Ciongo catalogue and no-op preview checkout were NOT used. `tsc`/eslint clean; browser-checked at 390 px and 1280 px up to the empty-day message; start times, quads and gear NOT checked: the live DB has 0 scheduled quad departures. Migration `20261112160000_quad_midi_badge_top.sql` (APPLIED to the live project `mwngljhcvqkvncwbmgeo` after checking `get_project_url`, verified: Midi's `badge` is "TOP", Mini and Maxi have none; editable in /admin/keturraciai) sets the tag text the mock shows; checked in the browser at 390 px.

- 2026-11-12 Sauna price sheet with "Visa diena" (branch `feat/sauna-duration-table`, ADR-0066 addendum). Migration `20261112150000_sauna_full_day_prices.sql` APPLIED to the live project `mwngljhcvqkvncwbmgeo` (project-3 slot, `get_project_url` checked) and verified: both saunas now hold Mon–Thu 2 h 160 / 3 h 210 / 4 h 240 / day 300 and Fri–Sun 2 h 200 / 3 h 270 / 4 h 320 / day 400, `max_hours` 12 (the day is the 12 h key, shown as "Visa diena"; a day booking is only offered from 10:00 on a day with nothing booked). Code: new `SaunaPriceTables` (`components/services/sauna-price-table.tsx`) renders the "Kainos" table on `/pirtis` from the saunas' rates (one table per distinct price sheet, footnotes from the guest fee and the pirtininkas); `service-pricing.tsx` shows it instead of the old private-program rows (350 € / 200 € flat prices) and keeps only scheduled-session programs in the list. Duration tiles are one row of four (`SaunaServiceHourly` `grid-cols-4`; `DurationPicker` is `grid-cols-4` with the price on each tile and the end time of the chosen one below). `sauna-booking.tsx`: the "Ilgiausiai iki…" hint ignores the full-day length. Fix: the Laikas select on /rezervacija showed "Pasirink laiką" after a private-hire time was chosen (`sauna-service-booking.tsx` built the value as `null:<hour>`, the options use `<hour>`). The tariff-table version on `front-updates-original` / `feat/booking-interface` was NOT copied (hard-coded `hireTariff`). `tsc`/eslint clean; browser-checked at 375 and 1024 px: table, weekday/weekend base price, Visa diena 300 € on a free Tuesday (only 10:00 offered), 2 val. 12:00–14:00 = 160 €; no booking submitted.

- 2026-11-11 Public booking pages take sauna and stay capacities, quad route distances and minimum quantities from the booking catalogues. Removed fixed values from homepage and booking copy. Legacy sauna display text now has a guarded data migration instead of a public-reader override.
- 2026-11-11 Restored the help contacts below the reservation and cash-on-site buttons in the public plan panel and mobile plan sheet.

- 2026-11-12 JSON-LD postal code is 54311 (owner's address "Sausinės g. 20, Žemaitkiemio k., LT-54311 Kauno r."; was 54312, which came from the Google Maps listing). Street unchanged. `tsc`/eslint clean.

- 2026-11-12 Home JSON-LD (`localBusinessSchema`) now has `geo` (54.9910823, 23.8620224, from the Google Maps pin) and `openingHoursSpecification` (Fri 17-21, Sat-Sun 10-20, from the Google Business Profile; the restaurant's separate breakfast hours are not included). `tsc`/eslint clean; output checked on the dev server.

- 2026-11-12 SEO launch pass (branch `feat/seo-launch-fixes`, uncommitted): `lib/structured-data.ts` gained `faqSchema`, `breadcrumbSchema`, `contactPageSchema`. FAQPage JSON-LD on the home page (`FAQ_ITEMS`) and on each service page (its `questions`); BreadcrumbList on service pages and `/kontaktai`; ContactPage on `/kontaktai`. `ServicePageCopy.meta` overrides the generated meta description (used by `/pirtis`, whose summary + description was cut mid-word). `/netrukus` title is now `Netrukus | Vanduo Marse` (no doubled brand). `tsc`/eslint clean; JSON-LD, titles and descriptions checked against the local dev server; not deployed.

- 2026-11-12 `/rezervacija` date picker grid (`reservation-flow.tsx`): added `grid-cols-1` so the auto column no longer grows to the date strip's width; at 375 px the page was 537 px wide (horizontal scroll) after the front-updates rebase, now 360 px (checked in the browser by adding the class; `main` was not affected).

- 2026-11-11 Added the celebration sidebar calculator and 60-day calendar on `/sventes`. Published events show details, and the private-event calendar migration exposes marked dates. Reconciled overlapping Finnish sauna changes with the admin-managed duration prices and named attendants from main (ADR-0066 and ADR-0067).
- 2026-11-11 Integrated the public booking updates with the live tour, stay and sauna catalogues. The WAKE tab reuses the coupon order panel. Public date fields share a calendar, and the stay schedule uses current inventory by stay type.
- 2026-11-11 Added 13 optimized WAKE photos to the shared gallery with Lithuanian alt text and image sitemap URLs.
- 2026-11-12 Duplicate "Reikalinga pagalba?" block on `/keturraciu-nuoma`: the plan panel (`PlanDetails`, new `hideHelp` prop, set when `inline` and the activity is keturraciai) no longer renders its own help beside the quad service page's help block. Other pages keep the panel's. Checked in the browser: one block on each of /keturraciu-nuoma, /keturraciai, /pirtis, /rezervacija.

- 2026-11-12 New ATV booking from the friend's `front-updates` UI, on the live data (ADR-0070). `/keturraciai` now embeds the live booking (`ReservationFlow activity="keturraciai" wide`) where it had a link-out card: date, three route cards (time, quads, gear, select) and the price panel beside them, with the phone dock. `ReservationFlow` gets a `wide` prop (plan beside the form instead of stacked). `QuadServiceBooking` is now `DateField` + `QuadTourCard`, replacing the route-chip form on /rezervacija, /keturraciu-nuoma and /keturraciai; `quad-availability.tsx` deleted. The friend's hard-coded Ciongo routes/prices (`quad-preview-*`) were NOT used: `main`'s cards already read `quad_tour_routes` and scheduled departures. `tsc`/eslint clean; browser-checked at 1280 and 375 px with FAKE departures on a throwaway local page (removed): Mini at 10:00 x 3 = 177 EUR in the plan, no overflow. **Live data has 0 scheduled quad departures (`events.tour_route_id`), so no tour can be sold until staff add them in /admin/keturraciai.** No booking submitted.

- 2026-11-12 Rest of the original `front-updates` rework, rebuilt on `main`'s models (stacked on the /rezervacija rework): sauna sessions are cards (`SaunaServiceSessions`) instead of a time dropdown, with the selected card dark and holding rate, info link and seats; a day with one free session selects it automatically; the stay calendar on /rezervacija shows free cabins out of stock on each date (`stayDayDetails`, built on `stay_types`, not the original's fixed cabin sizes). `tsc`/eslint clean; browser-checked at 375 px (session list, auto-select, plan 25 €, cabin counts 14/14); no booking submitted. Deliberately not ported: the ATV preview checkout (books nothing, would replace the live ATV booking), the Finnish sauna tariff tables and migration `20261111120000` (superseded by ADR-0066 per-length pricing), the private start-time grid, the removal of the calculator link from the header.

- 2026-11-12 `/rezervacija` reworked from the original `front-updates` branch (ADR-0069), on `main`'s models. The tab bar, date strip and filter/list are replaced by one boxed panel with "Tipas" chips (`ReservationTypeChips`: Pirties seansai, Privati pirtis, Nakvynė, Keturračiai, Wake). The sauna chips render `SaunaServiceBooking` (new `mode` prop hides its own type choice; `saunaHasSessions` helper), so /rezervacija and /pirtis share one booking form with the hourly hire, pirtininkas and per-length pricing; Keturračiai renders `QuadServiceBooking`, Wake the coupon order, Nakvynė keeps the stay date strip. Switching between the two sauna chips clears the sauna pick. `ActivityTabs` deleted. `tsc`/eslint clean; browser-checked at 375 px (all five chips, a private booking to a 250 € plan, no overflow, no console errors); no booking submitted. Not ported from the original: the cabin free/total counts, the ATV preview checkout, the Finnish sauna tariff tables (superseded by ADR-0066).

- 2026-11-12 Favicon: new Vanduo Marse badge icon from the owner's `Vanduo Marse - favicon.svg`. `app/icon.svg` (the source, white background), and `app/icon.png` (512), `app/apple-icon.png` (180) and `app/favicon.ico` (16/32/48, PNG-in-ICO) rendered from it with sharp. Next serves them from the app folder; all four URLs return 200 and are linked in the page head. Checked the 512 px render by eye; not checked in a browser tab.

- 2026-11-12 Admin "Svetainė" (`/admin/svetaine`, owner-only, nav group Nustatymai): switch for the public "coming soon" gate (ADR-0068). New `site_settings` table (migration `20261112140000_site_settings.sql`, APPLIED and verified; follow-up `20261112141000_site_settings_grants.sql` (grant tightening) applied and verified), `lib/site-gate-flag.ts` (proxy, `/netrukus` and the code action now read the flag asynchronously), `setComingSoon` server action (`app/admin/site-settings-actions.ts`), `AdminData.siteSettings`, `SiteSettingsView`. `SITE_GATE=1` is now only the fallback when the database is unreachable. `tsc`/eslint clean; not browser-checked (needs the table).

- 2026-11-11 Copy pass on public pages (Lithuanian text only, owner's wording). Home: sauna, quads, cabins and wake card notes; night section; "03 / RŪPESČIUS PALIKITE MUMS", "VISKAS VIENOJE ORBITOJE." and its intro; NAKVYNĖ accordion row; "APŽIŪRĖK VANDUO MARSE PARKĄ."; hero intro; two FAQ items. Footer kicker "LAUKSIME JŪSŲ" (every page). `/renginiai`: title "Kas vyksta / Vanduo Marse", intro, aside "Tavo renginys" / "Ieškai erdvės savo renginiui?". `/kuponai`: title "Geriausia dovana / Vanduo Marse dovanų kuponas", two-paragraph intro (`BookingHeader` `intro` now takes `string | string[]`), steps in the "Jūs" form, picker group "Pasirinkite dovanų kuponą", order-form note. `/pirtis` (`service-content.ts`): title "…šalia Kauno" (also the page `<title>` and Service JSON-LD), summary, description, wood-sauna, Finnish-sauna and "Privatus renginys pirtyje?" facts. `--text-statement-sm` is now `clamp(2.5rem, 13vw, 3.625rem)` so "ORBITOJE." fits at 320–375 px. `tsc` and eslint clean; checked in the browser, the longer headings at 320 and 375 px. Open: `/kuponai` step 02 text and the coupon verification dialog still use the "tu" form; `/pirtis` copy says "kalendoriuje" while the section is "Tvarkaraštis".

- 2026-11-12 `/pirtis` private booking: Asmenų skaičius moved after Laikas (new `SaunaServicePeople`, split from `SaunaServiceHourly`), so the order is Tipas, Pirtis, Trukmė, Pirtininkas, Data, Laikas, Asmenų skaičius, extras. Order checked in the browser.

- 2026-11-12 `/pirtis` booking panel: the Tipas chips (Privati pirtis / Pirties seansas) are left-aligned like the Pirtis chips. Not browser-checked.

- 2026-11-12 `UpsellPicker`: extras are stacked one per row at every width (was two columns from `sm`), so the Beržinė vanta / Rankšluostis steppers no longer sit side by side in the narrow booking panel. Not browser-checked.

- 2026-11-12 `/pirtis` private booking panel follows the owner's mockup: Tipas, Pirtis, then Trukmė (tiles, "Bazinė kaina 160 € I–IV · – V–VII" before a date, the day's price after), Pirtininkas (tiles: Be pirtininko 0 € / name +price, "bent 3 val." note), Asmenų skaičius (slider with the included-guests note), Data, Laikas, extras. New `SaunaServiceHourly` (`components/services/sauna-service-hourly.tsx`); length and pirtininkas are held as a local draft until a time is picked, then move into the pick; `hourlyStartHours(data, sauna, day, busy, wantedHours)` only lists starts where the chosen length fits; a length the chosen day does not offer (2 h on Fri–Sun) is disabled and the next one is used. Browser-checked at 390 px (Thursday and Friday). Not done: the plan panel still shows 0 € until a time is chosen (the mockup shows a price per day type there).

- 2026-11-12 "Visa diena" length: `FULL_DAY_HOURS = 12` in `lib/sauna.ts` is a 12 h key in the price tables (whole opening day, bookable only from the opening hour), shown as "Visa diena" via `hoursLabel`; `/admin/pirtis` rates form has a "Visa diena" row (`LENGTH_SLOTS` gained 12). No price is set yet, so it stays hidden on the storefront until staff fill it in; with a pirtininkas the price adds on top. No migration (jsonb tables, `saunas.max_hours` allows 12). `tsc`/eslint clean; not browser-checked (needs a price).

- 2026-11-12 `/pirtis` booking panel (`SaunaServiceBooking`): "Privati pirtis" is now booked by the hour instead of through fixed-length private programs. After sauna type and date, the Laikas select lists the day's free starts (`hourlyStartHours` in `lib/reservation.ts`), then a people stepper, the pirtininkas select, the 2/3/4 h duration picker (prices from the sauna tables, weekday or Fri–Sun) and extras (`SaunaHourlyOptions`). `SaunaServiceVenue.programs` became `hasPrices`. Private programs still exist on `/rezervacija` and in the Kainos list. Browser-checked on `/pirtis` (390 px, Thursday): starts 10–15, 2/3/4 h at 160 / 220 / 240 €, with Tomas 3 h minimum and 470 €. `tsc`/eslint clean.
- 2026-11-12 Pirtininkai (ADR-0067). New "Pirtininkai" card on `/admin/pirtis` above "Priedai" (`MastersCard`, `MasterDialog`, `MasterRow`; `saveSaunaMaster` / `deleteSaunaMaster`, `AdminData.saunaMasters`). Storefront `/rezervacija`: `MasterPicker` select under hourly hire and a selected private program; `SaunaPick.masterId`, `SaunaPlan.master` / `ProgramPlan.master`, price and his minimum hours in the plan; `masterId` in the sauna and program booking requests. Migration `20261112120000_sauna_masters.sql` APPLIED to the live project via the project-3 MCP slot after checking `get_project_url`: `sauna_masters` table + RLS, the generic `pirtininkas` extra copied into it and switched off, `p_master_id` on `create_sauna_booking` / `create_program_booking`. `database.types.ts` edited by hand. `tsc`/eslint clean; not browser-checked.
- 2026-11-12 Sauna pricing per session length (ADR-0066), from the owner's sheet. Migration `20261112090000_sauna_duration_pricing.sql` (applied to the live project `mwngljhcvqkvncwbmgeo` via the project-3 MCP slot after checking `get_project_url`; verified: both saunas hold the new prices, `pirtininkas` linked to both, `sauna_taken` runs): `saunas.weekday_prices` / `weekend_prices` / `included_guests` / `extra_guest_fee` / `turnaround_hours`, `sauna_upsells.min_hours`, the `pirtininkas` extra (250 €, min 3 h), `private.sauna_prices`, and new bodies for `create_sauna_booking`, `accept_inquiry_stays` and `sauna_taken`. App: `lib/sauna.ts` pricing rewritten (`sessionPrice(hours, party, rates, day?)`, `sessionLengths`, `minHoursFor`, `fromPrice`), `/admin/pirtis` rates form (price per length for weekdays and Fri–Sun, guest fee, turnaround), extra dialog "Minimali seanso trukmė", storefront `SaunaBooking`, `DurationPicker`, `StartTimeGrid`, `/rezervacija` plan (`planHourly`), admin new-booking dialog, event calculator. `database.types.ts` edited by hand (matches `supabase gen types` apart from column order). `tsc` and eslint clean; not browser-checked.
- 2026-11-12 Live data (project `mwngljhcvqkvncwbmgeo`): deleted the events in categories vakarai, akademija and sventes (4 rows, none with tickets) with `supabase db query --linked`. No code change.
- 2026-11-12 `/admin/renginiai`: removed the "Bilietai ir registracijos" card grid under the events table (ticket cards with status actions); tickets stay in the data and Kalendorius. `tsc`/eslint clean; not browser-checked.
- 2026-11-12 `/admin/renginiai`: bulk select in the events table (row checkboxes, select-all with indeterminate state, "Pasirinkta: N" bar with "Ištrinti pasirinktus"), confirmed by new `DeleteEventsDialog` which calls `deleteEvent` per id. New `components/ui/checkbox.tsx` (Radix, 44 px tap area). `tsc`/eslint clean; not browser-checked (staff sign-in).
- 2026-11-12 `/admin/keturraciai`: the "Parkas" tab and its fleet card are now "Inventorius" (tab id `inventorius`, `?tab=inventorius`). Label only; no data change.
- 2026-11-12 Public-page composition and load pass (vercel-composition-patterns / vercel-react-best-practices review). `Stepper` loses its `compact` and `hideLabel` props: `Stepper` (boxed), `CompactStepper` (label above) and `StepperControls` (bare row) share one implementation, and the 21 call sites are migrated. `ServiceSchedule` (`hasCalendar`) becomes `CalendarSchedule` / `InquirySchedule`. `EstimateSummary` loses `showTotal`; the home drawer uses the new `EstimateBreakdown`. `SignaturePad` takes `ref` as a prop (no `forwardRef`); `LandingProvider` and `stepped.tsx` read context with `use()`. `LandingProvider` loads both drawers through `next/dynamic`, mounted at idle. `/rezervacija` renders its shell and streams the availability-dependent flow inside `Suspense` with a skeleton fallback. `getStayTypes`, `getCalculatorCatalog`, `getParkEvents` and `getCouponProducts` are wrapped in `React.cache` (one query per request). Hero, header-logo and gallery images use `loading="eager"` + `fetchPriority="high"` instead of the deprecated `priority`; the mid-page moments gallery no longer preloads its first slide. `next.config.ts` adds `optimizePackageImports` for Phosphor (no measurable change in a production build). Measured first-load script transfer on a production build, cold cache: `/` 306 → 320 KB (+14, the drawers now arrive at idle as separate chunks), `/rezervacija` 374 → 330, `/renginiai` 332 → 246. `tsc`, eslint and `pnpm build` clean; checked in the browser at 375 px on `/`, `/skaiciuokle`, `/rezervacija`, `/pirtis`, `/vandenlentes` (drawer opens before and after the idle mount; stepper +/typing/Enter). The dark and compact stepper variants were not compared by eye. Not done: `Suspense` on `/[service]` (its photos and schedule need the data), the numbered `01 /` activity labels and other design-tell cleanups.
- 2026-11-12 Supabase audit fixes, migration `20261111174736_security_hardening.sql` (applied to the live project `mwngljhcvqkvncwbmgeo` via the `project-3` MCP slot; verified as `anon`: public reads work, bookings/events writes blocked, bad birth date and missing contact rejected). `register_rider_public` throttled and validated, `finalize_rider_registration_public` path-checked, `rls_auto_enable()` revoked from API roles, `anon` table grants cut to SELECT on 13 policy-backed tables, 7 foreign-key indexes added (ADR-0064). Still open: turn on leaked-password protection in the Auth dashboard; 23 `multiple_permissive_policies` advisories left as they are. Types unchanged; no app code changed; storefront registration not re-run end to end.
- 2026-11-11 `localBusinessSchema()` now includes `postalCode: "54312"` (confirmed by the owner; the old directories also list 54311).
- 2026-11-11 SEO follow-up: `BookingPage` now wraps its content in `<main id="turinys">` and starts with a skip link (inner pages had no main landmark or bypass link); `/keturraciai` and `ServicePage` use a `<div>` instead of their own `<main>`; `next.config.ts` sends `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` on every route except `/embed/*` (those keep the `frame-ancestors` CSP from `proxy.ts`); `DayCell` aria-label starts with the weekday shown on the cell; the home hero sticker link drops its redundant `aria-label`. No CSP yet (Stripe, Supabase and Next inline scripts need a nonce setup). `tsc` and eslint clean, production build passes, headers checked with curl; not checked by eye.
- 2026-11-11 SEO pass from a local squirrelscan audit: new `lib/seo.ts` (`pageMetadata`, `metaDescription`) gives every public page a canonical, Open Graph and Twitter tags (home, /rezervacija, /renginiai, /kuponai, /skaiciuokle, [service], new pages); titles use the `| Vanduo Marse` suffix via the layout template; `components/json-ld.tsx` + `lib/structured-data.ts` add `SportsActivityLocation` JSON-LD on the home page and `Service` JSON-LD on each service page (no postal code yet: the owner's sources disagree, 54311 vs 54312); new pages `/kontaktai` (`components/contact/contact-details.tsx`) and `/privatumo-politika` (`components/legal/*`, DRAFT text for the owner to review); `components/footer-links.tsx` links every service page, contacts and privacy from the footer (fixes 5 orphan service pages); both new pages are in `app/sitemap.ts`; `public/llms.txt`; `aria-controls="menu-panel"` only while the menu is open. `tsc` and eslint clean on changed files; production build passes; squirrelscan Core SEO 45 to 90, Links 85 to 95, Structured Data 96, Social 100.
- 2026-11-11 Security review follow-up for `my_riders()`: new migration `20261111220000_my_rider_exact_phone.sql` (applied to the live project and verified) replaces the last-8-digits phone match with an exact match on normalised numbers (`private.normalize_phone`), so a foreign number ending in the same digits cannot see a rider's plan. 
- 2026-11-11 Security review follow-up #2 for `my_riders()`: new migration `20261111230000_my_rider_account_phone_plain.sql` (applied to the live project `mwngljhcvqkvncwbmgeo` via `supabase db query --linked` and verified) normalises only the staff-entered phone (`riders.phone`/`phone2`); the account phone (`auth.users.phone`, already E.164) is compared as plain digits, so the Lithuanian trunk rules (8…/6…) cannot rewrite a foreign account number into a `370…` match.
- 2026-11-11 `SidebarMenuBadge` (large rows): replaced the fixed `top-3.5` offset by `top-1/2 -translate-y-1/2`, so the count badge is centred on the row whatever its height (the earlier offset needs a page reload to show and still depended on the 48 px row). `tsc` clean; not browser-checked.
- 2026-11-11 `components/ui/sidebar.tsx` `SidebarMenuBadge`: for large menu rows (`size="lg"`, 48 px, as in the admin sidebar) the badge top offset is `top-3.5` instead of `top-2.5`, so the count badge is vertically centred with the row label (it sat 4 px high). `tsc` clean; not browser-checked.
- 2026-11-11 Admin sidebar layout: Apžvalga, Klientai, Užklausos and Kalendorius are now one header-less group (`apzvalga`); the separate `klientai` group is removed from `AdminNavGroup` / `ADMIN_NAV_GROUPS`. Two adjacent header-less groups each added their own padding, which left an uneven gap after Apžvalga. `tsc` clean; not browser-checked (needs an admin login).
- 2026-11-11 Admin sidebar: Kuponai moved to sit right after Kainodara, under Nustatymai (order: Kainodara, Kuponai, Nuolaidos, Darbuotojai, Pranešimai); its pending-coupons badge is unchanged. `tsc` clean; not browser-checked.
- 2026-11-11 Admin sidebar: Nuolaidos moved to sit right after Kainodara, under Nustatymai (no longer under Paslaugos). `tsc` clean; not browser-checked.
- 2026-11-11 Admin sidebar: Kalendorius moved to sit right after Užklausos (it joins the header-less Klientai group, so Paslaugos now starts with Pirtis). Order: Apžvalga, Klientai, Užklausos, Kalendorius, Paslaugos (Pirtis, Namukai, Keturračiai, Kuponai, Nuolaidos, Vandenlentės), Turinys, Nustatymai. `tsc` clean; not browser-checked.
- 2026-11-11 Admin sidebar: Užklausos moved to sit right after Klientai (it joins the header-less Klientai group, so it is no longer under Paslaugos). Order: Apžvalga, Klientai, Užklausos, Paslaugos (…), Turinys, Nustatymai. `tsc` clean; not browser-checked.
- 2026-11-11 Admin sidebar: the group "Pardavimai" is renamed "Paslaugos" (the group id stays `pardavimai`; the Apžvalga sales table keeps its "Pardavimai" title), and Klientai now sits right after Apžvalga (group order Apžvalga, Klientai, Paslaugos, Turinys, Nustatymai; `ADMIN_NAV` entry moved too, so the mobile tab bar order is Apžvalga, Klientai, Kalendorius). `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` `ProgramTile`: the price line ("350 € / grupei · 3 val.") is smaller (`text-sm`) and `font-medium` instead of `text-figure font-bold`. `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/uzklausos` is now a board: three columns (Nauja / Susisiekta / Pasiūlymas, with counts) and the inquiry cards drag between them to change the status (`InquiriesBoard`, `InquiryCard`; native HTML5 drag and drop, no new dependency; optimistic through `setInquiryStatus`, with a toast). The status filter chips and the status badge on cards are gone; a card's title still opens the panel, whose status select remains the way to change it on touch screens and with the keyboard. No data change. `tsc`/`eslint` clean; not browser-checked (needs an admin login).
- 2026-11-11 `RiderSelect` (the "Esamas naudotojas" dropdown when adding a bilietas / plan): each row shows the rider's e-mail in small text under the name, and the search also matches e-mail (placeholder "Ieškoti pagal vardą, el. paštą ar telefoną"). `tsc` clean; not browser-checked.
- 2026-11-11 Migration `20261111210000_my_rider.sql` applied to the live Vanduo project (`my_riders()`; verified: anon cannot execute it, authenticated can; recorded under the apply-time version). The /paskyra Vandenlentės tab now reads real data.
- 2026-11-11 `/paskyra` Vandenlentės tab: shows the customer's wakeboard rider record (`components/account/rider-plans.tsx`): current plan (name, description, category, price), bracelet number(s) and previous plan purchases, or an empty note with a link to `/registracija`. Data comes from the new `my_riders()` (matched by confirmed e-mail or phone, last 8 digits; ADR-0062). Migration `20261111210000_my_rider.sql` is **not applied** (blocked by the permission classifier): until it is, the tab is empty. `MyRider`, `loadMyRiders`, `AccountTabs` now has six tabs. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/paskyra` account card: an account without a phone (for example one created with an e-mail) shows "Pridėti telefoną" (`components/account/add-phone.tsx`): enter the number, Supabase texts a code (`sendPhoneChangeCode` -> `auth.updateUser({ phone })`, same E.164 and allowed-destination rules as sign-in), then `confirmPhoneChange` (`verifyOtp` type `phone_change`) makes it a confirmed phone. Errors: number already on another account, bad code. Once confirmed, the phone also pre-fills forms and links phone-matched quotes (ADR-0061). `tsc`/`eslint` clean; not run end to end (sends a real SMS, needs the Supabase phone provider).
- 2026-11-11 `/paskyra` quote popup (`InquiryList`): the close X sat at the top-left because the default `DialogContent` close button is a sticky grid item and the popup is a flex column; the popup now uses `showCloseButton={false}` and its own absolute top-right `DialogClose` (44 px). Any new dialog built as `flex … p-0` needs the same. `tsc` clean; not browser-checked as a customer.
- 2026-11-11 `/paskyra` Pasiūlymai: the "Gauta" / status badge is removed from the quote cards and the popup; only the "Priimta, nameliai ir pirtys užimti" marker shows, once staff accepted the quote (the popup subtitle otherwise reads "Išsiųsta <date>"). `INQUIRY_STATUS_LABEL` is no longer used by the list. `tsc` clean; not browser-checked.
- 2026-11-11 `/paskyra` Pasiūlymai: each quote card opens a popup with the whole quote (`InquiryList` is now a client component with a `ui/dialog`): status, estimate, date, guests, space, sent date, the estimate breakdown by group, the customer's comment and contact details. `my_inquiries()` was widened for it (migration `20261111200000_my_inquiries_details.sql`, applied to the live project and verified: anon cannot execute it). `tsc`/`eslint` clean; not browser-checked as a customer.
- 2026-11-11 Calculator inquiry form (`InquiryForm`): after "Siųsti užklausą" succeeds a modal (`ui/dialog`) confirms "Užklausa išsiųsta" with the contact promise, a "Gerai" button and a link to `/paskyra`; the inline thank-you stays behind it. `tsc`/`eslint` clean; not browser-checked (sending creates a real inquiry).
- 2026-11-11 Calculator `EstimateSummary`: group headings (Erdvė, Maistas ir gėrimai, …) are `font-bold` in ink, line prices are `font-bold`, line names stay regular in `text-ink/80`, so the breakdown has a clear hierarchy instead of all-regular text. `tsc` clean; not browser-checked.
- 2026-11-11 Calculator inquiry form (`InquiryForm`): when a customer is signed in, "Siųsti užklausą" pre-fills their confirmed e-mail, phone and saved name (never over what was typed), loaded through the new `loadCurrentCustomer` action so it also works in the static home-page drawer. `tsc`/`eslint` clean; not browser-checked (needs a customer login).
- 2026-11-11 `/paskyra` tabs: the customer page now has Visi / Pirtis / Namukai / Keturračiai / Pasiūlymai (`components/account/account-tabs.tsx`, with counts). `MyRequest` gained `kind` (event tickets show only under Visi); the Pasiūlymai tab lists the customer's calculator quotes (`InquiryList`, `MyInquiry`, `loadMyInquiries` through `my_inquiries()`, ADR-0061) with status and "Priimta" once staff held the cabins / saunas. Migration `20261111190000_my_inquiries.sql` applied to the live project (verified: anon cannot execute it). `tsc`/`eslint` clean; not browser-checked (needs a customer login).
- 2026-11-11 `/paskyra` `RequestList`: the visible "Rezervacijos" heading is removed (the page is already titled "Mano rezervacijos"); the section keeps `aria-label="Rezervacijos"`. `tsc` clean; not browser-checked.
- 2026-11-11 Hamburger menu (`MenuPanel`, `MainHeader`): new optional `account` prop renders a dark "Mano paskyra" button to `/paskyra` right under the big links, so it is visible without scrolling on phones (the 5th big link "Mano rezervacijos" points to the same page). `tsc` clean; checked at 375 px on `/skaiciuokle`.
- 2026-11-11 `SiteHeader`: while the coral menu panel is open the bar now uses ink text (nav links, their underline, the close button border and its X) instead of dust, which was nearly invisible on coral. `tsc` clean; not browser-checked.
- 2026-11-11 Calculator option cards: the controls row (stepper, Pasirinkti) no longer has a top border or top padding (`CalculatorOptionCard`). `tsc` clean; not browser-checked.
- 2026-11-11 Migration `20261111180000_inquiry_stay_holds.sql` applied to the live Vanduo project (ref `mwngljhcvqkvncwbmgeo`, verified through MCP slot `supabase-project-3`; recorded as version `20261111164744`). Accepting calculator inquiries (cabins, saunas, programs, extras) is now live in the database; the accept flow itself is still untested.
- 2026-11-11 Calculator sauna extras: the hardcoded "Pirtininkas" toggle (`PRICES.saunaMaster`, `SaunaPick.master`) is removed; each sauna card now offers the real extras (priedai) from `sauna_upsells` that sauna offers (`SaunaPick.extras`, `CalculatorCatalog.upsells`; counted ones get a stepper, the rest an on / off row), priced with `upsellTotal` and added to the estimate. Accepting an inquiry copies them into `booking_extras` and adds them to the booking total (still-unapplied migration `20261111180000_inquiry_stay_holds.sql`, priced from `sauna_upsells`, only extras linked to that sauna). The inquiry sheet lists them. `tsc`/`eslint` clean; card checked in the browser, accept flow not run.
- 2026-11-11 Calculator sauna programs: each sauna card offers "Pagal valandas" or that sauna's active private programs (`CalculatorCatalog.programs`, `SaunaPick.programId`); a program fixes the length (rounded up to whole hours, `programHours`) and the flat price (`programTotal`) and hides the Pirtininkas toggle. Accepting an inquiry books the program (`bookings.program_id`) with the program's own length and price, validated in the still-unapplied migration `20261111180000_inquiry_stay_holds.sql` (`program_missing` error). The inquiry sheet shows the program name. `tsc`/`eslint` clean; `/skaiciuokle` checked in the browser, accept flow not run.
- 2026-11-11 Security review fix (migration `20261111180000_inquiry_stay_holds.sql`, still unapplied): `accept_inquiry_stays` now prices a held sauna itself from the `saunas` row (mirrors `sessionPrice`) instead of trusting the visitor-supplied calculator input, and rejects hours or start times outside the sauna's min / max hours and opening hours; `saunaTotals` was removed from the inquiry input and `Estimate`. Cabin totals were already computed from `stay_types`.
- 2026-11-11 Calculator option cards (`CalculatorOptionCard`): the quantity stepper and the Pasirinkti / Pašalinti button now sit on one row (wrapping on narrow cards) instead of stacked. `tsc` clean; not browser-checked.
- 2026-11-11 Calculator Pirtis: the generic "Pirtis" card is replaced by one `CalculatorSaunaCard` per active sauna from the database (name, description, "Iki N asm.", price from its own rates, hours, start hour, Pirtininkas); `EstimateInput.saunaHours` / `saunaMaster` became `saunas` (id -> `{ hours, startHour, master }`), `estimate(input, catalog)` takes `{ stayTypes, saunas }` , `/skaiciuokle` and the home drawer load the catalog (`getCalculatorCatalog` / `loadCalculatorCatalog`). Accepting an inquiry also books each sauna that has a start hour (extended, still unapplied migration `20261111180000_inquiry_stay_holds.sql`; ADR-0060); the inquiry sheet lists cabins and saunas. `tsc`/`eslint` clean; `/skaiciuokle` checked in the browser (real saunas shown, picker opens), accept flow not run.
- 2026-11-11 Calculator Pramogos: the two WAKE cards (`WakeCards`) gained descriptions, so all four cards (WAKE plaukimas, Privati WAKE trasa, Pirtis, Keturračiai) share the same title / description / price layout and the private WAKE card no longer shows an empty gap above its divider. `tsc` clean; not browser-checked.
- 2026-11-11 Calculator inquiries can be accepted (ADR-0060): the inquiry sheet shows the quoted cabins and a "Priimti ir užimti namelius" button that books them as confirmed stay bookings on the event date (migration `20261111180000_inquiry_stay_holds.sql`, **not yet applied**: adds `inquiries.accepted_at`, `bookings.inquiry_id`, `accept_inquiry_stays` / `release_inquiry_stays`); "Atlaisvinti namelius" undoes it. The inquiry card shows "Namukai užimti". `Inquiry` gained `stays`, `stayNights`, `acceptedAt`. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Cabins (Nakvynė) are manageable: new owner-only `/admin/namukai` (sidebar row "Namukai", `components/admin/namukai/`) to add, edit, hide and delete cabin sizes and camper pitches (name, note, guest limit, units, € / night); ADR-0059. The public booking (`/rezervacija`, `/nakvyne`, `/embed/miegas`, home drawer) and the event calculator now read `stay_types` instead of the hard-coded `CABIN_SIZES` (removed with `ROOM_TYPES`, `roomPrice`, `cabinStayType`); stay picks are `{ typeId, nights, units }`. Admin helpers take the types (`bookingTypeLabel(b, stayTypes)`, `fullStayNights`, `stayStock`). No migration. `tsc`/`eslint` clean; public pages checked at 375 px, the admin page itself not browser-checked (needs an owner login).
- 2026-11-11 Calculator food-section category tabs (`components/calculator/food-section.tsx`): the active tab kept its light text on hover (`data-active:hover:text-dust`); before, the base `hover:text-foreground` turned the label dark on the dark `bg-ink` tab. Not browser-checked.
- 2026-11-10 Big Shoulders removed (ADR-0057): `app/layout.tsx` no longer imports it, which also ends the "Failed to find font override values for font `Big Shoulders`" warning on every compile. `font-display` now falls back to Termina; the `Wordmark` (coming-soon page) uses Termina Bold at smaller sizes (`font-wordmark`, `wordmark-size` in `app/globals.css`). The `design-check-ignore` comment for it is gone. `DESIGN.md` forbids any second font family. `tsc`/`eslint` clean; wordmark not browser-checked.
- 2026-11-11 `/admin/pirtis`: removed the show / hide switches from the Pirtys and Priedai rows (`SaunaRow`, `UpsellRow` lost `onToggle`; the cards no longer call `setSaunaActive` / `saveUpsell` for it). Visibility is set with the "active" control in the sauna editor and the extra's edit dialog; hidden items stay dimmed or struck through. Programos is unchanged. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis`: Pirtys and Priedai are lists again, as in the owner's reference image, inside their card frames: `SaunaRow` (`sauna-row.tsx`: cover thumbnail or flame, name + details linking to the editor, show / hide switch, "⋯" menu with Redaguoti / Ištrinti) and `UpsellRow` (`upsell-row.tsx`: name, description, offered-by, price with unit, switch, menu), divided by thin lines. `SaunaTile` and `UpsellTile` are deleted; Programos keeps its `ProgramTile` cards. The show / hide switch and the thumbnail are back on the sauna rows because the reference shows them; there is still no reordering. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` sauna cards: the separate pencil icon and the "Perkelti aukštyn / žemyn" menu items are removed; the header's "⋯" menu is now "Redaguoti" and "Ištrinti" (the name still links to the editor). Because those were the only reorder controls, saunas can no longer be reordered from the admin; the order on the website stays whatever it is now (`reorderSaunas` in the store is unused by the UI). `SaunaTile` lost its `first` / `last` / `onMove` props. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `AdminSection` header layout now follows the section's own width (Tailwind container query, `@container` on the section and `@xl:` on the header) instead of the viewport: in a narrow section, such as the 30 % Pirtys / Priedai column, "Naujas priedas" stacks below the heading and note and the note gets the full width; in a wide section (Programos, the coupon catalogue) the button stays beside the heading. Supersedes the `sm:` rule from the earlier entry. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` Programos: the "Naujas seansas" / "Nauja programa" button moved from the (now empty) section header into the tabs row, right-aligned beside the Seansai / Programos tabs (wraps below them on phones). `AdminSection` with `hideHeading` and no action renders no header row at all, so the gap above the tabs is gone. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` Programos: the visible "Programos" heading and its note are removed; the header row is just the "Naujas seansas / Nauja programa" button. New `hideHeading` option on `AdminSection` keeps the heading as `sr-only` so the section is still labelled for screen readers. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `AdminSection` header: the action button ("Naujas seansas" / "Nauja programa" / "Naujas priedas" / "Naujas kuponas") now stays on the same row as the heading and note from `sm` up (the note shrinks, the button does not) instead of wrapping under it; on phones it still stacks below. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` sauna cards: a pencil edit icon now sits at the top right of the card header (next to the "⋯" menu, which keeps move up / move down / delete), and the footer with the show / hide switch is gone. Visibility is still set with the "active" switch in the sauna editor (`/admin/pirtis/<id>`); `onToggle` / `setSaunaActive` are no longer used by `SaunasCard`. Hidden saunas show a dimmed card and "(paslėpta)". `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` sauna cards: removed the "Rodoma / Paslėpta" label and the up / down arrow buttons; the footer is just the on/off switch and the "⋯" menu. Reordering stays available as "Perkelti aukštyn / žemyn" in that menu, now shown at every width (it was phone-only). `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis`: removed the cover image (and the flame placeholder) from the sauna cards; `SaunaTile` now starts with the name and details, so the sauna cards are much shorter. The photo count stays in the details line and photos are still managed in the sauna editor. `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` layout: from `lg` the page is a 10-column grid. Programos is the main 70 % column (its program cards 1 / 2 / 3 per row, was 4) and Pirtys stacked above Priedai form the 30 % column beside it (one card per row there); below `lg` the three stack in the order Programos, Pirtys, Priedai. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis`: the card background is back around Programos, Pirtys and Priedai (new `framed` option on `AdminSection`, which renders the heading row in a `CardHeader` and the content in a `CardContent`); the tiles stay inside as cards. The coupon catalogue keeps its unframed section. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis`: removed the "Nauja pirtis" button from the page header. The create route `/admin/pirtis/nauja` still exists but nothing in the admin links to it now, so a new sauna can only be reached by typing the URL until a new entry point is added. `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis`: removed the "Žr. klientus →" link at the bottom of the page (customers stay in the sidebar). `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` Priedai: the heading and note are back to the normal section style (the `compact` option of `AdminSection` is removed); the outline button and slim cards stay. `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` Priedai made less prominent: `AdminSection` gets a `compact` option (small muted heading and note, tighter spacing), the "Naujas priedas" button is an outline button, and `UpsellTile` is a slim `size="sm"` card (name + switch + menu on one line, then "5 € · už vienetą · description" and the saunas offering it) instead of a tall block; 8 px between cards. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` Programos section: the Seansai tab is now first and opens by default; Programos is the second tab (the header button follows the open tab as before). `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis` order: Programos (full width, with its Programos / Seansai tabs) is now the first section; Pirtys and Priedai follow side by side. Reorder only (`sauna-view.tsx`). `tsc` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis`: the list items of all three sections are now card blocks instead of bordered rows: `SaunaTile` (`sauna-tile.tsx`: cover image, name linking to the editor, from-rate, labelled switch, order arrows, menu), `UpsellTile` (`upsell-tile.tsx`) and `ProgramTile` (`program-tile.tsx`: name + menu, price line, kind, labelled switch; hidden ones dimmed). Grids: Pirtys and Priedai 1 column on phones, 2 from `sm`, 1 in the half-width column at `lg`, 2 again from `xl`; Programos 1 / 2 / 4 columns. `AdminRow` is removed. "Papildomos paslaugos" is renamed "Priedai" everywhere in the admin (section title, "Naujas priedas" button, empty text, toast, the sauna editor card and its hint, the Pirtys page description, the permission hint, the Kainodara note, the price preview). Behaviour is unchanged. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/pirtis`: Pirtys, Programos and Papildomos paslaugos are no longer wrapped in cards. New `AdminSection` / `AdminRow` (`components/admin/admin-section.tsx`): the heading, note and action sit on the page background and each list item is its own bordered, padded block (the divided rows are gone). From `lg`, Pirtys and Papildomos paslaugos are two columns side by side and Programos (with its Programos / Seansai tabs) is full width below. The coupon catalogue section now uses `AdminSection` too. Behaviour is unchanged. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/kuponai` "Parduodami kuponai" is no longer wrapped in an outer card: `CouponProductsCard` is a plain `<section>` (heading, note and the "Naujas kuponas" button on the page background) and the product cards sit directly below it, so there is no card inside a card. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/kuponai` "Parduodami kuponai": the divided list is replaced by a grid of card blocks (`CouponProductTile`, new `coupon-product-tile.tsx`; 1 column on phones, 2 from `sm`, 4 from `xl`): name with the actions menu (44 px target), price in the figure type, the service, and a labelled "Parduodamas / Paslėptas" switch; hidden products are dimmed. Behaviour (toggle, edit, delete) is unchanged. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/kuponai`: removed the service select and the "Užsakyta nuo / iki" date pickers above the list; the status chips and search remain. (The service select also showed two labels at once, because the `visi` coupon service and the "Visos paslaugos" option shared one value.) `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Sales stats: removed the "Pajamos laikui bėgant" chart and the "Pagal kategoriją" breakdown (`sales-chart.tsx`, `sales-breakdown.tsx` deleted) and the bucket / category calculations behind them (`lib/admin/sales-stats.ts` now returns only `couponsSold`, `current`, `previous`). The section is the category tabs, three stat cards and the table. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Sales stats: removed the line above the cards that named the dates covered and the previous period compared with (`PeriodNote`). The note about coupons being left out of Pajamos remains, shown only when coupons were sold. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Apžvalga sales filters reduced to the category tabs: the period buttons (Šiandien / 7 d. / 30 d. / Šis mėnuo / Visi), the two date pickers, the status select and the search box are removed, and the section opens on all dates (`useSales` starts with an empty range, so the stats read "Visas laikotarpis", have no previous-period comparison and chart per month once the history is long). Cancelled sales stay hidden. `SALE_RANGES` is gone. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Apžvalga: removed the Kalendorius week card (`week-calendar.tsx` deleted). The page is now just the Pardavimai section (filters, stats, charts, table); the calendar stays at `/admin/kalendorius`. Description: "Pardavimų suvestinė ir visi pardavimai." `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Apžvalga: removed the "Reikia dėmesio" tiles (`attention-strip.tsx` deleted); the page now starts with the week calendar. Pending work is still shown as the sidebar / tab-bar badges. Page description is "Savaitės kalendorius ir pardavimai." `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Apžvalga week calendar spacing: the day's items are padded, bordered cards (`border bg-card px-3 py-2.5`, `hover:border-ink`) with 8 px between them instead of a divided list with no side padding; the date + "Visas kalendorius" row sits 8 px above the list (it was 16 px plus a tall link row), card content gap 16 -> 12 px, and the empty message is a dashed box. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Apžvalga: "Šiandienos tvarkaraštis" and "Naujausios užklausos" are replaced by one full-width week calendar (`week-calendar.tsx`): Monday-first day chips with a count each, prev / "Šiandien" / next week buttons, and the chosen day's items from every service below (rows open the booking / rental drawer; an event opens Kalendorius). `today-schedule.tsx` and `latest-inquiries.tsx` are deleted; new inquiries stay visible through the attention tiles and `/admin/uzklausos`. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Apžvalga reworked after a UI/UX review. New order: "Reikia dėmesio" tiles (`attention-strip.tsx`, pending counts linking to their pages, permission-aware) -> today's schedule from all services (`today-schedule.tsx`, same entries as Kalendorius, rows open the booking / rental drawer) beside the latest inquiries (`latest-inquiries.tsx`, rows link, empty state) -> a "Pardavimai" section: filters, stats, table. Filters moved out of the table card to sit above the stats; the stats name the period, the comparison period and the coupons left out. Coupons no longer count in Pajamos (they would double count with the bookings they pay for; ADR-0058) and the table sum says "(be kuponų)". Labels: "Pardavimų skaičius", "Vidutinė suma". Removed the Vandenlentės stat strip ("Aktyvūs abonementai", "Šiandien parduota"). Chart: at least 14 slots so one sale is a bar, a "largest" line and baseline, caption wraps on phones; category card no longer stretches. Sale dates and "today" use Europe/Vilnius. Page description updated. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Apžvalga order: the sales stats block (three stat cards, revenue chart, category split) is now the first thing on the page, above the schedule. Its filters still live in the Pardavimai card at the bottom, so filter state moved into a shared hook `useSales` (`components/admin/overview/use-sales.ts`) used by `Overview`; `SalesTable` is now controlled (`all`, `filters`, `onFiltersChange`) and is remounted on a filter change to reset its 50-row page. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 `/admin/kuponai`: the coupon order cards are replaced by a table (`CouponList`, `components/admin/coupons/coupon-list.tsx`: ordered at, coupon + reference, service, buyer, code, value / balance, status; row click opens `CouponSheet`; 50 rows per page). Filters: the status chips and search stay, plus a service select and an "Užsakyta nuo / iki" date range. `CouponCard` is deleted. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Apžvalga: removed the "Artimiausi renginiai" card (next four published events) and the `events` / `formatDay` use only it needed. Events are still managed at `/admin/renginiai`. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Apžvalga: the section heading above the two bracelet stat cards reads "Vandenlentės" instead of "Apyrankės" (matches the sidebar and the sales category); the "Valdyti" link still goes to `/admin/apyrankes`. Copy only.
- 2026-11-11 Pardavimai rows are clickable (row or the item text, which is a real button for keyboard use). Bookings (Pirtis, Nakvynė), quad rentals and coupons open their existing details drawer (`BookingSheet`, `RentalSheet`, `CouponSheet`) right on the overview; tour and event tickets go to `/admin/keturraciai`, `/admin/pirtis` or `/admin/renginiai`; bracelet plan sales go to the customer page `/admin/klientai/<riderId>`. New `Sale.target` / `SaleTarget` in `lib/admin/sales.ts`. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Apžvalga Apyrankės row: removed the "Apyrankės priskirtos" and "Naudotojai iš viso" cards (and the `riderCards` / icon imports only they used); "Aktyvūs abonementai" and "Šiandien parduota" remain. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Apžvalga: the top row of four stat cards (Šiandien, Laukia patvirtinimo, Naujos užklausos, Šio mėnesio suma) is removed from `overview.tsx`, with the values and imports only it used. The page now starts with the schedule and inquiries cards; the Apyrankės stats and the Pardavimai block remain. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-11 Pardavimai stats (cards + charts) sit in their own block directly below the Pardavimai card, not inside it (`SalesTable` returns the card and `SalesStats` as siblings); they still follow the card's filters. Earlier: stats above the table (`sales-stats.tsx`, `sales-chart.tsx`, `sales-breakdown.tsx`, `lib/admin/sales-stats.ts`): Pajamos / Pardavimai / Vidutinis krepšelis cards with % change against the previous period of the same length (none for the "Visi" range), a revenue-over-time bar chart and a revenue-by-category breakdown; all follow the filters. Hand-written SVG on the `chart-1`/`chart-2` tokens, no chart dependency. `tsc`/`eslint`/`design:check` clean; not browser-checked.
- 2026-11-11 Apžvalga: new "Pardavimai" table at the bottom of `/admin` (`components/admin/overview/sales-table.tsx`, `sales-filters.tsx`, `lib/admin/sales.ts`). One list of every sale from bookings (Pirtis, Nakvynė), quad rentals and tour tickets (Keturračiai), event/session tickets (session tickets count as Pirtis, the rest Renginiai), coupons (Kuponai) and bracelet plan purchases (Vandenlentės). Filters: category tabs, date range by sale date (presets Šiandien / 7 d. / 30 d. / Šis mėnuo / Visi + two `DatePicker`s), status (default Neatšauktos), search by customer / item / reference. Shows the count and the sum of valid (not cancelled, not unpaid) sales, 50 rows per page, CSV export. Reads only `useAdmin()` data; no new query, table or permission (ADR-0058). `tsc`/`eslint`/`design:check` clean; not browser-checked (staff sign-in).
- 2026-11-10 Focus ring colour on light surfaces is `--raw-coral-ink` (`--ring` in `:root` of `app/globals.css`, 5.1:1 on blush, was coral 2.6:1); dark admin and `--sidebar-ring` keep coral. Focus on ink bands (public header, menu) is not measured and may be low. `DESIGN.md` `focus-color` is `rust-ink`. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 Focus rings are full opacity: `focus-visible:ring-ring/50` -> `ring-ring` (shadcn `ui/` inputs, buttons, tabs, accordion, switch, select, badge, date picker, admin selects) and the destructive focus rings (`/20`, `/40` -> full). Invalid-state rings keep their tint. Full coral on blush is still 2.6:1, below the 3:1 focus minimum. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 Design code checks added (zero-slop-design `enforce-design`): `tools/zero-slop-design/` (zsd 0.2.1 copy), `design-check.config.json`, `design-check.known.json` (7 shadcn `ui/` warnings), `pnpm design:check` (lint + check-code; 0 errors over 460 files). Three exception comments with causes: Big Shoulders import (`app/layout.tsx`), signature pad canvas ink, embed widget font. CI not changed (needs approval). Contrast correction: on-rust on coral is 5.2:1, not 5.8:1 as written earlier.
- 2026-11-10 `DESIGN.md`: `band-ink` text is `surface` (`#EED9CE`), matching the live site (drift check measured `#EED9CE` on ink bands, the file said `#FBF3EF`). Docs only.
- 2026-11-10 `text-on-rust` now covers every ink-on-coral text: menu panel, ticker, hero sticker, all-in band, TOP badge on quad choices, and the coral hover states of the activity tile, service/moments gallery arrows and photo close button (3.68:1 -> 5.2:1). The booking-tabs count badge (`text-foam` on coral) is unchanged. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 Coral `Cta` tone uses dark text: new semantic token `--on-rust` (`--raw-aubergine-deep`, bound as `text-on-rust` in `app/globals.css`), `TONE.coral` in `components/cta.tsx` is `bg-rust text-on-rust` (3.68:1 -> 5.2:1). Other coral surfaces (menu panel, ticker, hero sticker, all-in band, TOP badge) still use `text-ink`. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `DESIGN.md` corrected after `review-design-md`: button text role (`button-md`), source focus ring (3 px, 50%), `md` breakpoint, hero/jumbo/footer/statement/menu/figure/total type steps, `line-on-primary`, elevation and motion tokens, dark-mode `primary` and `line`, Button/Input states, Big Shoulders fallback rules; values moved out of the prose. Lint valid, 0 errors. Coral buttons decided as dark text, code (`cta.tsx`) not yet changed. The stale 'Weights and borders' note in `design-system.md` now says four weights. Docs only.
- 2026-11-10 New `DESIGN.md` at the repo root (zero-slop-design `create-design-md`, draft): tokens from `app/globals.css` (`theme-marse` values, admin dark mode), Termina type roles, components and rules. `ink` is recorded as `primary` to meet the plugin's required roles. `lint`: valid, 0 errors. Unresolved items are listed in `x-zsd.unresolved`, including coral buttons using ink text at 3.68:1 (proposed fix: dark text). Docs only; no code changed.
- 2026-11-10 New design brief `obsidian/frontend/design-brief.md` (zero-slop-design `define-design`): audience (visitors booking + staff admin), primary tasks, references, selections to keep and prevent, unresolved items. Font weights decided: four Termina weights (400/500/600/700); the 'Weights and borders' note in `design-system.md` (400/700 only) is stale and still to be corrected. Docs only.
- 2026-11-10 New owner-only admin page `/admin/pranesimai` ("Pranešimai", sidebar under Nustatymai, `BellRingingIcon`): phone numbers that receive staff SMS and the topics each gets (Visi / Rezervacijos / Užklausos / Mokėjimai), with on/off switch, edit and delete (`components/admin/notifications/`, `app/admin/notification-actions.ts`). Staff SMS now go through `sendStaffSms(topic, …)` (`lib/sms/staff-recipients.ts`, RPC `staff_notify_phones`), falling back to `STAFF_NOTIFY_PHONE` while the list is empty or unreadable. New migration `20261110140000_notification_recipients.sql` (applied and verified); `database.types.ts` merged by hand. ADR-0056. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 Admin sidebar: Apyrankės and Instruktorius moved into one expandable "Vandenlentės" row (`AdminNavDomain` in `admin-nav.ts`, `PersonSimpleSnowboardIcon`), between Nuolaidos and Užklausos. It shows to staff who can open at least one of the two pages; on phones the bottom nav / "Daugiau" sheet still list the two pages flat (`flattenNav`). The collapsible sidebar code from ADR-0046 is in use again for this one row. `tsc`/`eslint` clean; not browser-checked (staff sign-in).
- 2026-11-10 Admin sidebar: the "Klientai" group heading above the Klientai row is removed (`ADMIN_NAV_GROUPS` label is `null`, like Apžvalga); the row itself stays. `tsc` clean.
- 2026-11-10 `/rezervacija` Keturračiai tab: a route card is shown only when it has a departure with enough free quads on the chosen day (`QuadTourCard` filters `tourRoutes` with `quadTourStarts`; a route already in the plan stays so it can be removed). With no departures at all the cards and the "Trasos" label give way to one line, "Šią dieną turų nėra. Pasirink kitą datą." Checked in the browser: 17 Lapkričio shows no cards, 12 Lapkričio shows only Mini turas. `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` session cards: the "Daugiau informacijos" text link is replaced by an info icon in the card's top-right corner that opens the same session dialog (`SessionInfoLink` wrapping an `InfoIcon`, 44 px target, screen-reader text "Daugiau informacijos: <title>"); private program cards have no icon (they had no link). In the wide layout the price column gets `pt-8` on cards with an icon so the price clears it. Checked in the browser (icon in the corner, dialog opens). `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` Nakvynė type cards (Dvivietis / Keturvietis namelis, Kemperio aikštelė): each card has an info icon in its top-right corner that opens a details dialog (new `StayTypeDialog`, `components/reservation/stay-type-dialog.tsx`: photo for cabins, guests, price per night, up to 14 nights, VAT note); the divider and top padding above the quantity stepper are removed, like on the route cards. Copy uses only facts already in `lib/cabin.ts`. Checked in the browser. `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` Keturračiai route cards: removed the divider line and top padding above "Pradžios laikas" (`border-t pt-3` on the card's lower block in `QuadTourCard`). `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` Keturračiai route cards: the "Daugiau apie trasą" text link is replaced by an info icon in the card's top-right corner that opens the same route modal. `QuadRouteDialog` gets `variant="icon"` + `className`; the single quad page keeps the text link. Checked in the browser (icon visible, modal opens). `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija`: removed the sauna / stay / quad availability icons under each day (strip and calendar). `ReservationFlow` no longer passes `icons` (now optional on `WhenStep`); one `dayDetails` function marks the active tab only — days with nothing free for that tab are faded, and the Pirtis / Keturračiai tabs keep the session / departure count. Screen readers still hear "<activity> laisva / užimta". Checked in the browser. `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` session / program cards: the "KIEKIS" caption above the stepper is hidden (kept for screen readers via the new `Stepper` `hideLabel` prop) and the "Pasirinkti" button is `h-11`, the same height as the − / quantity / + controls. `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` session / program cards: the action row (quantity stepper + "Pasirinkti" / "Pašalinti iš plano") no longer has `ml-auto`; it spans the card's action column and the button grows to fill the space next to the stepper (`SessionList`). `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` calendar and strip: each day shows where scheduled things are — a rust dot and a count under the availability icons for sauna sessions (Pirtis tab) or tour departures (Keturračiai tab); the Nakvynė tab has none. `WhenStep` takes `dayDetails` (-> `DatePicker`), `ReservationFlow` builds it (`eventDetails`) from `data.sauna.events` / `data.quads.departures`; the indicator turns light on the selected day and an empty spacer keeps all cells the same height. Checked in the browser (11, 13, 14, 15 (2), 20-22, 27-29 marked). `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` calendar view alignment: the type chips and the first card were separated by the tab's 32 px section gap while the calendar sat 16 px under its toggle, so the cards started lower than the calendar. `SaunaOptions` now wraps chips + list in `space-y-4` and `SaunaFilters` has `p-px` (matching the toggle's border box), so the first card lines up with the calendar frame. Verified in the browser (both tops at the same y). `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija`: with the month calendar ("Kalendorius") open and a wide enough column (container width from `@4xl`), the day's results (type chips and cards) sit beside the calendar in a 3:2 split (calendar wider) instead of below it; narrower columns, the strip view and the single service pages are unchanged. Done with a container query plus `has-[[data-view=calendar]]` on a wrapper in `ReservationFlow`; `DatePicker` now exposes `data-view` (not in compact mode). Checked in the browser at ~1930 px. `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija` Pirtis tab: the filter row is now just "Privati pirtis" and "Seansai" (the same split as `/pirtis`); "Visi", "Moterų", "Vyrų" and the hard-coded "Su pirtininku" sub-filter are gone. `SaunaFilter` is `"private" | "sessions"`, the list starts on Privati pirtis (or Seansai when a session is deep-linked or already in the plan), and the empty messages name the chosen type. Checked in the browser. `tsc`/`eslint` clean.
- 2026-11-10 `/rezervacija`: the availability marks under each day (`dayAvailability` in `lib/reservation.ts`) now count the Keturračiai tab as open only when a tour type has a scheduled departure with enough free quads that day (`quadTourStarts`), like the single quad page; before it marked every day with free fleet. Checked in the browser: only 12 Lapkričio (the departure) shows the quad mark. `tsc`/`eslint` clean.
- 2026-11-10 Security hardening of quad tour departures after an automated review: new migration `20261110130000_quad_tour_departures_hardening.sql` (revokes direct execute on `create_quad_tour_rental`, so a tour can only be booked through a published departure; trigger rejecting per-person event tickets for a departure). Tested in a rolled-back transaction on the live project (anon/authenticated lose the grant, the wrapper still books, a ticket on a departure is refused); applied to the live database afterwards and verified.
- 2026-11-10 Admin date fields use the styled `DatePicker` (`components/ui/date-picker.tsx`, the site calendar) instead of the browser's native date input: the event / session dialog (`EventDialog`), the tour departure dialog and the new-booking form (`BookingWhenFields`). The value stays a yyyy-mm-dd string. The unused `NewRentalDialog` still has the native input. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 Sauna session dialog (Seansai tab, `EventDialog` with `presetCategory="pirtis"`): the "Kategorija" picker is hidden also when editing (a session is always Pirtis), and "Vieta" became a "Pirties tipas" select of the saunas from `/admin/pirtis`. The place is stored as the sauna name; an existing " · attendant" suffix is kept, and a venue name that matches no sauna stays selectable. New sessions default to the first active sauna. `tsc`/`eslint` clean; `event-dialog.tsx` is now ~220 lines and is a candidate for extracting the session fields.
- 2026-11-10 `/admin/pirtis` Programos card: the "Nauja programa" / "Naujas seansas" button now lives in the card header (`CardAction`) and follows the active tab, instead of a right-aligned row that left a large gap above the list. `ProgramsCard` owns the tab state and the session `EventDialog`; `SaunaSessionsList` is just the list with an `onEdit` prop. `tsc`/`eslint` clean.
- 2026-11-10 `/admin/keturraciai` Turai tab: the "Turų datos" list sits in a card (title, description, list) like the other admin cards instead of bare text. `tsc`/`eslint` clean.
- 2026-11-10 Quad tours on dated departures (ADR-0055). Admin `/admin/keturraciai` Turai tab: "Turų tipai" (`TourRoutesCard`, moved from Parkas), "Turų datos" (new `TourDepartureDialog`: type, date, start hour, number of quads; name, price and length come from the type) and the registrations, which now include tour bookings (quad rentals with a route). "Pridėti turą" opens that dialog. Public `/keturraciu-nuoma` and the /rezervacija tour cards offer only the published departures of the chosen type (`QuadPageData.departures`, `quadTourDepartureSlots`; the pick carries `eventId`); booking calls `create_quad_tour_departure_rental`. `ManagedEvent.tourRouteId`, `QuadRental.tourRouteId` / `tourEventId`, `QuadDeparture`, mappers, `saveEvent` (`renginiai` or `keturraciai`). Kalendorius shows a departure as an event with its bookings (`EventSheet` lists tour rentals) and drops those rentals from its own list. Migration `20261110120000_quad_tour_departures.sql` applied to the live database and verified; `database.types.ts` regenerated. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 "Pridėti turą" form: the "Vieta" field is hidden when creating a quad tour (`EventDialog` with `presetCategory="keturratis"`); the place is saved as "Vanduo Marse". Editing an existing tour still shows it. `tsc`/`eslint` clean.
- 2026-11-10 `/admin/kalendorius` cards: Renginiai was a softened coral and read like Pirtis, so it now uses a real rose pink (new token `--calendar-pink`, `bg-calendar-pink` dot, pink wash and border); every card also gets a thicker left border (`border-l-4`) in its type colour, and Pirtis has a slightly stronger red wash. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/admin/kalendorius` cards, stronger tints per the owner: Pirtis light red wash (`bg-rust/20`) with a red border, Apgyvendinimas a light dark wash (`bg-ink/15`) with a dark border, Keturračiai a light tan wash (`bg-status-new/30`) with a brown border, Renginiai a light pink wash with a softer red border. New token `--calendar-brown` (`border-calendar-brown`, the tan mixed toward the aubergine) in `app/globals.css`. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/admin/kalendorius` cards: each `EntryCard` now has a light wash of its type colour as background and a border in the same colour as the type dot (`KIND_CARD` in `kind-dot.tsx`); the hover darkens slightly instead of turning the border ink. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/admin/kalendorius` type colours: Pirtis red (`bg-rust`), Apgyvendinimas dark (`bg-ink`), Keturračiai light brown (`bg-status-new`, the tan), Renginiai pink (`bg-rust/40`, the brand red softened). Previously Keturračiai was teal and Renginiai a near-invisible beige. `tsc` clean; not browser-checked.
- 2026-11-10 `/admin/kalendorius`: the "Nameliai" filter chip is now "Apgyvendinimas" (cabins and campers; the page description follows). Only the calendar wording changed.
- 2026-11-10 `/admin/kalendorius`: the type filters are now four — Pirtis, Nameliai, Keturračiai, Renginiai. Sauna sessions count as Pirtis, campers as Nameliai and quad tours as Keturračiai (`CalendarKind` is `pirtis | namelis | keturraciai | renginys`; an event is told apart by `CalendarEntry.event`), so one chip hides or shows the whole group, and the camper tent icon is gone. `tsc`/`eslint` clean.
- 2026-11-10 `/admin/keturraciai`: the header button "Nauja nuoma" is now "Pridėti turą" and opens `EventDialog` on the same page (`presetCategory="keturratis"`, wording "turas"), so a tour is created here instead of in Renginiai. The Turai tab lists the upcoming tours (new shared `CategoryEventsList`, `components/admin/events/category-events-list.tsx`: publish switch, seats, edit, delete) above the registrations (`ToursTab`, outdated "create it in Renginiai" text removed). `SaunaSessionsList` now uses the same list. `EventDialog` got `KIND_COPY` (seansas / turas wording). `NewRentalDialog` (manual rental) is no longer reachable from the UI. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/keturraciu-nuoma` booking widget: removed the "Turas su gidu" / "Nuoma valandomis" switch; the panel is tours only (route, date, time, gear). `QuadServiceBooking` lost its `quadPick` / `onQuadPick` props and `ReservationFlow` no longer passes them; the intro line reads "Rinkis turą ir laiką. Rezervaciją patvirtins komanda." `QuadHourlyControls` (`quad-hourly-controls.tsx`) is now unused. The page's "Kainos" section and facts list no longer show hourly prices either (`service-pricing.tsx`, `quad-service-facts.ts`). Supersedes the hourly-rental entry of the same day. `tsc`/`eslint` clean; not clicked through.
- 2026-11-10 `/admin/keturraciai`: removed the "Nuoma" tab (the hourly rental list, `RentalsTab`, now unused) and renamed "Žygiai" to "Turai" (tab id `turai`; texts in `ToursTab`, the page description and the Kalendorius filter chip say "turai"). Tabs are Turai / Parkas; the default is Turai. The header "Nauja nuoma" button stays, but rentals are no longer listed on this page — they show in Kalendorius (opens `RentalSheet`) and still count in the sidebar's pending-quads badge. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/pirtis` booking widget: removed the "Pirtininkas" selection. After Privati pirtis and the sauna ("Pirties tipas") the date opens straight away; the private programs of that sauna are no longer picked in a separate step, so the Laikas list carries them: with one program it shows the start hours, with several each option reads "15:00 · <program name>" and choosing it picks the program (values are `programId:hour`). A sauna with no private program still shows the contact line. `SaunaServicePrivateOptions` lost `programId` / `onProgram`. `tsc`/`eslint` clean; not clicked through.
- 2026-11-10 `/admin/pirtis`: the program dialog has no "Tipas" dropdown at all now, also when editing; a program keeps its kind (new ones are session programs) and the label field spans the row. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/admin/pirtis`: the "Nauja pirties programa" dialog no longer shows the "Tipas" dropdown — a new program is a session program (the form default), and the label field takes the full row. Editing an existing program still shows Tipas (private programs keep their sauna and capacity fields). The dialog text now points to the "Seansai" tab instead of Renginiai. Extras-per-program assignment was discussed and postponed (extras remain linked to saunas and sold on hourly hire only). `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/pirtis` booking widget, corrected: Tipas is back to two chips, "Privati pirtis" and "Pirties seansas" (the session chip only when sessions exist). Choosing Privati reveals "Pirties tipas" — the active saunas from `/admin/pirtis` (Malkine pirtis, Suomiska sauna, ...; no hard-coded fallbacks) — then that sauna's "Pirtininkas" programs (or the contact line), then date and time; a session goes straight to date and time. `SaunaServicePrivateOptions` again takes `venues` / `venueId`. Replaces the earlier merged-Tipas change. `tsc`/`eslint` clean; first step checked in the server-rendered page, the rest not clicked through.
- 2026-11-10 Admin sidebar: no more dropdowns. Pirtis (`/admin/pirtis`) and Keturračiai (`/admin/keturraciai`, with the pending-quads badge) are plain links beside Kalendorius; the "Valdymas" and "Nuoma / Žygiai" children are gone (Keturračiai's Parkas stays a tab on its page). There is no separate Namukai row: it pointed at `/admin/kainos`, the same page as Kainodara, so two rows would highlight together. `AdminNavDomain` / `Collapsible` support remains in `admin-nav.ts` / `AppSidebar`, currently unused. Supersedes the grouping of ADR-0046. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 Admin sidebar: removed the "Kalendorius" child from the Pirtis and Namukai dropdowns (both pointed at the Rezervacijos calendar tab); the top-level Kalendorius row now carries the pending-bookings badge and the mobile tab-bar slot the Pirtis child had. Pirtis and Namukai keep "Valdymas". Note: `/admin/rezervacijos` (the booking list and its calendar tab) no longer has a sidebar row; it is still reachable by URL and by the header "Nauja rezervacija" shortcut. `tsc`/`eslint` clean.
- 2026-11-10 `/admin/kalendorius`: the day list under the month grid is no longer shown for a day with no entries (it only said "Šią dieną įrašų nėra."); `DayAgenda` now renders only when the selected day has entries. `tsc`/`eslint` clean.
- 2026-11-10 `/admin/kalendorius`: "Redaguoti renginį" in the event panel no longer navigates to Renginiai; `EventSheet` takes `onEdit` and `CalendarView` closes the panel and opens `EventDialog` (edit mode) on the same page. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/admin/kalendorius`: Diena / Savaitė / Mėnuo tabs. The selected day is the cursor all three share; the arrows step a day, a week (Monday-first, `weekDays` in `calendar-entries.ts`) or a month, and "Šiandien" resets. New `WeekView` (seven columns from md up, stacked days on phones, every entry as a card) and `DayView` (cards in a responsive grid); the right-click menu moved into a shared `DayMenu` (`day-menu.tsx`) used by the month cell, week column and day view; `DayAgenda` shows only under the month. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/admin/kalendorius`: each type marker is now its colour dot plus an icon (new `KindMark` in `kind-dot.tsx`), shown on the filter chips, event/booking cards and the day agenda. Icons reuse the public /rezervacija set (`ACTIVITY_ICON`: waves for sauna and seansai, house for cabins, arrow for quads and žygiai) plus a tent for campers and confetti for events; the phone dot summary keeps plain dots. `tsc`/`eslint` clean; not browser-checked.
- 2026-11-10 `/admin/kalendorius`: right-click (long-press on touch) any day cell for quick actions, like the sauna calendar's cell menu — "Nauja rezervacija šią dieną" (`NewBookingDialog` prefilled with the day), "Naujas pirties seansas" and "Naujas renginys" (`EventDialog`, new `presetDate` prop; the seansas one also uses `presetCategory="pirtis"`), and "Rodyti dienos sąrašą". `MonthGrid` wraps each cell in a `ContextMenu` and reports `onCreate(action, day)`; `CalendarView` owns the dialogs. `tsc`/`eslint` clean; not browser-checked (staff sign-in).
- 2026-11-10 `/admin/kalendorius` now shows events, with their bookings inside: every `public.events` row (pirties seansai, žygiai, other renginiai) is a calendar entry, drawn from md up as a card in its day cell (time, title, seats taken like "8/12", green/red seat dot, dashed when unpublished) beside the booking cards (sauna, stays, quad rentals). Clicking an event opens the new `EventSheet` (`components/admin/calendar/event-sheet.tsx`): seats, price, link to Renginiai and the event's tickets (`tourTickets` + `eventTickets` via `ticketsFor`) with contact links, status/payment badges and the confirm/reject `StatusActions`. The separate ticket entries are gone (they live inside the event); new `seansas` kind/filter; new `EntryCard`; `MonthGrid` is full width with cards on md+ and the dot summary on phones; `DayAgenda` lists events with seats. `calendarEntries` now takes `events` instead of the ticket lists. `tsc`/`eslint` clean; not browser-checked (staff sign-in).
- 2026-11-10 `/pirtis` booking widget: "Tipas" now lists the saunas added in `/admin/pirtis` (active ones, in admin order, with "Iki N žmonių") plus "Pirties seansas" when sessions or session programs exist, instead of the hard-coded "Privati pirtis" / "Pirties seansas" pair. Picking a sauna shows its private programs ("Pirtininkas") or the contact line; the separate "Pirtis" step and the hard-coded fallback venues ("Suomiška sauna", the "Dar įrengiama" "Malkinė pirtis") are gone, so a hidden sauna no longer appears. `saunaServiceVenues` is now just the active saunas; `SaunaServicePrivateOptions` takes the chosen `venue`. `tsc`/`eslint` clean; checked the server-rendered `/pirtis` against live data (both active saunas + the sessions chip); not clicked through.
- 2026-11-10 New admin page `/admin/kalendorius` ("Kalendorius", own sidebar row under Apžvalga, permission `rezervacijos`/`uzimtumas`): one Monday-first month grid of every booking — sauna, cabins, campers, quad rentals, quad tours and event tickets — with per-kind colour dots and counts, filter chips per type, and a day agenda. `lib/admin/calendar-entries.ts` (`calendarEntries`, `entriesOn`, `monthGrid`) flattens `bookings`/`quadRentals`/`tourTickets`/`eventTickets` from the store (cancelled excluded; stays span their nights); `components/admin/calendar/` holds `CalendarView`, `MonthGrid`, `DayAgenda`, `KindDot`. Bookings and quad rentals open their existing `BookingSheet` / `RentalSheet`; tickets link to Keturračiai / Renginiai. Apžvalga's "Šiandienos tvarkaraštis" got a "Kalendorius" link. No schema change. `tsc`/`eslint` clean; route compiles and guards to login; not browser-checked (staff sign-in).
- 2026-11-10 `/admin/pirtis`: the Programos card now has two tabs, "Programos" (unchanged list) and "Seansai" (new `SaunaSessionsList`, `components/admin/sauna/sauna-sessions-list.tsx`): upcoming `pirtis` events with program, price, seats and a publish switch, plus "Naujas seansas" / edit / delete, so a sauna session is created without going to Renginiai. It reuses `EventDialog` (new `presetCategory` prop that starts in the category and hides the picker; titles and toasts say "seansas") and `DeleteEventDialog`. No data or schema change. `tsc`/`eslint` clean; not browser-checked (staff sign-in).
- 2026-11-10 `/keturraciu-nuoma` now offers the hourly rental (the admin's "Nuoma" / "Parkas" fleet) beside the guided tours: a "Turas su gidu" / "Nuoma valandomis" switch in `QuadServiceBooking`, new `QuadHourlyControls` (quads per fleet type, duration up to `maxHours`, `ServiceDateField`, start hours where the whole fleet is free) that writes the flow's existing `picks.keturraciai` (`QuadPick`), so `planQuads` prices it from `quad_types` and `requestsFor` files it as `quadRental` / `mixedQuadRental` through the same plan panel and checkout dialog. The tour and the rental are exclusive in the plan; a new day resets the rental's start. The "Kainos" section and the facts list the hourly prices too (30 / 45 EUR per hour from the rows). `tsc`/`eslint` clean; browser-checked on live data: 2 x Keturratis vienam, 19 Lapkricio 12:00-13:00 = 60 EUR, checkout dialog "Mokėti 60 €" (not submitted).
- 2026-11-10 Admin: staff with `keturraciai` manage the tour products in /admin/keturraciai -> Parkas: new `TourRoutesCard` / `TourRouteDialog` (name, price per quad, hours, minimum quads, texts, photo path, badge, active) and `TourAccessoriesCard` / `TourAccessoryDialog`, plus an editable cancellation line in `QuadSettingsCard`; backed by `saveQuadTourRoute` / `deleteQuadTourRoute` / `saveQuadTourAccessory` / `deleteQuadTourAccessory` (`app/admin/actions.ts`), `AdminData.quadTourRoutes` / `quadTourAccessories`, and store reducers. Deleting a route that has bookings is refused (use the switch). `tsc`/`eslint`/`build` clean; not browser-checked (staff sign-in). Also fixed the booking-confirmed screen inside a service booking panel: `ReservationFlow` no longer wraps `ReservationDone` in page padding when `activity` is set, and `ReservationDone` has a `compact` mode (px-4, wrapping rows) so the receipt uses the panel's width instead of one word per line; checked with sample data at panel width.
- 2026-11-09 Quad tours are now real, payable bookings (ADR-0053, step 3): `quadTourPlan`/`quadTourSlots` (`components/quads/quad-tour-plan.ts`, renamed from `quad-preview-plan`) read `QuadPageData.tourRoutes` / `tourAccessories` instead of constants; `quad-preview-content.ts` is now `quad-tour-content.ts` (photos only). `ReservationFlow` keeps the chosen tour as `tourPick`, files it as a new `quadTourRental` request (`submit-reservation.ts` -> `createQuadTourRental` -> `create_quad_tour_rental`) through the same checkout dialog as the sauna (contact, discount code, Stripe, "Mokėti X €"), and supports `activity="keturraciai"` so `/keturraciu-nuoma` renders `QuadServiceBooking` (route, date via `ServiceDateField`, time, gear) with the shared plan panel. Removed the mailto preview (`quad-preview-review`, `quad-preview-complete`, `quad-booking-preview`, `quad-service-tools`), the preview props of the dialog and submit details, and the hard-coded tour prices on the service page (pricing and facts now come from the rows). `/keturraciai` keeps its content but links to the real booking. `tsc`, `eslint` and `next build` clean; browser-checked against the live database up to the checkout dialog (route, date, time, plan 237 EUR, dialog with discount code and "Mokėti 237 €"); no payment was made.
- 2026-11-09 Quad tour products moved into the database (ADR-0053), step 1 of the payable-tours work: new tables `quad_tour_routes` / `quad_tour_accessories`, `quad_settings.tour_cancellation_note`, `quad_rentals.tour_route_id` / `tour_accessories`, and RPC `create_quad_tour_rental`, applied to the live project after three aborted-transaction dry runs; seeded with the old constants (Mini 59, Midi 79, Maxi 105 EUR; gear 3 / 5 / 10 EUR; minimum 3 quads). `database.types.ts` regenerated. The site does not use them yet (public data, request pipeline, checkout UI and admin follow).
- 2026-11-09 Added an owner-only "Rolė" tab to `/admin/klientai/[id]` (ADR-0051): `CustomerRoleTab` (`components/admin/klientai/customer-role-tab.tsx`) matches the customer's email to a `staff` login; with one it shows a role select (Savininkas = administratorius), active switch and the role's page badges, without one it creates the login (role + one-time temporary password). Reuses `createStaff`/`setStaffRole`/`setStaffActive`; no migration. Hidden for non-owners. `eslint` clean on the folder and the new files type-check; not yet browser-checked.
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
- 2026-11-12 Removed the Keisti planą action from the reservation checkout footer.
- 2026-11-12 Reservation checkout omits the account-creation hint and the generic confirmation paragraph when no payment method is shown.
- 2026-11-12 The discount code field is temporarily hidden in reservation checkout.
- 2026-11-12 The reservation gallery clips photos to its frame and sizes the carousel track to the frame’s capped height so images stay above the summary heading.
