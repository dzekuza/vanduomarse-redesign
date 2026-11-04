import "server-only";
import type Stripe from "stripe";
import { notifyPaid, notifyStaffPaid } from "@/lib/sms/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What a verified Stripe event does to the database. Money state changes only here (never on the
 * page the visitor returns to), and every branch is safe to repeat because Stripe retries events:
 * the database functions report `newly_paid` so the texts go out once.
 */

const paymentIntentId = (value: string | Stripe.PaymentIntent | null) => (typeof value === "string" ? value : (value?.id ?? ""));

async function onPaid(session: Stripe.Checkout.Session) {
  // A delayed payment method completes the session while it is still unpaid; wait for `async_payment_succeeded`.
  if (session.payment_status === "unpaid") return;
  const { data, error } = await createAdminClient().rpc("complete_payment", {
    p_session_id: session.id,
    p_payment_intent: paymentIntentId(session.payment_intent),
    p_amount: (session.amount_total ?? 0) / 100,
  });
  if (error) throw error;

  const paid = data?.[0];
  if (!paid?.newly_paid) return;
  // Texts must never fail the webhook: a retry would only re-send nothing, the payment is already recorded.
  await Promise.allSettled([notifyPaid(paid.phone, paid.refs, paid.amount), notifyStaffPaid(paid.refs, paid.amount, paid.needs_review)]);
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
