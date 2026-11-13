import "server-only";
import type Stripe from "stripe";
import { z } from "zod";
import { emailStaffCouponCancelled, emailStaffCouponPaid } from "@/lib/email/notify";
import { recordStaffNotification } from "@/lib/staff-notifications";
import { voucherUrl } from "@/lib/coupon-voucher";
import { sendCouponEmails } from "@/lib/email/send-coupon";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Coupon side of the Stripe webhook (ADR-0075): a paid Checkout Session issues the code and emails it to the
 * buyer and the recipient; an expired one cancels the pending order; a full refund cancels the coupon.
 * Safe to repeat: the database reports `newly_paid` once, so the emails go out once.
 */

const intentOf = (value: string | Stripe.PaymentIntent | null) => (typeof value === "string" ? value : (value?.id ?? ""));

/** The coupon the session was created for, or undefined for any other payment. */
export const couponIdOf = (session: Stripe.Checkout.Session) => {
  const parsed = z.uuid().safeParse(session.metadata?.coupon_id);
  return parsed.success ? parsed.data : undefined;
};

export async function onCouponPaid(couponId: string, session: Stripe.Checkout.Session) {
  const { data, error } = await createAdminClient().rpc("complete_coupon_payment", {
    p_coupon_id: couponId,
    p_session_id: session.id,
    p_payment_intent: intentOf(session.payment_intent),
    p_amount: (session.amount_total ?? 0) / 100,
  });
  if (error) throw error;

  const c = data?.[0];
  if (!c) {
    console.error("Stripe webhook: paid coupon session without a matching coupon", session.id);
    return;
  }
  const paidAmount = (session.amount_total ?? 0) / 100;
  const feed = (review: boolean) =>
    recordStaffNotification({
      kind: review ? "mokejimas_patikrinti" : "mokejimas",
      permissions: ["kuponai"],
      title: review ? `Patikrinti kupono mokėjimą · ${c.reference}` : `Apmokėtas kuponas · ${c.reference}`,
      body: `${c.product_name}, ${paidAmount} €`,
      reference: c.reference,
      href: "/admin/kuponai",
    });
  if (!c.amount_ok) {
    await feed(true);
    await emailStaffCouponPaid({ reference: c.reference, productName: c.product_name, amount: paidAmount, buyerName: c.buyer_name, buyerEmail: c.buyer_email, recipientName: c.recipient_name, recipientEmail: c.recipient_email, problem: `Apmokėta ${paidAmount} €, o kupono vertė ${c.face_value} €. Kodas neišduotas: patikrinkite ir, jei reikia, grąžinkite per Stripe.` });
    return;
  }
  if (!c.newly_paid) return;

  const emailed = await sendCouponEmails({
    to: c.buyer_email,
    recipientEmail: c.recipient_email,
    buyerName: c.buyer_name,
    recipientName: c.recipient_name,
    message: c.message,
    code: c.code,
    productName: c.product_name,
    faceValue: c.face_value,
    service: c.service,
    expiresAt: c.expires_at,
    reference: c.reference,
    voucherUrl: await voucherUrl(session.id),
  });
  await feed(false);
  await emailStaffCouponPaid({
    reference: c.reference,
    productName: c.product_name,
    amount: paidAmount,
    buyerName: c.buyer_name,
    buyerEmail: c.buyer_email,
    recipientName: c.recipient_name,
    recipientEmail: c.recipient_email,
    problem: emailed ? undefined : "Kodo laiško išsiųsti nepavyko. Atidarykite kuponą skiltyje Kuponai ir paspauskite išsiųsti dar kartą.",
  });
}

/** Expired or failed Checkout Session: the unpaid coupon order is cancelled. */
export async function onCouponSessionClosed(sessionId: string) {
  const { error } = await createAdminClient().rpc("expire_coupon_session", { p_session_id: sessionId });
  if (error) throw error;
}

export async function onCouponRefund(charge: Stripe.Charge) {
  const intent = intentOf(charge.payment_intent);
  if (!intent) return;
  const { data, error } = await createAdminClient().rpc("refund_coupon_payment", { p_payment_intent: intent, p_refunded: charge.amount_refunded / 100 });
  if (error) throw error;
  if (data) await emailStaffCouponCancelled(data);
}
