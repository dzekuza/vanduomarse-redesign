import "server-only";
import { trackingMetadata } from "@/lib/meta-tracking-context";
import { formatEuro } from "@/lib/coupons";
import { getStripe, siteOrigin, toCents } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Stripe's minimum Checkout lifetime (30 min) plus a minute for the page load. */
const SESSION_MINUTES = 31;

/** Tags our Checkout Sessions in the Stripe Dashboard. */
const INTEGRATION_ID = "vanduomarse-plan-pass-w3n8cz5d";

export interface PlanPassToPay {
  id: string;
  reference: string;
  planName: string;
  /** The stored price, never a client number. */
  amount: number;
  buyerEmail: string;
  gift: boolean;
}

/**
 * Opens a Stripe Checkout Session for a fresh, unattached pass and remembers it on the pass. Returns null when it could not
 * (Stripe or the database refused); the caller then drops the pass. The webhook (`lib/plan-payment.ts`), never the return
 * page, marks it paid and issues the code. The return page is the same one plan orders use.
 */
export async function openPlanPassCheckout(o: PlanPassToPay): Promise<string | null> {
  try {
    const stripe = getStripe();
    const origin = await siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: toCents(o.amount), product_data: { name: `${o.planName}${o.gift ? " (dovana)" : ""} · ${o.reference}` } } }],
      customer_email: o.buyerEmail,
      client_reference_id: o.id,
      metadata: { plan_pass_id: o.id, plan_pass_reference: o.reference, ...(await trackingMetadata()) },
      payment_intent_data: { metadata: { plan_pass_id: o.id }, description: `Vanduo Marse abonementas ${o.reference} (${formatEuro(o.amount)})` },
      success_url: `${origin}/registracija/apmoketa?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/registracija/apmoketa?sid={CHECKOUT_SESSION_ID}&atsaukta=1`,
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      locale: "lt",
      integration_identifier: INTEGRATION_ID,
    });
    if (!session.url) throw new Error("Stripe returned no Checkout URL");

    const { error } = await createAdminClient().rpc("attach_plan_pass_session", { p_pass_id: o.id, p_session_id: session.id });
    if (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => null);
      throw error;
    }
    return session.url;
  } catch (e) {
    console.error("Plan pass: could not open Stripe Checkout", o.reference, e);
    return null;
  }
}
