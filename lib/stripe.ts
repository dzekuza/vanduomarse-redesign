import "server-only";
import { headers } from "next/headers";
import Stripe from "stripe";

/**
 * Stripe, server side. Online payment on /rezervacija is on only when both secrets are set
 * (STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET); without them the page files requests
 * as before and staff confirm by phone. Prices always come from the database totals.
 */

export class MissingStripeKeyError extends Error {
  constructor() {
    super("Missing STRIPE_SECRET_KEY — see .env.example.");
  }
}

export const paymentsEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);

let client: Stripe | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new MissingStripeKeyError();
  client ??= new Stripe(key, { maxNetworkRetries: 2, appInfo: { name: "vanduomarse" } });
  return client;
}

/** Euros with two decimals (as stored) to the integer cents Stripe wants. */
export const toCents = (euros: number) => Math.round(euros * 100);

/** Where Stripe sends the visitor back: SITE_URL when set, otherwise this request's own origin. */
export async function siteOrigin(): Promise<string> {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
