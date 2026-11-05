---
tags: [frontend, catalog, stable]
updated: 2026-10-30
---

# Utils Catalog

Helpers and business rules live in `lib/` (`lib/admin/` for the dashboard). Keep
them pure and typed; anything with client state belongs in a hook instead.

| Util | File | Signature | Purpose |
|------|------|-----------|---------|
| `verifiedPhone` / `UNVERIFIED` | `lib/phone-verification.ts` (server-only) | `(token, typedPhone) => string \| null` | The E.164 phone when the signed token is valid, unexpired and for the same number; every public booking action returns `UNVERIFIED` otherwise. Same file: `newCode`, `hashCode`, `hashIp`, `signToken`, `readToken` (ADR-0018) |
| `phoneNumberSchema` / `phoneCodeSchema` / `verificationToken` | `lib/phone-schema.ts` | Zod | Phone gate forms; `verificationToken` is part of `contactFields` and `couponOrderSchema` |
| `smsDestinationAllowed` | `lib/sms/twilio.ts` | `(e164) => boolean` | `SMS_ALLOWED_PREFIXES` country guard (default LT, LV, EE, PL), shared by booking SMS and the phone gate |
| `googleCalendarUrl` | `lib/calendar.ts` | `(ev: CalendarEvent) => string` | Google Calendar "add event" template link |
| `icsContent` | `lib/calendar.ts` | `(ev: CalendarEvent, uid: string) => string` | RFC 5545 `.ics` body (UTC or all-day) |
| `at` | `lib/calendar.ts` | `(day: Date, hour: number, minute?: number) => Date` | Local date-time on a given day |
| `sessionPrice` / `hourRate` | `lib/sauna.ts` | `(hours, partySize, rates?) => number` / `(partySize, rates?) => number` | Sauna price (group-size rate, minimum billed, package when cheaper). Pass the DB `rates`; the default is the sheet snapshot used by the calculator |
| `startHours` / `sessionLengths` / `maxHoursFrom` | `lib/sauna.ts` | `(rates) => number[]` / `(rates) => number[]` / `(taken, start, rates) => number` | Public sauna picker: valid starts, lengths, longest free run given the day's taken hours |
| `todayKey` / `vilniusHour` / `nextDays` / `dateKey` | `lib/sauna.ts` | `(now?) => string` / `(now?) => number` / `(fromKey, count) => Date[]` / `(date) => string` | Vilnius "today" and current hour on any server; day strips from a server date; local yyyy-mm-dd |
| `fromRate` / `saunaPhotoUrl` / `slugify` | `lib/sauna.ts` | `(rates) => number` / `(supabaseUrl, path) => string` / `(name) => string` | Lowest hourly rate for "nuo X €/val."; public URL in `sauna-photos`; sauna id from a name ("Malkinė" → `malkine`) |
| `resizeImage` | `lib/image-resize.ts` (browser) | `(file, maxSide?, quality?) => Promise<File>` | Photo → WebP within 1600 px before upload; returns the original if the browser can't encode |
| `pastHourOn` / `isOpenStart` | `lib/sauna.ts` | `(day, today, nowHour) => number` / `(taken, startHour, rates, pastHour) => boolean` | Sauna starts: today's hours up to and including the current one are gone; a start is open when not gone and the minimum session fits |
| `openEventCount` / `toSaunaEvent` / `eventReference` | `lib/sauna-events.ts` | `(events) => number` / `(SaunaEventData) => SaunaEvent` | Tab badge count; server data → `Date`; display-only ticket reference |
| `estimate` / `formatMoney` | `lib/event-pricing.ts` | `(input: EstimateInput) => Estimate` / `(m: Money) => string` | Event price estimate as min–max ranges from the 2026–27 sheet |
| `toParkEvent` / `monthHeading` | `lib/park-events.ts` | `(ParkEventData) => ParkEvent` / `(date) => string` | Server data → `Date`; "Spalis 2026" headings |
| `getSaunaPageData` / `getCabinPageData` / `getParkEvents` / `getCouponProducts` | `lib/data/public.ts` (server-only) | `() => Promise<…>` | Public page reads from Supabase (anon, per request) |
| `PERMISSIONS` / `hasPermission` / `hasAnyPermission` / `firstAllowedHref` / `permissionLabel` | `lib/admin/permissions.ts` | `(access, permissionId) => boolean` etc. | Admin page keys (match the DB check constraint), labels and hints; owners pass every check; where a role lands first |
| `requirePermission` | `lib/admin/guard.ts` (server-only) | `(permission or "owner") => Promise<void>` | Page guard: redirects to the first allowed page; a role with no pages is left to the layout's "no access" screen (no redirect loop) |
| `staffClient` / `dbError` / `fail` / `done` | `lib/admin/action-helpers.ts` (server-only) | `staffClient(need)` | Shared by the staff server actions: active staff with the needed permission, Lithuanian Postgres error messages (`last_owner`, `owner_role`, …) |
| `createAdminClient` | `lib/supabase/admin.ts` (server-only) | `() => SupabaseClient` | Service-role client for creating/resetting/deleting logins only; throws `MissingServiceKeyError` without the key |
| `visibleNav` / `canOpen` | `components/admin/admin-nav.ts` | `(access) => AdminNavItem[]` | The menu for one role |
| `freeAt` / `longestFrom` / `mostFreeOnDay` / `rentalPrice` / `maxRiders` / `hourLabel` | `lib/quads.ts` | `(type, taken, day, hour) => number` etc. | Quad availability maths from `quad_taken`: free now, longest rental from a start (capped by closing and max hours), best hour of a day, price, rider limit |
| `quadRentalSchema` / `quadContactSchema` / `tourTicketSchema` / `tourContactSchema` | `lib/quad-schema.ts` | Zod objects | Rental and tour requests (full, validated again by the actions) and the contact-only forms (phone or email required) |
| `getQuadPageData` | `lib/data/public.ts` (server-only) | `() => Promise<QuadPageData>` | Fleet, settings, hourly `taken` map, Vilnius "now hour" and upcoming tours |
| `sendSms` / `toE164` / `smsConfigured` | `lib/sms/twilio.ts` (server-only) | `(to, body) => Promise<boolean>` / `(phone) => string \| null` | Twilio REST send (never throws; skipped without env or outside `SMS_ALLOWED_PREFIXES`); LT phone → E.164 |
| `notifyReceived` / `notifyBookingReceived` / `notifyOutcome` / `notifyStaff` | `lib/sms/notify.ts` (server-only) | `(phone, reference, summary) => Promise<boolean>` | ASCII SMS texts: request received, sauna booking received (full details), confirmed/cancelled, staff alert |
| `saunaSummary` / `describeRequest` | `lib/sms/notify.ts` (server-only) | `({ date, startHour, hours, party?, total? }) => string` / `(parts) => string` | "Pirtis 2026-11-11 18:00-20:00, 4 zm., 140 EUR"; generic space-joined summary |
| `notifyRequestFiled` / `notifyRequestOutcome` / `notifyPaymentReceived` / `notifyDuplicatePayment` | `lib/notify.ts` (server-only) | `({ phone, email }, …) => Promise<void>` | **Use these from actions and the webhook.** One call per event: SMS + email to the customer (each channel only when given and configured) and SMS + email to staff. Never throws |
| `STAFF_INBOX` / `serviceOfReference` | `lib/contacts.ts` | `Record<NotifyService, string>` / `(reference) => NotifyService` | Staff inbox per service (pirtis, keturraciai → renginiai@; nakvyne → miegas@); reference prefix → service (MM- stay, PM-/PR- sauna, KT-/KZ- quads), used to route paid and double-charge emails |
| `sendEmail` / `emailList` / `escapeHtml` | `lib/email/resend.ts` (server-only) | `({ to, subject, text, html, from? }, { skipInDev }) => Promise<boolean>` | Resend REST send (never throws; skipped without env; logged instead in `next dev` unless `EMAIL_IN_DEV=1`); `"a@x, b@y"` → address list |
| `emailReceived` / `emailOutcome` / `emailPaid` / `emailStaffNew` / `emailStaffPaid` / `emailStaffDuplicate` | `lib/email/notify.ts` (server-only) | `(to, reference, summary) => Promise<boolean>` | Lithuanian email texts (text + simple HTML), customer and `STAFF_NOTIFY_EMAIL` |
| `normalizeCode` / `formatCode` / `formatEuro` / `formatExpiry` | `lib/coupons.ts` | `(string) => string` / `(n) => string` | Coupon codes ("ab12-cd34" → `AB12CD34…`, 12 chars → `XXXX-XXXX-XXXX`), euro and expiry-date wording |
| `couponApplies` / `couponDiscount` | `lib/coupons.ts` | `(couponService, flow) => boolean` / `(total, balance) => number` | Whether a coupon can pay for a sauna or cabin booking; euros taken off, never above balance or total |
| `couponOrderSchema` | `lib/coupon-schema.ts` | Zod object | Checkout form shape, shared by `OrderForm` and the `createCouponOrder` action (honeypot `website` must stay empty) |
| `sendCouponEmail` / `emailConfigured` | `lib/email/send-coupon.ts` (server-only) | `(CouponEmail) => Promise<boolean>` / `() => boolean` | Coupon delivery over the Resend HTTP API (no SDK); false when unconfigured or refused |
| `loadAdminData` / `currentStaff` | `lib/admin/repository.ts` (server-only) | `(supabase) => Promise<AdminData>` / `(supabase) => { user, staff }` | Dashboard reads as the signed-in user; staff check |
| `toBooking` / `toInquiry` / `toManagedEvent` / `toPriceItem` / `toSauna` / `toSaunaRates` / `fromSaunaRates` / `toUpsell` / `toBlock` / `toCoupon` / `toCouponProduct` / `toQuadType` / `toQuadSettings` / `toQuadRental` / `toTourTicket` / `toStaffRole` / `toStaffMember` / `toHHMM` | `lib/admin/mappers.ts` | `(row) => model` | Supabase rows → app models (null → optional, `HH:MM:SS` → `HH:MM`, extras → labels) |
| `createClient` / `createPublicClient` / `supabaseEnv` | `lib/supabase/server.ts` / `public.ts` / `env.ts` | — | Cookie client (acts as the user) / cookieless anon client / env reader |
| `formatDay` / `formatDateTime` / `formatEur` / `bookingWhen` | `lib/admin/format.ts` | `(yyyy-mm-dd) => string` etc. | Admin date and money formatting in site wording |
| `bookingsToCsv` / `toCsv` / `csvCell` / `exportFileName` | `lib/admin/export.ts` | `(bookings: Booking[]) => string` / `(prefix, dayKey) => string` | Excel-ready CSV (UTF-8 BOM, `;`, decimal comma, Lithuanian headers); quotes `;` `"` and line breaks, defuses formula-like cells |
| `downloadText` | `lib/download.ts` | `(text, fileName, type?) => void` | Client-only: save a string as a file via a Blob link |
| `useNavCounts` | `components/admin/use-nav-counts.ts` | `() => { pendingBookings, newInquiries, pendingCoupons, pendingQuads }` | Badge counts shared by sidebar and bottom bar |
| `useIsMobile` | `hooks/use-mobile.ts` | `(breakpoint = 768) => boolean` | Media-query hook (`useSyncExternalStore`) |
| `saunaSlice` / `saunaBookingAt` / `staysOn` / `freeStartHours` / `freeHoursFrom` / `fullCabinNights` | `lib/admin/occupancy.ts` | `(bookings, blocks?, rates?, day, …)` | Admin availability pre-checks before submit (the database has the final say) |
| `upsellTotal` / `upsellMax` / `upsellSummary` | `lib/sauna-upsells.ts` | `(upsell, qty, {partySize, hours}) => number` etc. | Price and describe sauna extras by unit |
| `roomPrice` / `roomLabel` / `freeCabins` / `cabinStayType` / `cabinReference` | `lib/cabin.ts` | `(roomId, size) => number` / `(roomId, size) => string` / `(availability, checkIn, nights, size) => number` / `(size) => string` / `(dateK, roomId, nights) => string` | Cabin sizes (`CABIN_SIZES`: 8 × 2 asm. at 50 €, 6 × 4 asm. at 60 €), camper rate, free cabins from `stay_occupancy()` data |
| `EMBED_HEIGHT_MESSAGE` / `toEmbedPath` / `frameAncestors` | `lib/embed.ts` | `toEmbedPath(pathname) => string \| null` / `frameAncestors(list: string \| undefined) => string` | WordPress widgets (ADR-0014): the `vm-embed:height` postMessage type, booking route → `/embed` twin, and the CSP `frame-ancestors` value from `EMBED_ALLOWED_ORIGINS` (drops anything that is not a bare http(s) origin) |
| `parseEmbedTheme` / `embedThemeCss` / `embedFontHrefs` / `carryEmbedTheme` / `EMBED_THEME_PARAMS` | `lib/embed-theme.ts` | `(params) => EmbedTheme` / `(theme) => string \| null` / `(theme) => string[]` / `(from, to) => void` | WordPress appearance params → validated overrides (hex colours; font names `[A-Za-z0-9 ]`; `heading_case` upper/none) → `body.theme-marse{…}` CSS + Google Fonts links; carry params on in-widget links (ADR-0015) |
| `CONTACTS` / `MAIN_CONTACT` / `MAPS_URL` / `telHref` | `lib/contacts.ts` | `(phone: string) => string` | Park contact details shared by `SiteFooter`, `MenuPanel`, `ServiceDrawer` (contact fallback) and the planner-free home footer; `telHref` strips spaces for `tel:` links |

## Related

[[folder-structure]]
