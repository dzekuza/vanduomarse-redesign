---
tags: [backend, stable]
updated: 2026-11-04
---

# API Architecture

## The contract

- External / third-party calls run **server-side** — in `app/api/**/route.ts` or a
  server action. The browser only ever calls same-origin `/api/*`.
- Secret keys are server-only env vars, read through the typed accessor. Never
  `NEXT_PUBLIC_`. See [[environment-variables]].
- Validate every input with `zod` at the boundary.
- Return a consistent envelope:

```ts
type ApiResponse<T> = { data: T } | { error: { message: string; code?: string } };
```

- Map errors to real status codes (400 validation, 401/403 auth, 404, 429, 5xx).
  Never leak an upstream error body to the client.

## Routes

| Route | Method | Input | Output | Auth |
|-------|--------|-------|--------|------|
| `/api/stripe/webhook` | POST | Raw body + `stripe-signature` | `{ received: true }`; 400 bad/missing signature, 503 not configured, 500 when the database update failed (Stripe retries) | Stripe signature (`STRIPE_WEBHOOK_SECRET`) |

## Server actions

| Action | File | Purpose | Validation |
|--------|------|---------|------------|
| `signIn` / `signOut` | `app/admin/actions.ts` | Supabase password login → redirect `/admin`; sign-out → login page | Zod (`email`, `password ≥ 6`) |
| `createBooking` | `app/admin/actions.ts` | Manual booking; DB assigns the reference; extras re-priced server-side from active upsells; returns the saved `Booking` | Zod; `23P01` → message for the slot field |
| `setBookingStatus` / `toggleBlock` | `app/admin/actions.ts` | Status change; close/reopen a sauna hour (`created_by` = user) | Zod |
| `setInquiryStatus` / `addInquiryNote` | `app/admin/actions.ts` | Inquiry pipeline; notes carry `author_id` | Zod |
| `saveEvent` / `deleteEvent` / `setEventPublished` | `app/admin/actions.ts` | Upsert by UUID; delete refuses events with tickets (`23503`) | Zod |
| `updatePrices` | `app/admin/actions.ts` | Value/max per price item | Zod (max ≥ value) |
| `updateSaunaRates` / `saveUpsell` / `deleteUpsell` | `app/admin/actions.ts` | Sauna settings and extras; also revalidate `/rezervacija` and `/embed/pirtis` | `ratesSchema` / Zod |

| `createCouponOrder` | `app/actions/coupons.ts` | Public checkout: stores an order awaiting payment via the anon-callable RPC `create_coupon_order` (amount comes from the product row); honeypot field | `couponOrderSchema` (`lib/coupon-schema.ts`, shared with the form) |
| `checkCoupon` | `app/actions/coupons.ts` | Public booking flows: RPC `check_coupon` returns balance/scope only; wrong service gets its own message | code normalised to 12 chars |
| `saveCouponProduct` / `deleteCouponProduct` | `app/admin/actions.ts` | Coupon catalogue; also revalidates `/kuponai`; delete refuses sold products (`23503`) | Zod (euro coupon ⇔ service `visi`) |
| `activateCoupon` | `app/admin/actions.ts` | Staff confirm payment: RPC `activate_coupon` issues the code + 12-month expiry, then `sendCouponEmail`; returns `{ code, expiresAt, emailSent }` | Zod |
| `resendCouponEmail` / `redeemCoupon` / `cancelCoupon` | `app/admin/actions.ts` | Re-send code; insert a `coupon_redemptions` row (trigger spends the balance, hints `coupon_balance` / `coupon_inactive` / `coupon_expired`); cancel an order or coupon | Zod |

