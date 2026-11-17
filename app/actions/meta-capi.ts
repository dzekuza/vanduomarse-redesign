"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { getCustomer } from "@/lib/customer";
import { MARKETING_CONSENT_COOKIE } from "@/lib/consent";
import { capiConfigured, CAPI_EVENTS, sendCapiEvent, type CapiCustomData, type CapiUser } from "@/lib/meta-capi";

/**
 * The browser's half of the Conversions API (ADR-0107): the Pixel helpers call this right after `fbq`, with the same
 * event id, only when the visitor allowed marketing cookies. The server adds what the browser does not send: IP, user
 * agent, the `_fbp` / `_fbc` cookies and, for a signed-in customer, their confirmed contact.
 *
 * `Purchase` is not accepted here any more (ADR-0111): it is sent from the Stripe webhook (`lib/meta-purchase.ts`), which
 * needs nothing from the browser, so a buyer who closes the tab, an ad blocker or iOS cannot hide the sale, and nobody can
 * call this action to report a sale.
 */

/** The events a visitor's browser can report; a purchase comes from the payment webhook. */
const BROWSER_EVENTS = CAPI_EVENTS.filter((name): name is Exclude<(typeof CAPI_EVENTS)[number], "Purchase"> => name !== "Purchase");

const input = z.object({
  name: z.enum(BROWSER_EVENTS),
  eventId: z.string().min(8).max(100).regex(/^[\w.:-]+$/),
  sourceUrl: z.url().max(500),
  value: z.number().min(0).max(100000).optional(),
  contentName: z.string().max(120).optional(),
  contentCategory: z.string().max(40).optional(),
  coupon: z.string().max(40).optional(),
  /**
   * Contact the visitor typed into the form they are submitting (checkout events). A signed-in customer's own details win. Invalid values are dropped by the normalisers, not rejected here, so a typo in a
   * form never costs the event itself.
   */
  contact: z.object({ email: z.string().max(120).optional(), name: z.string().max(120).optional(), phone: z.string().max(30).optional() }).optional(),
});

export type MetaEventInput = z.infer<typeof input>;

const SITE_HOSTS = new Set(["vanduomarse.lt", "www.vanduomarse.lt", "localhost"]);

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
    const [h, jar] = await Promise.all([headers(), cookies()]);
    // Consent is checked here too, not only in the browser: the banner mirrors the marketing choice into a cookie.
    if (jar.get(MARKETING_CONSENT_COOKIE)?.value !== "1") return;
    const technical: CapiUser = {
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip"),
      userAgent: h.get("user-agent"),
      fbp: jar.get("_fbp")?.value,
      fbc: jar.get("_fbc")?.value,
    };
    const customer = await getCustomer();
    const typed = v.contact;
    const [typedFirst, ...typedRest] = (typed?.name ?? "").trim().split(/\s+/);
    // The signed-in customer's confirmed details win; what was typed in the form only fills what the account lacks.
    const user: CapiUser = {
      ...technical,
      email: customer?.email ?? typed?.email,
      phone: customer?.phone ?? typed?.phone,
      firstName: customer ? customer.name.split(/\s+/)[0] : typedFirst,
      lastName: customer ? customer.name.split(/\s+/).slice(1).join(" ") : typedRest.join(" "),
      externalId: customer?.id,
    };

    const custom: CapiCustomData = {
      ...(v.value === undefined ? {} : { value: Math.round(v.value * 100) / 100, currency: "EUR" }),
      ...(v.contentName ? { content_name: v.contentName } : {}),
      ...(v.contentCategory ? { content_category: v.contentCategory } : {}),
      ...(v.coupon ? { coupon: v.coupon } : {}),
    };
    await sendCapiEvent({ name: v.name, eventId: v.eventId, sourceUrl: v.sourceUrl, time: Math.floor(Date.now() / 1000), user, custom });
  } catch (e) {
    console.error("Meta CAPI report failed:", e instanceof Error ? e.message : e);
  }
}
