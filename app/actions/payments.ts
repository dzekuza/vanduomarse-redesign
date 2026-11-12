"use server";

import { z } from "zod";
import type { ActionResult } from "@/app/admin/actions";
import { getCustomer } from "@/lib/customer";
import { fileRequest } from "@/lib/file-request";
import { discountCovers, isDiscountService, normalizeDiscountCode, type DiscountService } from "@/lib/discount-codes";
import { MIN_CHARGE_EUR, MIN_CHARGE_MESSAGE, REQUEST_ACTIVITY, checkoutInputSchema, payItemsSchema, type PayItem } from "@/lib/payments";
import { closeCheckoutSession, ownsPayment } from "@/lib/payment-release";
import { createPublicClient } from "@/lib/supabase/public";
import { MissingStripeKeyError, getStripe, paymentsEnabled, siteOrigin, toCents } from "@/lib/stripe";
import { createAdminClient, MissingServiceKeyError } from "@/lib/supabase/admin";

/**
 * Pay-at-submit for /rezervacija. One action files every request of the reservation (each is
 * priced and checked by the database as before, but texts are held back) for the signed-in customer
 * account, groups them into one
 * payment and opens a Stripe Checkout Session for the stored total. If anything fails the
 * requests it filed are cancelled again, so nothing is left holding a slot unpaid. Paying is
 * confirmed by the webhook (`/api/stripe/webhook`), never by the page the visitor returns to.
 * The admin client only calls the scoped payment functions, never tables.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

const SIGN_IN = "Prisijunkite, kad galėtumėte rezervuoti.";
const SETTLED = "Šis mokėjimas jau apmokėtas arba apdorojamas. Atnaujinkite puslapį po minutės.";
const SETUP = "Mokėjimas šiuo metu neveikia. Skambinkite mums ir užregistruosime.";
const FAILED = "Nepavyko pradėti mokėjimo. Užklausos neišsaugotos, bandykite dar kartą arba skambinkite.";

const BY_HINT: Record<string, string> = {
  payment_requests: "Užklausų nepavyko susieti su mokėjimu. Bandykite dar kartą.",
  payment_exists: "Šios užklausos jau turi mokėjimą. Atnaujinkite puslapį.",
  payment_free: "Nėra ką mokėti.",
  phone_invalid: "Neteisingas telefono numeris.",
};

/** The checkout session lives 30 minutes (Stripe's minimum) plus a minute for the page load. */
const SESSION_MINUTES = 31;

/** Tags our Checkout Sessions in the Stripe Dashboard. */
const INTEGRATION_ID = "vanduomarse-reservation-qvtmxkdh";

/** The payment's Checkout Session was already paid: never open another one for it. */
class PaymentSettledError extends Error {}
class BelowMinimumError extends Error {}

interface Payable {
  id: string;
  items: PayItem[];
  email: string | null;
  sessionId: string | null;
}

/** An open Checkout Session for the payment: the one it already has, or a new one. */
async function checkoutUrl(payable: Payable): Promise<string> {
  const stripe = getStripe();
  if (payable.sessionId) {
    // Only one session may be payable per payment, so an old one is replaced only once Stripe says it
    // expired. A failed lookup throws (the visitor retries) instead of risking a second open session.
    const existing = await stripe.checkout.sessions.retrieve(payable.sessionId);
    if (existing.status === "open" && existing.url) return existing.url;
    if (existing.status === "complete") throw new PaymentSettledError();
  }

  const total = payable.items.reduce((sum, item) => sum + toCents(item.amount), 0);
  if (total < toCents(MIN_CHARGE_EUR)) throw new BelowMinimumError();

  const origin = await siteOrigin();
  const references = payable.items.map((item) => item.reference);
  // No hand-made idempotency key: the SDK adds one itself for its network retries, and a fixed key
  // would clash with the changing expiry when a visitor retries.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: payable.items.map((item) => ({
      quantity: 1,
      price_data: { currency: "eur", unit_amount: toCents(item.amount), product_data: { name: `${item.label} · ${item.reference}` } },
    })),
    customer_email: payable.email ?? undefined,
    client_reference_id: payable.id,
    metadata: { payment_id: payable.id },
    payment_intent_data: { metadata: { payment_id: payable.id }, description: `Vanduo Marse ${references.join(", ")}` },
    success_url: `${origin}/rezervacija/mokejimas?pid=${payable.id}`,
    cancel_url: `${origin}/rezervacija/mokejimas?pid=${payable.id}&atsaukta=1`,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
    locale: "lt",
    integration_identifier: INTEGRATION_ID,
  });
  if (!session.url) throw new Error("Stripe returned no Checkout URL");

  // Attach only if the payment still has the session we saw: a concurrent "pay again" may have won.
  const { error } = await createAdminClient().rpc("attach_payment_session", {
    p_payment_id: payable.id,
    p_session_id: session.id,
    p_expires_at: new Date(session.expires_at * 1000).toISOString(),
    p_expected_session_id: payable.sessionId ?? undefined,
  });
  if (error) {
    await stripe.checkout.sessions.expire(session.id).catch(() => null);
    throw error;
  }
  return session.url;
}

function setupFailure(e: unknown) {
  if (e instanceof PaymentSettledError) return fail(SETTLED, "settled");
  if (e instanceof BelowMinimumError) return fail(MIN_CHARGE_MESSAGE, "payment");
  if (e instanceof MissingStripeKeyError || e instanceof MissingServiceKeyError) {
    console.error(`Payments: ${e.message}`);
    return fail(SETUP, "setup");
  }
  console.error("Payments: checkout failed", e);
  return fail(FAILED, "payment");
}

