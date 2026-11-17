import { reportMetaEvent } from "@/app/actions/meta-capi";
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

/**
 * Contact details the visitor has just typed into the form they are submitting. Used only for Meta matching (hashed, and
 * only after marketing consent); never sent to Google Analytics and never put in an event's name or parameters.
 */
export interface PixelContact {
  email?: string;
  /** Full name as typed; split into first and last name where it is sent. */
  name?: string;
  phone?: string;
}

interface ItemInput {
  /** What was chosen, e.g. "Pirtis Marse" or a coupon name; never personal data. */
  itemName?: string;
  /** Typed contact of the person checking out: sent to Meta (hashed) with the checkout event, never to GA. */
  contact?: PixelContact;
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

type PixelEventName = "ViewContent" | "Lead" | "InitiateCheckout" | "CompleteRegistration" | "Purchase";

interface PixelOptions {
  /** Fixed id (a purchase's, so a reloaded return page counts once); otherwise a fresh one per event. */
  eventId?: string;
  /** Contact typed into the form (not for a Purchase: its server copy is built from the paid order). */
  contact?: PixelContact;
}

const newEventId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * Meta's browser "advanced matching" fields for the typed contact: the Pixel normalises and hashes them itself. The phone is
 * left to the server copy, which knows how to complete a Lithuanian number.
 */
export function pixelUserData(contact: PixelContact | undefined): Record<string, string> | null {
  if (!contact) return null;
  const email = contact.email?.trim().toLowerCase();
  const [first, ...rest] = (contact.name ?? "").trim().split(/\s+/);
  const data: Record<string, string> = {
    ...(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { em: email } : {}),
    ...(first ? { fn: first.toLowerCase() } : {}),
    ...(rest.length ? { ln: rest.join(" ").toLowerCase() } : {}),
  };
  return Object.keys(data).length ? data : null;
}

const num = (v: unknown) => (typeof v === "number" ? v : undefined);
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

/**
 * Sends one Meta standard event, if allowed: to the Pixel (waiting briefly for fbevents.js like `trackEvent`) and, with
 * the same event id, to the Conversions API through `reportMetaEvent` (ADR-0107). Meta keeps one of the two; the server
 * copy still arrives when an ad blocker stops the Pixel.
 */
export function trackPixel(name: PixelEventName, params?: PixelParams, options: PixelOptions = {}): void {
  if (!marketingAllowed()) return;
  const eventId = options.eventId ?? newEventId();
  let tries = 0;
  const userData = name === "Purchase" ? null : pixelUserData(options.contact);
  const send = () => {
    if (window.fbq) {
      // Meta takes later advanced-matching data from another `init` of the same Pixel; it fires no event by itself.
      if (userData) window.fbq("init", PIXEL_ID, userData);
      window.fbq("track", name, params, { eventID: eventId });
    } else if (tries++ < WAIT_TRIES) window.setTimeout(send, WAIT_STEP_MS);
  };
  send();

  // A Purchase is reported to the Conversions API by the Stripe webhook (ADR-0111): it needs no browser, so an ad blocker, iOS
  // or a closed tab cannot hide it. Both copies carry the same event id, and Meta keeps one.
  if (name === "Purchase") return;

  // Origin and path only: the query of a payment return page carries the payer's proof (?pid / ?sid), which Meta must not get.
  const loc = window.location;
  if (!loc?.origin) return;
  const sourceUrl = `${loc.origin}${loc.pathname}`;
  void reportMetaEvent({
    name,
    eventId,
    sourceUrl,
    value: num(params?.value),
    contentName: str(params?.content_name),
    contentCategory: str(params?.content_category),
    coupon: str(params?.coupon),
    ...(options.contact ? { contact: options.contact } : {}),
  }).catch(() => {});
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

/**
 * A visitor opened something they can buy (e.g. a campaign landing page from an ad): `view_item` and Meta `ViewContent`.
 * `to` picks the trackers, so a page can send each one when its own consent arrives.
 */
export function trackViewItem(kind: ActivityKind, input: ItemInput = {}, to: { ga?: boolean; meta?: boolean } = { ga: true, meta: true }): void {
  if (to.ga) trackEvent("view_item", { ...money(input), items: items(kind, input) });
  if (to.meta) trackPixel("ViewContent", pixelParams(kind, input));
}

/** A request or enquiry was sent without paying online (staff confirm it): GA's recommended `generate_lead`. */
export function trackLead(kind: ActivityKind, input: ItemInput = {}): void {
  trackEvent("generate_lead", { lead_type: kind, ...(input.itemName ? { item_name: input.itemName } : {}), ...money(input) });
  trackPixel("Lead", pixelParams(kind, input));
}

/** The visitor is being sent to Stripe Checkout: `begin_checkout`. */
export function trackCheckout(kind: ActivityKind, input: ItemInput = {}): void {
  trackEvent("begin_checkout", { ...money(input), ...couponParam(input), items: items(kind, input) });
  trackPixel("InitiateCheckout", pixelParams(kind, input), { contact: input.contact });
}

/**
 * A payment came back paid: GA `purchase` and the Pixel's `Purchase`, counted once per transaction id. The Conversions API copy
 * is sent by the Stripe webhook with the same event id (`purchase-<transaction id>`), not from here.
 */
export function trackPurchase(
  kind: ActivityKind,
  transactionId: string,
  input: ItemInput = {},
  to: { ga?: boolean; meta?: boolean } = { ga: true, meta: true },
): void {
  if (to.ga) trackEvent("purchase", { transaction_id: transactionId, ...money(input), ...couponParam(input), items: items(kind, input) });
  if (!to.meta) return;
  // Meta requires value and currency on Purchase; 0 when the amount is not known on the page.
  trackPixel("Purchase", { ...pixelParams(kind, input), value: input.value === undefined ? 0 : Math.round(input.value * 100) / 100, currency: CURRENCY }, { eventId: `purchase-${transactionId}` });
}

/** A new customer finished registering: `sign_up`. */
export function trackSignUp(method: string): void {
  trackEvent("sign_up", { method });
  trackPixel("CompleteRegistration", { content_name: method });
}
