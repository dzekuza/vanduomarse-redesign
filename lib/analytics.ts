import { GA_ID, PIXEL_ID, parseConsent, readRawConsent } from "@/lib/consent";

/**
 * Google Analytics 4 and Meta Pixel events for what visitors do on the site (requests sent, checkout started,
 * payment received, registration finished). Each helper sends the GA event and Meta's matching standard event.
 *
 * Nothing is sent to GA unless a GA ID is configured and this visitor allowed analytics, and nothing to Meta unless a
 * Pixel ID is configured and they allowed marketing in the cookie banner (the same checks the tracker loaders make),
 * so callers never have to ask. Parameters never carry names, phones, e-mails or
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
  /** Discount code applied (e.g. a campaign code such as WAKEBLACKFRIDAY2026), so ad and campaign reports can split sales by it. */
  coupon?: string;
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

/** True when the Meta Pixel is configured and this visitor allowed marketing cookies. */
export function marketingAllowed(): boolean {
  if (typeof window === "undefined" || !PIXEL_ID) return false;
  return parseConsent(readRawConsent())?.marketing === true;
}

type PixelParams = Record<string, string | number | string[] | undefined>;

/**
 * Sends one Meta Pixel standard event, if allowed; waits briefly for fbevents.js like `trackEvent`. `eventId` lets
 * Meta drop a duplicate of the same purchase (e.g. the return page reloaded).
 */
export function trackPixel(name: string, params?: PixelParams, eventId?: string): void {
  if (!marketingAllowed()) return;
  let tries = 0;
  const send = () => {
    if (window.fbq) window.fbq("track", name, params, eventId ? { eventID: eventId } : undefined);
    else if (tries++ < WAIT_TRIES) window.setTimeout(send, WAIT_STEP_MS);
  };
  send();
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

/** Meta's standard parameters: what was chosen and, when known, the value in euros. */
const pixelParams = (kind: ActivityKind, input: ItemInput): PixelParams => ({
  content_category: kind,
  content_name: input.itemName ?? kind,
  ...(input.value === undefined ? {} : { value: Math.round(input.value * 100) / 100, currency: CURRENCY }),
  ...(input.coupon ? { coupon: input.coupon } : {}),
});

function items(kind: ActivityKind, { itemName, value, coupon }: ItemInput) {
  return [{ item_name: itemName ?? kind, item_category: kind, quantity: 1, ...(value === undefined ? {} : { price: Math.round(value * 100) / 100 }), ...(coupon ? { coupon } : {}) }];
}

/** GA4 puts the order's discount code on the event as well as on the item. */
const couponParam = ({ coupon }: ItemInput) => (coupon ? { coupon } : {});

/** A visitor opened something they can buy (e.g. a campaign landing page from an ad): `view_item` and Meta `ViewContent`. */
export function trackViewItem(kind: ActivityKind, input: ItemInput = {}): void {
  trackEvent("view_item", { ...money(input), items: items(kind, input) });
  trackPixel("ViewContent", pixelParams(kind, input));
}

/** A request or enquiry was sent without paying online (staff confirm it): GA's recommended `generate_lead`. */
export function trackLead(kind: ActivityKind, input: ItemInput = {}): void {
  trackEvent("generate_lead", { lead_type: kind, ...(input.itemName ? { item_name: input.itemName } : {}), ...money(input) });
  trackPixel("Lead", pixelParams(kind, input));
}

/** The visitor is being sent to Stripe Checkout: `begin_checkout`. */
export function trackCheckout(kind: ActivityKind, input: ItemInput = {}): void {
  trackEvent("begin_checkout", { ...money(input), ...couponParam(input), items: items(kind, input) });
  trackPixel("InitiateCheckout", pixelParams(kind, input));
}

/** A payment came back paid: `purchase`, counted once per transaction id. */
export function trackPurchase(kind: ActivityKind, transactionId: string, input: ItemInput = {}): void {
  trackEvent("purchase", { transaction_id: transactionId, ...money(input), ...couponParam(input), items: items(kind, input) });
  // Meta requires value and currency on Purchase; 0 when the amount is not known on the page.
  trackPixel("Purchase", { ...pixelParams(kind, input), value: input.value === undefined ? 0 : Math.round(input.value * 100) / 100, currency: CURRENCY }, `purchase-${transactionId}`);
}

/** A new customer finished registering: `sign_up`. */
export function trackSignUp(method: string): void {
  trackEvent("sign_up", { method });
  trackPixel("CompleteRegistration", { content_name: method });
}
