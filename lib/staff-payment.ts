import "server-only";
import { emailPaymentRequest } from "@/lib/email/notify";
import { notifyPaymentRequest } from "@/lib/sms/notify";
import {
  MIN_CHARGE_EUR,
  MIN_CHARGE_MESSAGE,
  payItemsSchema,
} from "@/lib/payments";
import { closeCheckoutSession } from "@/lib/payment-release";
import {
  MissingStripeKeyError,
  getStripe,
  paymentsEnabled,
  siteOrigin,
  toCents,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Payment link for a staff-entered reservation that was not paid at entry (ADR-0112, ADR-0113). The booking, rental or
 * ticket already exists; `openStaffPayment` groups it into a payment (`start_staff_payment`, which gives the open one
 * back when asked again) and returns a Stripe Checkout URL that lasts a day: the payment's own open session, or a new
 * one when it expired. Paying is confirmed by the Stripe webhook like any other payment. Staff permission is checked
 * by the caller.
 */

/** Stripe allows a Checkout Session to live 30 minutes to 24 hours; a few minutes under the maximum. Also the pass balance link (ADR-0139). */
export const STAFF_LINK_MINUTES = 24 * 60 - 5;
const SESSION_MINUTES = STAFF_LINK_MINUTES;

/** Tags our Checkout Sessions in the Stripe Dashboard (the same as the website flow). */
const INTEGRATION_ID = "vanduomarse-reservation-qvtmxkdh";

type Failure = {
  ok: false;
  message: string;
  code: "setup" | "payment" | "settled";
};
const PAYMENT_FAILED: Failure = {
  ok: false,
  message: "Nepavyko sukurti apmokėjimo nuorodos.",
  code: "payment",
};
const SETTLED: Failure = {
  ok: false,
  message: "Klientas jau apmokėjo. Atnaujinkite puslapį.",
  code: "settled",
};

/** A missing service key is a setup problem the caller should see as a failure, not an exception that leaves a request behind. */
function adminOrNull() {
  try {
    return createAdminClient();
  } catch (e) {
    console.error("Staff payment: no admin client", e instanceof Error ? e.message : e);
    return null;
  }
}
const DB_UNAVAILABLE: Failure = { ok: false, message: "Duomenų bazė šiuo metu nepasiekiama.", code: "setup" };

export type StaffLinkOutcome =
  { ok: true; paymentId: string; amount: number; url: string } | Failure;
export type StaffPaymentOutcome =
  | {
      ok: true;
      paymentId: string;
      amount: number;
      emailSent: boolean;
      smsSent: boolean;
      url: string;
    }
  | Failure;

/** Checks that can run before anything is saved, so a refused request leaves no booking behind. */
export function staffPaymentProblem(
  email: string,
  total: number,
): { message: string; code: "email_required" | "setup" | "payment" } | null {
  if (!email.trim())
    return {
      message: "Apmokėjimo nuorodai reikia kliento el. pašto.",
      code: "email_required",
    };
  if (!paymentsEnabled())
    return {
      message: "Internetinis apmokėjimas neįjungtas. Pažymėkite „Sumokėta“.",
      code: "setup",
    };
  if (total < MIN_CHARGE_EUR)
    return { message: MIN_CHARGE_MESSAGE, code: "payment" };
  return null;
}

/** The open Checkout URL of the request's staff payment (started or reused), without sending anything. */
export async function openStaffPayment(
  reference: string,
  email: string,
): Promise<StaffLinkOutcome> {
  if (!paymentsEnabled())
    return {
      ok: false,
      message: "Internetinis apmokėjimas neįjungtas.",
      code: "setup",
    };
  const admin = adminOrNull();
  if (!admin) return DB_UNAVAILABLE;
  const { data, error } = await admin.rpc("start_staff_payment", {
    p_refs: [reference],
  });
  const payment = data?.[0];
  if (error || !payment) {
    console.error("Staff payment: start_staff_payment failed", error);
    return error?.hint === "payment_requests"
      ? {
          ok: false,
          message: "Užklausa nerasta, atšaukta arba jau apmokėta.",
          code: "payment",
        }
      : PAYMENT_FAILED;
  }

  try {
    const stripe = getStripe();
    // An earlier session is reused while it is open; a paid one stops here; an expired one is replaced.
    if (payment.stripe_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(
        payment.stripe_session_id,
      );
      if (existing.status === "open" && existing.url)
        return {
          ok: true,
          paymentId: payment.payment_id,
          amount: payment.amount,
          url: existing.url,
        };
      if (existing.status === "complete") return SETTLED;
    }

    const items = payItemsSchema.parse(payment.items);
    const origin = await siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: toCents(item.amount),
          product_data: { name: `${item.label} · ${item.reference}` },
        },
      })),
      customer_email: email.trim() || undefined,
      client_reference_id: payment.payment_id,
      metadata: { payment_id: payment.payment_id },
      payment_intent_data: {
        metadata: { payment_id: payment.payment_id },
        description: `Vanduo Marse ${reference}`,
      },
      success_url: `${origin}/rezervacija/mokejimas?pid=${payment.payment_id}`,
      cancel_url: `${origin}/rezervacija/mokejimas?pid=${payment.payment_id}&atsaukta=1`,
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      locale: "lt",
      integration_identifier: INTEGRATION_ID,
    });
    if (!session.url) throw new Error("Stripe returned no Checkout URL");

    const { error: attachError } = await admin.rpc("attach_payment_session", {
      p_payment_id: payment.payment_id,
      p_session_id: session.id,
      p_expires_at: new Date(session.expires_at * 1000).toISOString(),
      p_expected_session_id: payment.stripe_session_id ?? undefined,
    });
    if (attachError) {
      await stripe.checkout.sessions.expire(session.id).catch(() => null);
      throw attachError;
    }
    return {
      ok: true,
      paymentId: payment.payment_id,
      amount: payment.amount,
      url: session.url,
    };
  } catch (e) {
    // A payment that never had a session is freed so the caller can remove the request it was made for; an older one is left alone.
    if (!payment.stripe_session_id) {
      const { error: abandonError } = await admin.rpc("abandon_payment", {
        p_payment_id: payment.payment_id,
      });
      if (abandonError)
        console.error("Staff payment: abandon_payment failed", payment.payment_id, abandonError);
    }
    if (e instanceof MissingStripeKeyError)
      return {
        ok: false,
        message: "Internetinis apmokėjimas neįjungtas.",
        code: "setup",
      };
    console.error("Staff payment: checkout failed", e);
    return PAYMENT_FAILED;
  }
}

