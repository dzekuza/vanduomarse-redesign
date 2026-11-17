import "server-only";
import type Stripe from "stripe";
import { z } from "zod";
import { capiConfigured, sendCapiEvent, type CapiUser } from "@/lib/meta-capi";
import { trackingFromMetadata } from "@/lib/meta-tracking-context";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The `Purchase` event of Meta's Conversions API, sent from the Stripe webhook (ADR-0111), not from the visitor's browser.
 * The browser Pixel still sends its own `Purchase` from the return page; both carry the event id `purchase-<transaction id>`,
 * so Meta keeps one. The server copy is the one that survives an ad blocker, iOS tracking limits and a buyer who closes the tab
 * after paying. It needs no proof from the browser: the paid order is found from the Stripe session, the buyer's identity
 * comes from that order, and the consent and technical details (IP, user agent, `_fbp`, `_fbc`) were recorded with the
 * Checkout Session when it was created (`trackingMetadata`).
 */

export type PurchaseKind = "reservation" | "coupon" | "plan";

export interface VerifiedPurchase {
  /** The id the browser Pixel uses too (`purchase-<this>`): payment id, coupon reference or plan order / pass reference. */
  transactionId: string;
  value: number;
  /** Discount code on the order itself. */
  coupon?: string;
  user: Pick<CapiUser, "email" | "phone" | "firstName" | "lastName" | "externalId">;
}

/** Meta de-duplicates by event id for 48 hours; an older purchase is not reported again. */
const PURCHASE_WINDOW_MS = 48 * 60 * 60 * 1000;
const STRIPE_SESSION = /^cs_[A-Za-z0-9_]{10,200}$/;

const recentlyPaid = (paidAt: string | null) => Boolean(paidAt) && Date.now() - new Date(paidAt as string).getTime() < PURCHASE_WINDOW_MS;

/**
 * The paid row the proof (the reservation payment id, or the Stripe Checkout session id) points to, or null when it is unknown, not (or no longer) paid, or paid too long ago.
 * "Paid" is the row's paid status, not just `paid_at`: a refunded or cancelled order is not reported.
 */
export async function verifyPurchase(kind: PurchaseKind, proof: string): Promise<VerifiedPurchase | null> {
  const admin = createAdminClient();
  if (kind === "reservation") {
    if (!z.uuid().safeParse(proof).success) return null;
    const { data } = await admin.from("payments").select("id, status, amount, paid_at, customer_email, customer_phone").eq("id", proof).maybeSingle();
    if (!data || data.status !== "apmoketa" || !recentlyPaid(data.paid_at)) return null;
    return { transactionId: data.id, value: Number(data.amount), user: { email: data.customer_email, phone: data.customer_phone } };
  }
  if (!STRIPE_SESSION.test(proof)) return null;
  if (kind === "coupon") {
    const { data } = await admin
      .from("coupons")
      .select("reference, status, face_value, refunded_amount, discount_code, paid_at, buyer_email, buyer_phone, buyer_name, rider_id")
      .eq("stripe_session_id", proof)
      .maybeSingle();
    if (!data || (data.status !== "aktyvus" && data.status !== "panaudotas") || Number(data.refunded_amount ?? 0) > 0 || !recentlyPaid(data.paid_at)) return null;
    const [firstName, ...rest] = (data.buyer_name ?? "").trim().split(/\s+/);
    // Face value, like GA and the Pixel (ADR-0103), so the browser and server copies of the event carry the same value.
    return {
      transactionId: data.reference,
      value: Number(data.face_value),
      coupon: data.discount_code ?? undefined,
      user: { email: data.buyer_email, phone: data.buyer_phone, firstName, lastName: rest.join(" "), externalId: data.rider_id },
    };
  }
  const { data } = await admin
    .from("rider_plan_orders")
    .select("reference, status, price, discount_code, paid_at, rider_id, riders(email, phone, name, surname)")
    .eq("stripe_session_id", proof)
    .maybeSingle();
  if (!data) return verifyPlanPass(admin, proof);
  if (data.status !== "apmoketa" || !recentlyPaid(data.paid_at)) return null;
  const rider = Array.isArray(data.riders) ? data.riders[0] : data.riders;
  return {
    transactionId: data.reference,
    value: Number(data.price),
    coupon: data.discount_code ?? undefined,
    user: { email: rider?.email, phone: rider?.phone, firstName: rider?.name, lastName: rider?.surname, externalId: data.rider_id },
  };
}

/** A plan bought without registering (ADR-0109): the payer's Checkout session id finds the pass; no rider exists yet. */
async function verifyPlanPass(admin: ReturnType<typeof createAdminClient>, proof: string): Promise<VerifiedPurchase | null> {
  const { data } = await admin
    .from("plan_passes")
    .select("reference, status, price, discount_code, paid_at, refunded_at, buyer_email, buyer_name")
    .eq("stripe_session_id", proof)
    .maybeSingle();
  // A refunded pass can still read `priskirtas` (the rider keeps the plan until staff change it), so the refund marker decides.
  if (!data || (data.status !== "apmoketa" && data.status !== "priskirtas") || data.refunded_at || !recentlyPaid(data.paid_at)) return null;
  const [firstName, ...rest] = data.buyer_name.trim().split(/\s+/);
  return {
    transactionId: data.reference,
    value: Number(data.price),
    coupon: data.discount_code ?? undefined,
    user: { email: data.buyer_email, firstName, lastName: rest.join(" ") },
  };
}

/** The page each kind of payment returns to; Meta only wants an address on this site. */
const SOURCE_PATH: Record<PurchaseKind, string> = {
  reservation: "/rezervacija/mokejimas",
  coupon: "/kuponai/apmoketa",
  plan: "/registracija/apmoketa",
};

/**
 * Reports a just-paid order to Meta. `proof` is the reservation payment id, or the Stripe Checkout session id for coupons and
 * plans. Sends nothing without a configured Conversions API, without the marketing consent recorded when the order was started,
 * or for an order that is not (or no longer) paid. Never throws: a Meta failure must not fail the Stripe webhook.
 */
export async function reportPurchaseFromWebhook(kind: PurchaseKind, proof: string, session: Pick<Stripe.Checkout.Session, "metadata">): Promise<void> {
  try {
    if (!capiConfigured()) return;
    const tracking = trackingFromMetadata(session.metadata);
    if (!tracking.consent) return;
    const paid = await verifyPurchase(kind, proof);
    if (!paid) return;
    await sendCapiEvent({
      name: "Purchase",
      eventId: `purchase-${paid.transactionId}`,
      sourceUrl: `${SITE_URL}${SOURCE_PATH[kind]}`,
      time: Math.floor(Date.now() / 1000),
      user: { ip: tracking.ip, userAgent: tracking.userAgent, fbp: tracking.fbp, fbc: tracking.fbc, ...paid.user },
      custom: { value: Math.round(paid.value * 100) / 100, currency: "EUR", content_category: kind, ...(paid.coupon ? { coupon: paid.coupon } : {}) },
    });
  } catch (e) {
    console.error(`Meta purchase report failed (${kind}):`, e instanceof Error ? e.message : e);
  }
}
