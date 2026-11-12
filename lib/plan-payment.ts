import "server-only";
import type Stripe from "stripe";
import { z } from "zod";
import { emailPlanPaidCustomer, emailStaffPlanCancelled, emailStaffPlanPaid } from "@/lib/email/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Bracelet plan side of the Stripe webhook (ADR-0080): a paid Checkout Session attaches the plan to the rider and
 * logs the purchase; an expired one cancels the pending order; a full refund cancels the order.
 * Safe to repeat: the database reports `newly_paid` once, so the emails go out once.
 */

const intentOf = (value: string | Stripe.PaymentIntent | null) => (typeof value === "string" ? value : (value?.id ?? ""));

/** The plan order the session was created for, or undefined for any other payment. */
export const planOrderIdOf = (session: Stripe.Checkout.Session) => {
  const parsed = z.uuid().safeParse(session.metadata?.plan_order_id);
  return parsed.success ? parsed.data : undefined;
};

export async function onPlanOrderPaid(orderId: string, session: Stripe.Checkout.Session) {
  const paidAmount = (session.amount_total ?? 0) / 100;
  const { data, error } = await createAdminClient().rpc("complete_plan_order_payment", {
    p_order_id: orderId,
    p_session_id: session.id,
    p_payment_intent: intentOf(session.payment_intent),
    p_amount: paidAmount,
  });
  if (error) throw error;

  const o = data?.[0];
  if (!o) {
    console.error("Stripe webhook: paid plan session without a matching order", session.id);
    return;
  }
  if (!o.amount_ok) {
    await emailStaffPlanPaid({ reference: o.reference, planName: o.plan_name, amount: paidAmount, riderName: o.rider_name, riderEmail: o.rider_email, problem: `Apmokėta ${paidAmount} €, o plano kaina ${o.price} €. Planas nepriskirtas: patikrinkite ir, jei reikia, grąžinkite per Stripe.` });
    return;
  }
  if (!o.newly_paid) return;

  const emailed = await emailPlanPaidCustomer({ to: o.rider_email, riderName: o.rider_name, planName: o.plan_name, amount: o.price, reference: o.reference });
  await emailStaffPlanPaid({
    reference: o.reference,
    planName: o.plan_name,
    amount: o.price,
    riderName: o.rider_name,
    riderEmail: o.rider_email,
    problem: emailed || !o.rider_email ? undefined : "Pirkėjui patvirtinimo laiško išsiųsti nepavyko.",
  });
}

/** Expired or failed Checkout Session: the unpaid order is cancelled. */
export async function onPlanSessionClosed(sessionId: string) {
  const { error } = await createAdminClient().rpc("expire_plan_order_session", { p_session_id: sessionId });
  if (error) throw error;
}

export async function onPlanOrderRefund(charge: Stripe.Charge) {
  const intent = intentOf(charge.payment_intent);
  if (!intent) return;
  const { data, error } = await createAdminClient().rpc("refund_plan_order_payment", { p_payment_intent: intent, p_refunded: charge.amount_refunded / 100 });
  if (error) throw error;
  if (data) await emailStaffPlanCancelled(data);
}
