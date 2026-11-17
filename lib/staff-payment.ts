import "server-only";
import { emailPaymentRequest } from "@/lib/email/notify";
import {
  MIN_CHARGE_EUR,
  MIN_CHARGE_MESSAGE,
  payItemsSchema,
} from "@/lib/payments";
import {
  MissingStripeKeyError,
  getStripe,
  paymentsEnabled,
  siteOrigin,
  toCents,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Payment link for a staff-entered reservation that was not paid at entry (ADR-0112). The booking or ticket already exists;
 * this groups it into a payment (`start_staff_payment`), opens a Stripe Checkout Session that lasts a day, and e-mails the
 * link. Paying is confirmed by the Stripe webhook like any other payment. Staff permission is checked by the caller.
 */

/** Stripe allows a Checkout Session to live 30 minutes to 24 hours; a few minutes under the maximum. */
const SESSION_MINUTES = 24 * 60 - 5;

/** Tags our Checkout Sessions in the Stripe Dashboard (the same as the website flow). */
const INTEGRATION_ID = "vanduomarse-reservation-qvtmxkdh";

export type StaffPaymentOutcome =
  | { ok: true; paymentId: string; amount: number; emailSent: boolean; url: string }
  | { ok: false; message: string; code: "setup" | "payment" };

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

export async function requestStaffPayment(request: {
  reference: string;
  email: string;
  summary: string;
}): Promise<StaffPaymentOutcome> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("start_staff_payment", {
    p_refs: [request.reference],
  });
  const payment = data?.[0];
  if (error || !payment) {
    console.error("Staff payment: start_staff_payment failed", error);
    return {
      ok: false,
      message: "Nepavyko sukurti apmokėjimo nuorodos.",
      code: "payment",
    };
  }

  try {
    const items = payItemsSchema.parse(payment.items);
    const origin = await siteOrigin();
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: toCents(item.amount),
          product_data: { name: `${item.label} · ${item.reference}` },
        },
      })),
      customer_email: request.email,
      client_reference_id: payment.payment_id,
      metadata: { payment_id: payment.payment_id },
      payment_intent_data: {
        metadata: { payment_id: payment.payment_id },
        description: `Vanduo Marse ${request.reference}`,
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
    });
    if (attachError) {
      await getStripe()
        .checkout.sessions.expire(session.id)
        .catch(() => null);
      throw attachError;
    }

    const emailSent = await emailPaymentRequest(
      request.email,
      request.reference,
      request.summary,
      payment.amount,
      session.url,
    );
    return {
      ok: true,
      paymentId: payment.payment_id,
      amount: payment.amount,
      emailSent,
      url: session.url,
    };
  } catch (e) {
    // Free the payment so the caller can remove the booking it was made for.
    await admin.rpc("abandon_payment", { p_payment_id: payment.payment_id });
    if (e instanceof MissingStripeKeyError)
      return {
        ok: false,
        message: "Internetinis apmokėjimas neįjungtas.",
        code: "setup",
      };
    console.error("Staff payment: checkout failed", e);
    return {
      ok: false,
      message: "Nepavyko sukurti apmokėjimo nuorodos.",
      code: "payment",
    };
  }
}
