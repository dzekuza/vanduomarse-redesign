import "server-only";
import { formatEuro } from "@/lib/coupons";
import { getStripe, siteOrigin, toCents } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Stripe's minimum Checkout lifetime (30 min) plus a minute for the page load. */
const SESSION_MINUTES = 31;

/** Tags our Checkout Sessions in the Stripe Dashboard. */
const INTEGRATION_ID = "vanduomarse-plan-order-rkq7m2xh";

export interface PlanOrderToPay {
  id: string;
  reference: string;
  planName: string;
  /** The stored plan price, never a client number. */
  amount: number;
  buyerEmail: string;
}

/**
 * Opens a Stripe Checkout Session for a fresh bracelet plan order and remembers it on the order.
 * Returns null when it could not (Stripe or the database refused); the caller then drops the order.
 * The webhook (`lib/plan-payment.ts`), never the return page, attaches the plan to the rider.
 */
export async function openPlanCheckout(o: PlanOrderToPay): Promise<string | null> {
  try {
    const stripe = getStripe();
    const origin = await siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: toCents(o.amount), product_data: { name: `${o.planName} · ${o.reference}` } } }],
      customer_email: o.buyerEmail || undefined,
      client_reference_id: o.id,
      metadata: { plan_order_id: o.id, plan_order_reference: o.reference },
      payment_intent_data: { metadata: { plan_order_id: o.id }, description: `Vanduo Marse planas ${o.reference} (${formatEuro(o.amount)})` },
      success_url: `${origin}/registracija/apmoketa?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/registracija/apmoketa?sid={CHECKOUT_SESSION_ID}&atsaukta=1`,
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      locale: "lt",
      integration_identifier: INTEGRATION_ID,
    });
    if (!session.url) throw new Error("Stripe returned no Checkout URL");

    const { error } = await createAdminClient().rpc("attach_plan_order_session", { p_order_id: o.id, p_session_id: session.id });
    if (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => null);
      throw error;
    }
    return session.url;
  } catch (e) {
    console.error("Plan checkout: could not open Stripe Checkout", o.reference, e);
    return null;
  }
}
