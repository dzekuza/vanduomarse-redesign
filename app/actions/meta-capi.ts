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
 * Anyone can call a server action, so nothing here is trusted for money: a `Purchase` is sent only for a payment,
 * coupon or plan order that the database shows as paid, with the value and contact read from that row.
 */

const input = z.object({
  name: z.enum(CAPI_EVENTS),
  eventId: z.string().min(8).max(100).regex(/^[\w.:-]+$/),
  sourceUrl: z.url().max(500),
  value: z.number().min(0).max(100000).optional(),
  contentName: z.string().max(120).optional(),
  contentCategory: z.string().max(40).optional(),
  coupon: z.string().max(40).optional(),
  /** Purchase only: which kind of order and its id (payment id, coupon or plan order reference). */
  purchase: z.object({ kind: z.enum(["reservation", "coupon", "plan"]), transactionId: z.string().min(3).max(80) }).optional(),
});

export type MetaEventInput = z.infer<typeof input>;

interface VerifiedPurchase {
  value: number;
  user: Pick<CapiUser, "email" | "phone" | "firstName" | "lastName" | "externalId">;
}

const SITE_HOSTS = new Set(["vanduomarse.lt", "www.vanduomarse.lt", "localhost"]);

/** The paid row behind a purchase, or null when it does not exist or is not paid. */
async function verifyPurchase(kind: "reservation" | "coupon" | "plan", id: string): Promise<VerifiedPurchase | null> {
  const admin = createAdminClient();
  if (kind === "reservation") {
    if (!z.uuid().safeParse(id).success) return null;
    const { data } = await admin.from("payments").select("amount, paid_at, customer_email, customer_phone").eq("id", id).maybeSingle();
    return data?.paid_at ? { value: Number(data.amount), user: { email: data.customer_email, phone: data.customer_phone } } : null;
  }
  if (kind === "coupon") {
    const { data } = await admin.from("coupons").select("paid_amount, paid_at, buyer_email, buyer_phone, buyer_name, rider_id").eq("reference", id).maybeSingle();
    if (!data?.paid_at) return null;
    const [firstName, ...rest] = (data.buyer_name ?? "").trim().split(/\s+/);
    return { value: Number(data.paid_amount ?? 0), user: { email: data.buyer_email, phone: data.buyer_phone, firstName, lastName: rest.join(" "), externalId: data.rider_id } };
  }
  const { data } = await admin.from("rider_plan_orders").select("price, paid_at, rider_id, riders(email, phone, name, surname)").eq("reference", id).maybeSingle();
  if (!data?.paid_at) return null;
  const rider = Array.isArray(data.riders) ? data.riders[0] : data.riders;
  return { value: Number(data.price), user: { email: rider?.email, phone: rider?.phone, firstName: rider?.name, lastName: rider?.surname, externalId: data.rider_id } };
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

    if (v.name === "Purchase") {
      if (!v.purchase) return;
      const paid = await verifyPurchase(v.purchase.kind, v.purchase.transactionId);
      if (!paid) return;
      value = paid.value;
      // The order's own contact beats the session's: it is who actually paid.
      user = { ...user, ...Object.fromEntries(Object.entries(paid.user).filter(([, x]) => x)) };
    }

    const custom: CapiCustomData = {
      ...(value === undefined ? {} : { value: Math.round(value * 100) / 100, currency: "EUR" }),
      ...(v.contentName ? { content_name: v.contentName } : {}),
      ...(v.contentCategory ? { content_category: v.contentCategory } : {}),
      ...(v.coupon ? { coupon: v.coupon } : {}),
    };
    await sendCapiEvent({ name: v.name, eventId: v.eventId, sourceUrl: v.sourceUrl, time: Math.floor(Date.now() / 1000), user, custom });
  } catch (e) {
    console.error("Meta CAPI report failed:", e instanceof Error ? e.message : e);
  }
}
