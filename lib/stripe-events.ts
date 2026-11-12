import "server-only";
import type Stripe from "stripe";
import { z } from "zod";
import { couponIdOf, onCouponPaid, onCouponRefund, onCouponSessionClosed } from "@/lib/coupon-payment";
import { onPlanOrderPaid, onPlanOrderRefund, onPlanSessionClosed, planOrderIdOf } from "@/lib/plan-payment";
import { notifyDuplicatePayment, notifyPaymentReceived } from "@/lib/notify";
import { loadPaidRequests } from "@/lib/payment-notice";
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
  const couponId = couponIdOf(session);
  if (couponId) return onCouponPaid(couponId, session);
  const planOrderId = planOrderIdOf(session);
  if (planOrderId) return onPlanOrderPaid(planOrderId, session);
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
  // complete_payment returns the phone only. The email comes from the paying account's confirmed address
  // (payment_notify_email reads auth.users), never from the request rows, whose email the form sent.
  // A failed lookup only drops the customer email: notifications must never fail the webhook.
  const { data: email, error: emailError } = await admin.rpc("payment_notify_email", { p_payment_id: paid.payment_id });
  if (emailError) console.error("Stripe webhook: payment_notify_email failed, customer email skipped", paid.payment_id);
  // The database confirmed the paid requests itself (`confirmed`): the customer gets what was booked, no staff step.
  // Loaded for every payment: staff need who booked and what, also when the payment needs a look. The customer
  // messages only use the list when `confirmed`.
  const requests = await loadPaidRequests(paid.payment_id);
  await notifyPaymentReceived({ phone: paid.phone, email: email ?? null }, paid.refs, paid.amount, paid.needs_review, requests, paid.confirmed);
}

async function onClosed(sessionId: string, failed: boolean) {
  await onCouponSessionClosed(sessionId);
  await onPlanSessionClosed(sessionId);
  const { error } = await createAdminClient().rpc("expire_payment", { p_session_id: sessionId, p_failed: failed });
  if (error) throw error;
}

async function onRefund(charge: Stripe.Charge) {
  const intent = paymentIntentId(charge.payment_intent);
  if (!intent) return;
  await onCouponRefund(charge);
  await onPlanOrderRefund(charge);
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
