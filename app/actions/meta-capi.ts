"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getCustomer } from "@/lib/customer";
import { capiConfigured, CAPI_EVENTS, sendCapiEvent, type CapiCustomData, type CapiUser } from "@/lib/meta-capi";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The browser's half of the Conversions API (ADR-0107): the Pixel helpers call this right after `fbq`, with the same
 * event id, only when the visitor allowed marketing cookies. The server adds what the browser does not send: IP, user
 * agent, the `_fbp` / `_fbc` cookies and, for a signed-in customer, their confirmed contact.
 *
 * Anyone can call a server action, so nothing about a `Purchase` is taken from the browser except a proof that only the
 * payer's own return page has: the reservation payment's random id (`?pid=`) or the coupon / plan Stripe Checkout session
 * id (`?sid=cs_…`). Guessable references are never accepted. The server then reads the row, sends nothing unless it was
 * paid within Meta's 48-hour de-duplication window, builds the event id itself (`purchase-<id>`, the same one the
 * browser Pixel uses) and takes the value and contact from that row. A replay inside the window is merged by Meta;
 * an older one is refused.
 */

const input = z.object({
  name: z.enum(CAPI_EVENTS),
  eventId: z.string().min(8).max(100).regex(/^[\w.:-]+$/),
  sourceUrl: z.url().max(500),
  value: z.number().min(0).max(100000).optional(),
  contentName: z.string().max(120).optional(),
  contentCategory: z.string().max(40).optional(),
  coupon: z.string().max(40).optional(),
  /** Purchase only: which kind of order and the payer's proof (reservation payment id, or the Stripe session id). */
  purchase: z.object({ kind: z.enum(["reservation", "coupon", "plan"]), proof: z.string().min(10).max(220) }).optional(),
});

export type MetaEventInput = z.infer<typeof input>;

interface VerifiedPurchase {
  /** The id the browser Pixel used too: payment id, coupon reference or plan order reference. */
  transactionId: string;
  value: number;
  user: Pick<CapiUser, "email" | "phone" | "firstName" | "lastName" | "externalId">;
}

const SITE_HOSTS = new Set(["vanduomarse.lt", "www.vanduomarse.lt", "localhost"]);
/** Meta de-duplicates by event id for 48 hours; an older purchase is not reported again. */
const PURCHASE_WINDOW_MS = 48 * 60 * 60 * 1000;
const STRIPE_SESSION = /^cs_[A-Za-z0-9_]{10,200}$/;

const recentlyPaid = (paidAt: string | null) => Boolean(paidAt) && Date.now() - new Date(paidAt as string).getTime() < PURCHASE_WINDOW_MS;

/** The paid row the payer's proof points to, or null when it is unknown, unpaid or paid too long ago. */
async function verifyPurchase(kind: "reservation" | "coupon" | "plan", proof: string): Promise<VerifiedPurchase | null> {
  const admin = createAdminClient();
  if (kind === "reservation") {
    if (!z.uuid().safeParse(proof).success) return null;
    const { data } = await admin.from("payments").select("id, amount, paid_at, customer_email, customer_phone").eq("id", proof).maybeSingle();
    if (!data || !recentlyPaid(data.paid_at)) return null;
    return { transactionId: data.id, value: Number(data.amount), user: { email: data.customer_email, phone: data.customer_phone } };
  }
  if (!STRIPE_SESSION.test(proof)) return null;
  if (kind === "coupon") {
    const { data } = await admin.from("coupons").select("reference, paid_amount, paid_at, buyer_email, buyer_phone, buyer_name, rider_id").eq("stripe_session_id", proof).maybeSingle();
    if (!data || !recentlyPaid(data.paid_at)) return null;
    const [firstName, ...rest] = (data.buyer_name ?? "").trim().split(/\s+/);
    return { transactionId: data.reference, value: Number(data.paid_amount ?? 0), user: { email: data.buyer_email, phone: data.buyer_phone, firstName, lastName: rest.join(" "), externalId: data.rider_id } };
  }
  const { data } = await admin.from("rider_plan_orders").select("reference, price, paid_at, rider_id, riders(email, phone, name, surname)").eq("stripe_session_id", proof).maybeSingle();
  if (!data || !recentlyPaid(data.paid_at)) return null;
  const rider = Array.isArray(data.riders) ? data.riders[0] : data.riders;
  return { transactionId: data.reference, value: Number(data.price), user: { email: rider?.email, phone: rider?.phone, firstName: rider?.name, lastName: rider?.surname, externalId: data.rider_id } };
}

/** Sends one Conversions API event. Returns nothing and never throws: tracking must not break the page. */
export async function reportMetaEvent(raw: MetaEventInput): Promise<void> {
  if (!capiConfigured()) return;
  const parsed = input.safeParse(raw);
  if (!parsed.success) return;
  const v = parsed.data;
  // Only events from this site's own pages; local development only with a test code, so it never mixes into real ad data.
  const host = new URL(v.sourceUrl).hostname;
  if (!SITE_HOSTS.has(host)) return;
  if (host === "localhost" && !process.env.META_CAPI_TEST_EVENT_CODE?.trim()) return;

  try {
    const [h, jar, customer] = await Promise.all([headers(), cookies(), getCustomer()]);
    let user: CapiUser = {
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"),
      userAgent: h.get("user-agent"),
      fbp: jar.get("_fbp")?.value,
      fbc: jar.get("_fbc")?.value,
      email: customer?.email,
      phone: customer?.phone,
      firstName: customer?.name.split(/\s+/)[0],
      lastName: customer?.name.split(/\s+/).slice(1).join(" "),
      externalId: customer?.id,
    };
    let value = v.value;
    let eventId = v.eventId;

    if (v.name === "Purchase") {
      if (!v.purchase) return;
      const paid = await verifyPurchase(v.purchase.kind, v.purchase.proof);
      if (!paid) return;
      value = paid.value;
      // Built here, never taken from the browser, so a replay cannot slip past Meta's de-duplication.
      eventId = `purchase-${paid.transactionId}`;
      // The order's own contact beats the session's: it is who actually paid.
      user = { ...user, ...Object.fromEntries(Object.entries(paid.user).filter(([, x]) => x)) };
    }

    const custom: CapiCustomData = {
      ...(value === undefined ? {} : { value: Math.round(value * 100) / 100, currency: "EUR" }),
      ...(v.contentName ? { content_name: v.contentName } : {}),
      ...(v.contentCategory ? { content_category: v.contentCategory } : {}),
      ...(v.coupon ? { coupon: v.coupon } : {}),
    };
    await sendCapiEvent({ name: v.name, eventId, sourceUrl: v.sourceUrl, time: Math.floor(Date.now() / 1000), user, custom });
  } catch (e) {
    console.error("Meta CAPI report failed:", e instanceof Error ? e.message : e);
  }
}
