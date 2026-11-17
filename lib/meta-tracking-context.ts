import "server-only";
import { cookies, headers } from "next/headers";
import type Stripe from "stripe";
import { MARKETING_CONSENT_COOKIE } from "@/lib/consent";

/**
 * What a Purchase sent from the Stripe webhook needs to know about the buyer's browser (ADR-0111). The webhook runs without
 * the buyer, so it is recorded in the Checkout Session's metadata when the order is started: only if the visitor had accepted
 * marketing cookies (the `vm_mkt` cookie the banner mirrors), and only what Meta uses to match the visit: the Meta cookies
 * `_fbp` / `_fbc`, the IP address and the user agent. Without that consent nothing is stored and no Purchase is sent.
 */

/** Meta's cookie format: `fb.<subdomain index>.<timestamp>.<id>`; anything else is not stored. */
const META_COOKIE = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_-]{4,200}$/;

export interface PurchaseTracking {
  /** The buyer accepted marketing cookies when the order was started. */
  consent: boolean;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}

/** Metadata to add to a new Checkout Session; empty when there is no marketing consent (or no request to read). */
export async function trackingMetadata(): Promise<Record<string, string>> {
  try {
    const [h, jar] = await Promise.all([headers(), cookies()]);
    if (jar.get(MARKETING_CONSENT_COOKIE)?.value !== "1") return {};
    const fbp = jar.get("_fbp")?.value;
    const fbc = jar.get("_fbc")?.value;
    const ip = (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "").slice(0, 64);
    // Stripe allows 500 characters per value.
    const userAgent = (h.get("user-agent") ?? "").slice(0, 400);
    return {
      mk: "1",
      ...(fbp && META_COOKIE.test(fbp) ? { mk_fbp: fbp } : {}),
      ...(fbc && META_COOKIE.test(fbc) ? { mk_fbc: fbc } : {}),
      ...(ip ? { mk_ip: ip } : {}),
      ...(userAgent ? { mk_ua: userAgent } : {}),
    };
  } catch {
    // No request to read (called outside one): record nothing rather than guess.
    return {};
  }
}

/** The inverse, read back in the webhook; every field is optional and an unknown shape means "no consent". */
export function trackingFromMetadata(metadata: Stripe.Metadata | null | undefined): PurchaseTracking {
  const m = metadata ?? {};
  return {
    consent: m.mk === "1",
    ip: m.mk_ip || undefined,
    userAgent: m.mk_ua || undefined,
    fbp: m.mk_fbp && META_COOKIE.test(m.mk_fbp) ? m.mk_fbp : undefined,
    fbc: m.mk_fbc && META_COOKIE.test(m.mk_fbc) ? m.mk_fbc : undefined,
  };
}