| `createQuadRental` / `createTourTicket` | `app/actions/quads.ts` | Public: file a rental request / tour seats via anon RPCs; DB hints map to Lithuanian messages; honeypot field | `quadRentalSchema` / `tourTicketSchema` (`lib/quad-schema.ts`) |
| `createMixedQuadRental` | `app/actions/quads.ts` | Public: book a mix of fleet types for one slot with one reference through `create_mixed_quad_rental`. Requires a verified phone | `mixedQuadRentalSchema` (`lib/quad-schema.ts`): distinct types, up to 20 quads total. Database checks seats and hourly stock |
| `createStayBooking` | `app/actions/requests.ts` | Public: file one request for the chosen cabin or camper pitch type and number of units. Requires a verified phone. The existing single-unit RPC remains available for the older forms | `stayBookingSchema` (`lib/request-schema.ts`): quantity 1–20, guest count required when quantity is omitted |
| `sendLoginCode` / `confirmLoginCode` | `app/actions/customer.ts` | Customer sign-in for `/rezervacija`: one-time code to a phone (E.164, only `SMS_ALLOWED_PREFIXES`) or an email through Supabase Auth (`signInWithOtp` creates the account on first use, `verifyOtp` signs in and sets the session cookie). Supabase's own send limits apply. ADR-0027 | `loginTargetSchema` / `loginCodeSchema` (`lib/customer-schema.ts`) |
| `saveCustomerName` / `signOutCustomer` | `app/actions/customer.ts` | Stores the name on the account (`user_metadata.full_name`) / signs the customer out | `customerNameSchema` |
| `startReservationCheckout` | `app/actions/payments.ts` | `/rezervacija` pay at submit: files each request through the public actions (flag `awaitingPayment`), `start_payment`, opens a Stripe Checkout Session for the stored total; on any failure cancels what it filed. Needs a signed-in customer and both Stripe secrets; requests are filed with `viaAccount`. ADR-0026 | `checkoutInputSchema` (`lib/payments.ts`: one request per activity, each re-validated by its own action) |
| `resumeCheckout` | `app/actions/payments.ts` | "Mokėti dar kartą" on `/rezervacija/mokejimas`: the open session of a payment still `laukia` (by its unguessable id) | uuid |
| `saveQuadType` / `deleteQuadType` / `updateQuadSettings` | `app/admin/actions.ts` | Fleet and rules; also revalidate `/rezervacija` and `/embed/keturraciai`; delete refused once rented (`23503`) | Zod (close > open) |
| `createRental` / `setRentalStatus` / `setTourTicketStatus` | `app/admin/actions.ts` | Staff-entered rental (price from the fleet row, DB guards capacity); status changes (reopening a cancelled row re-checks capacity) | Zod |

| `createStaff` / `resetStaffPassword` / `removeStaff` | `app/admin/staff-actions.ts` | Owner-only. Creates the login (service-role key, server only) with a generated temporary password shown once; reset; remove (staff row first, so the last-owner guard runs) | Zod |
| `setStaffRole` / `setStaffActive` / `saveRole` / `deleteRole` | `app/admin/staff-actions.ts` | Owner-only. Role changes take effect on the next request; deleting a role in use is refused; yourself can't be switched off or removed | Zod, `PERMISSION_IDS` |
| `changeOwnPassword` | `app/admin/actions.ts` | Any active staff member, via their own session | Zod (8-72 chars) |

Every action in `app/admin/actions.ts`: `staffClient(need)` (`lib/admin/action-helpers.ts`) (session + `public.staff` row, else `unauthorized`
/ `forbidden`; `need` is the page permission, a list of alternatives, `"owner"` or `"any"`), Zod parse, write as the user (RLS), then
`revalidatePath("/admin", "layout")`. Returns `ActionResult<T>`
(`{ data } | { error: { message, code } }`); Postgres errors map to Lithuanian
messages (`23P01` conflict by trigger hint, `23503` in use, `23514` invalid).

Public coupon actions run as **anon** and never use the service role: the database exposes only two `security definer` RPCs to anon (`create_coupon_order`, `check_coupon`) and no table access (ADR-0010). Codes carry 60 bits and `create_coupon_order` refuses a 101st pending order within an hour, but there is no per-IP rate limit on `check_coupon`.

Planned (public): create booking / ticket / inquiry once the forms collect
contact details. Those need a server action with rate limiting that writes with
the service role (anon has no insert grants) and recomputes the price.

## Related

[[data-flow]] · [[database]] · [[environment-variables]]

## Notifications

Booking and payment notifications go only through `lib/notify.ts` (ADR-0028); coupon emails are the exception (`sendCouponEmail`, same Resend sender). Customer SMS goes to a verified phone; customer email to only a signed-in account's confirmed email (read from `auth.users` via `account_notify_email` / `payment_notify_email` for outcomes and payments) (ADR-0027); the anonymous phone-code forms prove the phone, not the typed email, so they get SMS only; calculator inquiries notify staff only. Staff SMS goes to `STAFF_NOTIFY_PHONE`; staff email to the service inbox from `STAFF_INBOX` in `lib/contacts.ts` (sauna and quads → renginiai@vanduomarse.lt, stays → miegas@vanduomarse.lt), with `STAFF_NOTIFY_EMAIL` only as the fallback for other services. Sends run in `after()` (or after the DB write in the webhook) and never fail the request.
