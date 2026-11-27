import "server-only";
import type Stripe from "stripe";
import { z } from "zod";
import {
  emailPassDepositCustomer,
  emailPassPaidCustomer,
  emailPlanPaidCustomer,
  emailStaffPassCancelled,
  emailStaffPassPaid,
  emailStaffPlanCancelled,
  emailStaffPlanPaid,
  type PassRefundOutcome,
} from "@/lib/email/notify";
import { recordStaffNotification } from "@/lib/staff-notifications";
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
  const feed = (review: boolean) =>
    recordStaffNotification({
      kind: review ? "mokejimas_patikrinti" : "mokejimas",
      permissions: ["apyrankes"],
      title: review ? `Patikrinti plano mokėjimą · ${o.reference}` : `Apmokėtas planas · ${o.reference}`,
      body: `${o.plan_name}, ${review ? paidAmount : o.price} €. ${o.rider_name}`,
      reference: o.reference,
      href: "/admin/apyrankes",
    });
  if (!o.amount_ok) {
    await feed(true);
    await emailStaffPlanPaid({ reference: o.reference, planName: o.plan_name, amount: paidAmount, riderName: o.rider_name, riderEmail: o.rider_email, problem: `Apmokėta ${paidAmount} €, o plano kaina ${o.price} €. Planas nepriskirtas: patikrinkite ir, jei reikia, grąžinkite per Stripe.` });
    return;
  }
  if (!o.newly_paid) return;

  const emailed = await emailPlanPaidCustomer({ to: o.rider_email, riderName: o.rider_name, planName: o.plan_name, amount: o.price, reference: o.reference });
  await feed(false);
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
  const admin = createAdminClient();
  const { error } = await admin.rpc("expire_plan_order_session", { p_session_id: sessionId });
  if (error) throw error;
  const { error: passError } = await admin.rpc("expire_plan_pass_session", { p_session_id: sessionId });
  if (passError) throw passError;
}

export async function onPlanOrderRefund(charge: Stripe.Charge) {
  const intent = intentOf(charge.payment_intent);
  if (!intent) return;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("refund_plan_order_payment", { p_payment_intent: intent, p_refunded: charge.amount_refunded / 100 });
  if (error) throw error;
  if (data) await emailStaffPlanCancelled(data);
  const { data: passes, error: passError } = await admin.rpc("refund_plan_pass_payment", { p_payment_intent: intent, p_refunded: charge.amount_refunded / 100 });
  if (passError) throw passError;
  for (const pass of passes ?? []) await emailStaffPassCancelled(pass.reference, pass.was_attached, refundOutcome(pass));
}

/** The database's word on a pass refund, narrowed; an unknown value falls back to the full-payment wording. */
function refundOutcome(row: { part?: string | null; outcome?: string | null }): PassRefundOutcome | undefined {
  const part = row.part === "visa" || row.part === "depozitas" || row.part === "likutis" ? row.part : undefined;
  const outcome = row.outcome === "atsauktas" || row.outcome === "priskirtas" || row.outcome === "dalinai_apmoketa" || row.outcome === "grazinta" ? row.outcome : undefined;
  return part && outcome ? { part, outcome } : undefined;
}

/** The pass the session was created for (a plan bought without registering, ADR-0109), or undefined for any other payment. */
export const planPassIdOf = (session: Stripe.Checkout.Session) => {
  const parsed = z.uuid().safeParse(session.metadata?.plan_pass_id);
  return parsed.success ? parsed.data : undefined;
};

/**
 * Which payment of a pass a session is (ADR-0139): "likutis" is the balance of a pass paid in parts, sent by staff; anything
 * else is the first payment (the full price, or the deposit).
 */
export const planPassPartOf = (session: Stripe.Checkout.Session): "likutis" | "pirmas" => (session.metadata?.plan_pass_part === "likutis" ? "likutis" : "pirmas");

/**
 * A pass was paid. The first payment of a full-price pass, or the balance of a pass paid in parts, makes the database issue
 * its code once: the buyer gets it by e-mail and staff are told (one path for both). The deposit of a pass paid in parts
 * issues no code: the buyer is told the balance link will follow.
 */
export async function onPlanPassPaid(passId: string, session: Stripe.Checkout.Session): Promise<void> {
  const paidAmount = (session.amount_total ?? 0) / 100;
  const balance = planPassPartOf(session) === "likutis";
  const { data, error } = await createAdminClient().rpc("complete_plan_pass_payment", {
    p_pass_id: passId,
    p_session_id: session.id,
    p_payment_intent: intentOf(session.payment_intent),
    p_amount: paidAmount,
    p_balance: balance,
  });
  if (error) throw error;

  const o = data?.[0];
  if (!o) {
    console.error("Stripe webhook: paid pass session without a matching pass", session.id);
    return;
  }
  const split = o.payment_plan === "dalimis";
  const deposit = Number(o.deposit_amount ?? 0);
  const rest = Number(o.balance_amount ?? 0);
  const due = balance ? rest : split ? deposit : o.price;
  const notice = { reference: o.reference, planName: o.plan_name, amount: o.price, buyerName: o.buyer_name, buyerEmail: o.buyer_email, gift: o.gift, recipientName: o.recipient_name };
  const feed = (review: boolean, title: string) =>
    recordStaffNotification({
      kind: review ? "mokejimas_patikrinti" : "mokejimas",
      permissions: ["apyrankes"],
      title: review ? `Patikrinti abonemento mokėjimą · ${o.reference}` : `${title} · ${o.reference}`,
      body: `${o.plan_name}, ${review ? paidAmount : due} €. ${o.buyer_name}${o.gift ? " (dovana)" : ""}`,
      reference: o.reference,
      href: "/admin/apyrankes?tab=kodai",
    });
  if (!o.amount_ok) {
    await feed(true, "");
    const problem = balance
      ? `Gautas likučio mokėjimas ${paidAmount} €, bet abonementas jo nelaukė (būsena: ${o.order_status}) arba suma nesutampa (likutis ${rest} €). Kodas neišduotas: patikrinkite ir, jei reikia, grąžinkite per Stripe.`
      : `Apmokėta ${paidAmount} €, o ${split ? "pirmoji dalis" : "abonemento kaina"} ${due} €. ${split ? "Dalis neįskaityta" : "Kodas neišduotas"}: patikrinkite ir, jei reikia, grąžinkite per Stripe.`;
    await emailStaffPassPaid({ ...notice, amount: paidAmount, problem });
    return;
  }
  if (!o.newly_paid) return;

  if (split && !balance) {
    const emailed = await emailPassDepositCustomer({ ...notice, deposit, balance: rest });
    await feed(false, "Apmokėta abonemento dalis");
    await emailStaffPassPaid({
      ...notice,
      stage: "depozitas",
      deposit,
      balance: rest,
      problem: emailed ? undefined : "Pirkėjui laiško apie pirmąją dalį išsiųsti nepavyko. Likučio nuorodą siųskite skiltyje Apžvalga → Pardavimai.",
    });
    return;
  }

  if (!o.pass_code) return;
  const emailed = await emailPassPaidCustomer({ ...notice, code: o.pass_code });
  await feed(false, balance ? "Apmokėtas abonemento likutis" : "Apmokėtas abonementas");
  await emailStaffPassPaid({
    ...notice,
    stage: balance ? "likutis" : undefined,
    problem: emailed ? undefined : "Pirkėjui laiško su kodu išsiųsti nepavyko: kodas rodomas apmokėjimo puslapyje, o jums jį galima rasti skiltyje Apyrankės → Abonementai.",
  });
}
