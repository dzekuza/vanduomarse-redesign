import "server-only";
import type Stripe from "stripe";
import { z } from "zod";
import { notifyDuplicatePayment, notifyPaymentReceived } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What a verified Stripe event does to the database. Money state changes only here (never on the
 * page the visitor returns to), and every branch is safe to repeat because Stripe retries events:
 * the database functions report `newly_paid` so the texts go out once.
 */

const paymentIntentId = (value: string | Stripe.PaymentIntent | null) => (typeof value === "string" ? value : (value?.id ?? ""));

/** The payment id the session was created for: lets a paid session be matched even if it is no longer the payment's current one. */
const paymentIdOf = (session: Stripe.Checkout.Session) => {
  const parsed = z.uuid().safeParse(session.metadata?.payment_id ?? session.client_reference_id);
  return parsed.success ? parsed.data : undefined;
};

async function onPaid(session: Stripe.Checkout.Session) {
  // A delayed payment method completes the session while it is still unpaid; wait for `async_payment_succeeded`.
  if (session.payment_status === "unpaid") return;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("complete_payment", {
    p_session_id: session.id,
    p_payment_intent: paymentIntentId(session.payment_intent),
    p_amount: (session.amount_total ?? 0) / 100,
    p_payment_id: paymentIdOf(session),
  });
  if (error) throw error;

  const paid = data?.[0];
  if (!paid) {
    // A paid session we cannot match to any payment: never drop it silently.
    console.error("Stripe webhook: paid session without a matching payment", session.id);
    return;
  }
  // A second, different payment on an already-paid reservation is a double charge: staff must refund it.
  if (paid.duplicate) {
    await notifyDuplicatePayment(paid.refs, (session.amount_total ?? 0) / 100);
    return;
  }
  if (!paid.newly_paid) return;
  // The function returns the phone only; the email is on the payment row (service role, no RLS).
  // A failed lookup just means no customer email: texts and emails must never fail the webhook.
  const { data: row } = await admin.from("payments").select("customer_email").eq("id", paid.payment_id).maybeSingle();
  await notifyPaymentReceived({ phone: paid.phone, email: row?.customer_email }, paid.refs, paid.amount, paid.needs_review);
}

async function onClosed(sessionId: string, failed: boolean) {
  const { error } = await createAdminClient().rpc("expire_payment", { p_session_id: sessionId, p_failed: failed });
  if (error) throw error;
}

async function onRefund(charge: Stripe.Charge) {
  const intent = paymentIntentId(charge.payment_intent);
  if (!intent) return;
  const { error } = await createAdminClient().rpc("record_refund", { p_payment_intent: intent, p_refunded: charge.amount_refunded / 100 });
  if (error) throw error;
}

/** Throws when the database could not be updated, so the route answers 500 and Stripe retries. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return onPaid(event.data.object);
    case "checkout.session.expired":
      return onClosed(event.data.object.id, false);
    case "checkout.session.async_payment_failed":
      return onClosed(event.data.object.id, true);
    case "charge.refunded":
      return onRefund(event.data.object);
    default:
      return;
  }
}