/** Opens the payment link, e-mails it and (when there is a phone) texts it too. A failed send still returns the link, so staff can pass it on. */
export async function requestStaffPayment(request: {
  reference: string;
  email: string;
  phone?: string | null;
  summary: string;
}): Promise<StaffPaymentOutcome> {
  const link = await openStaffPayment(request.reference, request.email);
  if (!link.ok) return link;
  const [emailSent, smsSent] = await Promise.all([
    emailPaymentRequest(request.email, request.reference, request.summary, link.amount, link.url),
    notifyPaymentRequest(request.phone, request.reference, link.amount, link.url),
  ]);
  return { ...link, emailSent, smsSent };
}

/**
 * Retires a request's unpaid staff payment because staff recorded the request as paid at entry: its Checkout Session is
 * expired first (a customer can no longer pay it), then the payment is voided and detached. Refuses when the customer
 * already paid.
 */
export async function retireStaffPayment(
  paymentId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = adminOrNull();
  if (!admin) return { ok: false, message: DB_UNAVAILABLE.message };
  const { data, error } = await admin.rpc("payment_state", {
    p_payment_id: paymentId,
  });
  const state = data?.[0];
  if (error || !state) return { ok: false, message: "Mokėjimas nerastas." };
  if (state.status === "apmoketa" || state.status === "grazinta")
    return {
      ok: false,
      message: "Klientas jau apmokėjo internetu. Atnaujinkite puslapį.",
    };
  try {
    if (
      state.stripe_session_id &&
      (await closeCheckoutSession(state.stripe_session_id)) === "paid"
    )
      return {
        ok: false,
        message: "Klientas jau apmokėjo internetu. Atnaujinkite puslapį.",
      };
  } catch (e) {
    console.error("Staff payment: could not expire the session", e);
    return {
      ok: false,
      message: "Nepavyko išjungti apmokėjimo nuorodos. Bandykite dar kartą.",
    };
  }
  const { error: voidError } = await admin.rpc("void_staff_payment", {
    p_payment_id: paymentId,
  });
  if (voidError) {
    console.error("Staff payment: void failed", voidError);
    return { ok: false, message: "Nepavyko atnaujinti mokėjimo." };
  }
  return { ok: true };
}

/**
 * A staff-entered request was cancelled: switch off its unpaid payment link so the customer cannot still pay for it
 * (ADR-0113). Only a staff payment that is still waiting is touched; a failure is logged, the link then lapses with its
 * Checkout Session within the day.
 */
export async function releaseCancelledStaffPayment(row: { payment_id: string | null; payments: { staff_created: boolean; status: string } | null }): Promise<void> {
  if (!row.payment_id || !row.payments?.staff_created || row.payments.status !== "laukia") return;
  const retired = await retireStaffPayment(row.payment_id);
  if (!retired.ok) console.error("Staff payment: could not release the link of a cancelled request", row.payment_id, retired.message);
}
