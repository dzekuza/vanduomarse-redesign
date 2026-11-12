import "server-only";
import { formatEuro } from "@/lib/coupons";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, siteOrigin, toCents } from "@/lib/stripe";

/** Stripe's minimum Checkout lifetime (30 min) plus a minute for the page load. */
const SESSION_MINUTES = 31;

/** Tags our Checkout Sessions in the Stripe Dashboard. */
const INTEGRATION_ID = "vanduomarse-coupon-qvtmxkdh";

export interface CouponToPay {
  id: string;
  reference: string;
  productName: string;
  /** The stored coupon value, never a client number. */
  amount: number;
  buyerEmail: string;
}

/**
 * Opens a Stripe Checkout Session for a fresh coupon order and remembers it on the coupon.
 * Returns null when it could not (Stripe or the database refused): the caller then falls back to
 * the manual flow, where staff arrange payment and issue the code from /admin/kuponai.
 * The webhook (`lib/coupon-payment.ts`), never the return page, issues the code.
 */
export async function openCouponCheckout(c: CouponToPay): Promise<string | null> {
  try {
    const stripe = getStripe();
    const origin = await siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        { quantity: 1, price_data: { currency: "eur", unit_amount: toCents(c.amount), product_data: { name: `${c.productName} · ${c.reference}` } } },
      ],
      customer_email: c.buyerEmail,
      metadata: { coupon_id: c.id, coupon_reference: c.reference },
      payment_intent_data: { metadata: { coupon_id: c.id }, description: `Vanduo Marse kuponas ${c.reference} (${formatEuro(c.amount)})` },
      success_url: `${origin}/kuponai/apmoketa?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kuponai?atsaukta=1`,
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      locale: "lt",
      integration_identifier: INTEGRATION_ID,
    });
    if (!session.url) throw new Error("Stripe returned no Checkout URL");

    const { error } = await createAdminClient().rpc("attach_coupon_session", { p_coupon_id: c.id, p_session_id: session.id });
    if (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => null);
      throw error;
    }
    return session.url;
  } catch (e) {
    console.error("Coupon checkout: could not open Stripe Checkout", c.reference, e);
    return null;
  }
}
