---
tags: [backend, stable]
updated: 2026-10-22
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
| — | — | No API routes yet | — | — |

## Server actions

| Action | File | Purpose | Validation |
|--------|------|---------|------------|
| `signIn` / `signOut` | `app/admin/actions.ts` | Supabase password login → redirect `/admin`; sign-out → login page | Zod (`email`, `password ≥ 6`) |
| `createBooking` | `app/admin/actions.ts` | Manual booking; DB assigns the reference; extras re-priced server-side from active upsells; returns the saved `Booking` | Zod; `23P01` → message for the slot field |
| `setBookingStatus` / `toggleBlock` | `app/admin/actions.ts` | Status change; close/reopen a sauna hour (`created_by` = user) | Zod |
| `setInquiryStatus` / `addInquiryNote` | `app/admin/actions.ts` | Inquiry pipeline; notes carry `author_id` | Zod |
| `saveEvent` / `deleteEvent` / `setEventPublished` | `app/admin/actions.ts` | Upsert by UUID; delete refuses events with tickets (`23503`) | Zod |
| `updatePrices` | `app/admin/actions.ts` | Value/max per price item | Zod (max ≥ value) |
| `updateSaunaRates` / `saveUpsell` / `deleteUpsell` | `app/admin/actions.ts` | Sauna settings and extras; also revalidate `/pirtis` | `ratesSchema` / Zod |

Every action: `staffClient()` (session + `public.staff` row, else `unauthorized`
/ `forbidden`), Zod parse, write as the user (RLS), then
`revalidatePath("/admin", "layout")`. Returns `ActionResult<T>`
(`{ data } | { error: { message, code } }`); Postgres errors map to Lithuanian
messages (`23P01` conflict by trigger hint, `23503` in use, `23514` invalid).

Planned (public): create booking / ticket / inquiry once the forms collect
contact details. Those need a server action with rate limiting that writes with
the service role (anon has no insert grants) and recomputes the price.

## Related

[[data-flow]] · [[database]] · [[environment-variables]]