export async function startReservationCheckout(input: unknown): Promise<ActionResult<{ url: string }>> {
  if (!paymentsEnabled()) return fail(SETUP, "setup");
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const { contact, requests } = parsed.data;
  const customer = await getCustomer();
  if (!customer) return fail(SIGN_IN, "unauthorized");
  // The requests carry the account's confirmed phone and email (the actions read them from the
  // session); only the name is typed.
  const asCustomer = {
    customerName: contact.customerName,
    customerPhone: customer.phone ?? "",
    customerEmail: customer.email ?? "",
    viaAccount: true,
    awaitingPayment: true,
  };

  // The code goes only with the requests whose activity it covers; each request's database
  // function then checks and prices it again (ADR-0036).
  let covered: DiscountService[] = [];
  const code = normalizeDiscountCode(contact.discountCode ?? "");
  if (code) {
    const { data, error } = await createPublicClient().rpc("check_discount_code", { p_code: code });
    if (error) return fail(FAILED, "payment");
    if (!data[0]) return fail("Nuolaidos kodas nebegalioja.", "discount_invalid");
    covered = data[0].services.filter(isDiscountService);
  }

  const filed: string[] = [];
  const release = async () => {
    if (filed.length === 0) return;
    try {
      await createAdminClient().rpc("cancel_unpaid_requests", { p_user: customer.id, p_refs: filed });
    } catch (e) {
      console.error("Payments: could not release filed requests", filed, e);
    }
  };

  try {
    for (const request of requests) {
      const withCode = code && discountCovers({ services: covered }, REQUEST_ACTIVITY[request.type]);
      const result = await fileRequest(request, { ...asCustomer, discountCode: withCode ? code : undefined });
      if ("error" in result) {
        await release();
        return result;
      }
      filed.push(result.data.reference);
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("start_payment", { p_user: customer.id, p_refs: filed });
    if (error || !data?.[0]) {
      console.error("Payments: start_payment failed", error);
      await release();
      return fail(BY_HINT[(error as { hint?: string } | null)?.hint ?? ""] ?? FAILED, "payment");
    }
    const payment = data[0];
    const items = payItemsSchema.parse(payment.items);

    try {
      const url = await checkoutUrl({ id: payment.payment_id, items, email: payment.customer_email || null, sessionId: payment.stripe_session_id });
      return { data: { url } };
    } catch (e) {
      // Stripe refused a brand-new payment: free what it held so the slots are not blocked for 48 hours.
      // A payment that already had a session is left alone: it may be paid or payable.
      if (!payment.stripe_session_id) await admin.rpc("abandon_payment", { p_payment_id: payment.payment_id });
      return setupFailure(e);
    }
  } catch (e) {
    await release();
    return setupFailure(e);
  }
}

/** "Pay again" on the return page: the open session of a payment that is still waiting. */
export async function resumeCheckout(input: unknown): Promise<ActionResult<{ url: string }>> {
  if (!paymentsEnabled()) return fail(SETUP, "setup");
  const parsed = z.object({ paymentId: z.uuid() }).safeParse(input);
  if (!parsed.success) return fail("Neteisinga nuoroda.", "invalid");

  try {
    const { data, error } = await createAdminClient().rpc("payment_state", { p_payment_id: parsed.data.paymentId });
    const state = data?.[0];
    if (error || !state || state.status !== "laukia") return fail("Šio mokėjimo atnaujinti nebegalima. Pateikite rezervaciją iš naujo.", "payment_closed");
    const url = await checkoutUrl({
      id: parsed.data.paymentId,
      items: payItemsSchema.parse(state.items),
      email: state.customer_email || null,
      sessionId: state.stripe_session_id,
    });
    return { data: { url } };
  } catch (e) {
    return setupFailure(e);
  }
}

/**
 * "Atšaukti" on /paskyra: the customer gives up an unpaid payment and frees its slots. The payment must be theirs
 * (read through their own session, row level security) and still waiting; its open Checkout Session is expired first
 * so it cannot be paid after the slots are released.
 */
export async function cancelUnpaidPayment(input: unknown): Promise<ActionResult<{ cancelled: true }>> {
  const parsed = z.object({ paymentId: z.uuid() }).safeParse(input);
  if (!parsed.success) return fail("Neteisinga nuoroda.", "invalid");
  const customer = await getCustomer();
  if (!customer) return fail(SIGN_IN, "unauthorized");

  try {
    if (!(await ownsPayment(parsed.data.paymentId))) return fail("Mokėjimas nerastas.", "invalid");

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("payment_state", { p_payment_id: parsed.data.paymentId });
    const state = data?.[0];
    if (error || !state) return fail("Mokėjimas nerastas.", "invalid");
    if (state.status !== "laukia") return fail("Šio mokėjimo atšaukti nebegalima. Atnaujinkite puslapį.", "payment_closed");

    // The slots are freed only once the session can no longer be paid; a failed or unconfirmed expiry stops here.
    if (state.stripe_session_id && (await closeCheckoutSession(state.stripe_session_id)) === "paid") throw new PaymentSettledError();
    const { error: abandonError } = await admin.rpc("abandon_payment", { p_payment_id: parsed.data.paymentId });
    if (abandonError) throw abandonError;
    return { data: { cancelled: true } };
  } catch (e) {
    return setupFailure(e);
  }
}
