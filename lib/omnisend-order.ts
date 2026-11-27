import "server-only";
import { normalizeEmail } from "@/lib/meta-capi";
import {
  verifyPurchase,
  type PurchaseKind,
  type VerifiedPurchase,
} from "@/lib/meta-purchase";

/**
 * Sends a paid order to Omnisend as a `placed order` event (ADR-0143), so Omnisend can credit the sale to the email
 * campaign or automation the buyer clicked and show revenue in its reports.
 *
 * Called from the Stripe webhook next to the Meta report. Only buyers who are already Omnisend contacts are reported:
 * a buyer who never subscribed is not added to the email tool by a purchase. Nothing is sent without `OMNISEND_API_KEY`
 * (server only). Never throws: an Omnisend failure must not fail the Stripe webhook.
 */

const API = "https://api.omnisend.com/api";
const API_VERSION = "2026-03-15";

/** What each kind of payment is called in Omnisend's order lines. */
const TITLE: Record<PurchaseKind, string> = {
  plan: "WAKE abonementas",
  coupon: "Dovanų kuponas",
  reservation: "Rezervacija",
};

export const omnisendConfigured = () => Boolean(process.env.OMNISEND_API_KEY);

const headers = () => ({
  "X-API-KEY": process.env.OMNISEND_API_KEY ?? "",
  "Omnisend-Version": API_VERSION,
  accept: "application/json",
  "content-type": "application/json",
});

/** Whether Omnisend already knows this e-mail. A failed lookup counts as "no", so nothing is sent then. */
async function isContact(email: string): Promise<boolean> {
  const res = await fetch(
    `${API}/contacts?${new URLSearchParams({ email, limit: "1" })}`,
    { headers: headers() },
  );
  if (!res.ok) return false;
  const body: unknown = await res.json();
  const contacts = (body as { contacts?: unknown[] } | null)?.contacts;
  return Array.isArray(contacts) && contacts.length > 0;
}

/** The `placed order` event body for a verified, paid order. */
export function placedOrderEvent(
  kind: PurchaseKind,
  paid: VerifiedPurchase,
  email: string,
  now = new Date(),
) {
  const total = Math.round(paid.value * 100) / 100;
  return {
    eventName: "placed order",
    origin: "api",
    eventVersion: "v2",
    eventTime: now.toISOString(),
    contact: { email },
    properties: {
      orderID: paid.transactionId,
      orderNumber: paid.transactionId,
      createdAt: now.toISOString(),
      currency: "EUR",
      paymentStatus: "paid",
      fulfillmentStatus: "fulfilled",
      totalPrice: total,
      subTotalPrice: total,
      subTotalTaxIncluded: true,
      ...(paid.coupon ? { discounts: [{ code: paid.coupon }] } : {}),
      lineItems: [
        {
          productID: kind,
          productTitle: TITLE[kind],
          productPrice: total,
          productQuantity: 1,
          productCategories: [
            { id: paid.category ?? kind, title: paid.category ?? kind },
          ],
        },
      ],
    },
  };
}

/** Reports a just-paid order. `proof` is the same as for the Meta report: the reservation payment id, or the Checkout session id. */
export async function reportOrderToOmnisend(
  kind: PurchaseKind,
  proof: string,
): Promise<void> {
  try {
    if (!omnisendConfigured()) return;
    const paid = await verifyPurchase(kind, proof);
    const email = paid?.user.email ? normalizeEmail(paid.user.email) : null;
    if (!paid || !email) return;
    if (!(await isContact(email))) return;
    const res = await fetch(`${API}/events`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(placedOrderEvent(kind, paid, email)),
    });
    if (!res.ok)
      console.error(
        `Omnisend order report failed (${kind}): HTTP ${res.status}`,
      );
  } catch (e) {
    console.error(
      `Omnisend order report failed (${kind}):`,
      e instanceof Error ? e.message : e,
    );
  }
}
