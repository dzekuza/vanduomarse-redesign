import { GA_ID, parseConsent, readRawConsent } from "@/lib/consent";

/**
 * Google Analytics 4 events for what visitors do on the site (requests sent, checkout started, payment received).
 *
 * Nothing is sent unless a GA ID is configured and this visitor allowed analytics in the cookie banner (the same
 * check the tracker loader makes), so callers never have to ask. Parameters never carry names, phones, e-mails or
 * references: only what was chosen (service, a price) and the transaction id GA needs to count a payment once.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** The kinds of request a visitor can send; the `lead_type` / `item_category` values in GA reports. */
export type ActivityKind =
  | "sauna"
  | "sauna_session"
  | "stay"
  | "quad_rental"
  | "quad_tour"
  | "reservation"
  | "event_registration"
  | "event_inquiry"
  | "coupon"
  | "plan"
  | "rider_registration";

interface ItemInput {
  /** What was chosen, e.g. "Pirtis Marse" or a coupon name; never personal data. */
  itemName?: string;
  /** Euros including VAT. */
  value?: number;
}

const CURRENCY = "EUR";
/** gtag.js loads after the page is interactive: events sent sooner wait for it, up to 5 s. */
const WAIT_STEP_MS = 250;
const WAIT_TRIES = 20;

/** True when analytics is configured and this visitor said yes to it. */
export function analyticsAllowed(): boolean {
  if (typeof window === "undefined" || !GA_ID) return false;
  return parseConsent(readRawConsent())?.analytics === true;
}

/** Sends one GA4 event, if allowed; waits briefly for gtag.js when it is still loading. */
export function trackEvent(name: string, params?: Record<string, string | number | boolean | object[] | undefined>): void {
  if (!analyticsAllowed()) return;
  let tries = 0;
  const send = () => {
    if (window.gtag) window.gtag("event", name, params);
    else if (tries++ < WAIT_TRIES) window.setTimeout(send, WAIT_STEP_MS);
  };
  send();
}

const money = ({ value }: ItemInput) => (value === undefined ? {} : { value: Math.round(value * 100) / 100, currency: CURRENCY });

function items(kind: ActivityKind, { itemName, value }: ItemInput) {
  return [{ item_name: itemName ?? kind, item_category: kind, quantity: 1, ...(value === undefined ? {} : { price: Math.round(value * 100) / 100 }) }];
}

/** A request or enquiry was sent without paying online (staff confirm it): GA's recommended `generate_lead`. */
export function trackLead(kind: ActivityKind, input: ItemInput = {}): void {
  trackEvent("generate_lead", { lead_type: kind, ...(input.itemName ? { item_name: input.itemName } : {}), ...money(input) });
}

/** The visitor is being sent to Stripe Checkout: `begin_checkout`. */
export function trackCheckout(kind: ActivityKind, input: ItemInput = {}): void {
  trackEvent("begin_checkout", { ...money(input), items: items(kind, input) });
}

/** A payment came back paid: `purchase`, counted once per transaction id. */
export function trackPurchase(kind: ActivityKind, transactionId: string, input: ItemInput = {}): void {
  trackEvent("purchase", { transaction_id: transactionId, ...money(input), items: items(kind, input) });
}

/** A new customer finished registering: `sign_up`. */
export function trackSignUp(method: string): void {
  trackEvent("sign_up", { method });
}
