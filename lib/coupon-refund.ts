import "server-only";
import type Stripe from "stripe";
import { getStripe, toCents } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Refunds a cancelled gift coupon that was paid online, with the same discipline as the booking refunds (`lib/refund.ts`):
 * - the database reserves the refund first (`begin_coupon_refund`: one per coupon, the amount computed there from the amount
 *   Stripe charged and the redemption history, never from anything staff can edit);
 * - the Stripe call uses a key fixed to that reservation, so a retry within 24 hours returns the same refund;
 * - the amount is checked against what the charge still has left;
 * - an unknown outcome (timeout, 5xx) leaves the reservation pending, and the next attempt first looks for the refund in
 *   Stripe by its metadata before creating anything.
 */

export type CouponRefundOutcome = { ok: true; amount: number } | { ok: false; message: string };

const BY_HINT: Record<string, string> = {
  not_cancelled: "Pinigai grąžinami tik atšauktam kuponui.",
  not_paid_online: "Šis kuponas nebuvo apmokėtas internetu: grąžinti nėra ko.",
  already_refunded: "Šiam kuponui pinigai jau grąžinti.",
  nothing_to_refund: "Kupono likutis panaudotas: grąžinti nėra ko.",
  unknown: "Kupono nerasta.",
};

const UNKNOWN =
  "Nepavyko patvirtinti grąžinimo Stripe. Pinigai galėjo būti grąžinti: nekartokite Stripe paskyroje. Bandykite dar kartą po kelių minučių, sistema pirma patikrins Stripe.";
const STALE = "Grąžinimo būklė nežinoma ir praėjo daugiau nei 24 val. Patikrinkite Stripe paskyroje (nekartokite), prireikus kreipkitės į Stripe pagalbą.";
const WINDOW_MS = 24 * 60 * 60 * 1000;

const isDefiniteRefusal = (e: unknown) => {
  const status = typeof e === "object" && e !== null && "statusCode" in e ? Number((e as { statusCode: unknown }).statusCode) : 0;
  return status >= 400 && status < 500 && status !== 409 && status !== 429;
};

async function findRefund(stripe: Stripe, paymentIntent: string, reservation: string): Promise<Stripe.Refund | null> {
  for await (const refund of stripe.refunds.list({ payment_intent: paymentIntent, limit: 100 })) {
    if (refund.metadata?.coupon_refund_id === reservation) return refund;
  }
  return null;
}

export async function refundCouponPayment(couponId: string, staffId: string): Promise<CouponRefundOutcome> {
  try {
    return await refund(couponId, staffId);
  } catch (e) {
    console.error("Coupon refund: unexpected failure", couponId, e);
    return { ok: false, message: "Nepavyko grąžinti pinigų. Grąžinkite juos Stripe paskyroje." };
  }
}

async function refund(couponId: string, staffId: string): Promise<CouponRefundOutcome> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("begin_coupon_refund", { p_coupon: couponId, p_staff: staffId });
  const row = data?.[0];
  if (error || !row) {
    if (error && !(error.hint && error.hint in BY_HINT)) console.error("Coupon refund: begin_coupon_refund failed", couponId, error.message);
    return { ok: false, message: BY_HINT[error?.hint ?? ""] ?? "Nepavyko pradėti grąžinimo. Grąžinkite pinigus Stripe paskyroje." };
  }
  const stripe = getStripe();
  const { refund_id: reservation, payment_intent: intent, amount, reference, resumed, created_at } = row;

  const settle = async (r: Stripe.Refund): Promise<CouponRefundOutcome> => {
    if (r.status === "failed" || r.status === "canceled") {
      await admin.rpc("fail_coupon_refund", { p_id: reservation });
      return { ok: false, message: `Stripe pranešė, kad grąžinimas nepavyko${r.failure_reason ? ` (${r.failure_reason})` : ""}. Grąžinkite pinigus Stripe paskyroje.` };
    }
    const { error: finishError } = await admin.rpc("finish_coupon_refund", { p_id: reservation, p_stripe_refund_id: r.id });
    // The refund exists at Stripe either way; an unfinished reservation is reconciled by the next attempt.
    if (finishError) console.error("Coupon refund: could not record the finished refund", reference, r.id, finishError.message);
    return { ok: true, amount };
  };

  try {
    if (resumed) {
      const existing = await findRefund(stripe, intent, reservation);
      if (existing) return await settle(existing);
      if (Date.now() - new Date(created_at).getTime() > WINDOW_MS) return { ok: false, message: STALE };
    }

    // Never ask Stripe for more than the charge has left.
    const pi = await stripe.paymentIntents.retrieve(intent, { expand: ["latest_charge"] });
    const charge = typeof pi.latest_charge === "object" ? pi.latest_charge : null;
    if (!charge) return { ok: false, message: UNKNOWN };
    const left = charge.amount - charge.amount_refunded;
    if (toCents(amount) > left) {
      await admin.rpc("fail_coupon_refund", { p_id: reservation });
      return { ok: false, message: "Šiam mokėjimui Stripe liko mažiau nei reikia grąžinti (dalis jau grąžinta Stripe paskyroje). Patikrinkite Stripe." };
    }

    const created = await stripe.refunds.create(
      { payment_intent: intent, amount: toCents(amount), metadata: { coupon_refund_id: reservation, coupon_reference: reference } },
      { idempotencyKey: `coupon-refund-${reservation}` },
    );
    return await settle(created);
  } catch (e) {
    if (isDefiniteRefusal(e)) {
      await admin.rpc("fail_coupon_refund", { p_id: reservation });
      console.error("Coupon refund refused by Stripe", reference, e);
      return { ok: false, message: "Stripe atsisakė grąžinti pinigų. Patikrinkite mokėjimą Stripe paskyroje." };
    }
    console.error("Coupon refund: outcome unknown", reference, e);
    return { ok: false, message: UNKNOWN };
  }
}
