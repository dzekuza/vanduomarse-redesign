import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The Conversions API action is server code; these GA tests never reach it (no Pixel id).
vi.mock("@/app/actions/meta-capi", () => ({ reportMetaEvent: () => Promise.resolve() }));

const GA = "G-TEST123456";

/** A browser with localStorage and timers, and the consent a visitor stored. */
function browser(consent: { analytics: boolean } | null) {
  const store: Record<string, string> = {};
  if (consent) store.vm_consent = JSON.stringify({ analytics: consent.analytics, marketing: false, v: 1, at: Date.now() });
  const win = {
    localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) },
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    gtag: undefined as undefined | ((...args: unknown[]) => void),
  };
  vi.stubGlobal("window", win);
  return win;
}

async function load(id: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id ?? "");
  return import("@/lib/analytics");
}

describe("analytics", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends nothing without a stored choice, after a refusal, or without a GA id", async () => {
    for (const [consent, id] of [[null, GA], [{ analytics: false }, GA], [{ analytics: true }, undefined]] as const) {
      const win = browser(consent);
      const gtag = vi.fn();
      win.gtag = gtag;
      const { trackLead } = await load(id);
      trackLead("sauna", { value: 50 });
      await vi.advanceTimersByTimeAsync(1000);
      expect(gtag).not.toHaveBeenCalled();
    }
  });

  it("sends a generate_lead with the choice and price, and no personal fields", async () => {
    const win = browser({ analytics: true });
    const gtag = vi.fn();
    win.gtag = gtag;
    const { trackLead } = await load(GA);
    trackLead("stay", { itemName: "Namelis 2 asmenims", value: 100 });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", { lead_type: "stay", item_name: "Namelis 2 asmenims", value: 100, currency: "EUR" });
  });

  it("describes a checkout and a purchase as GA4 ecommerce events", async () => {
    const win = browser({ analytics: true });
    const gtag = vi.fn();
    win.gtag = gtag;
    const { trackCheckout, trackPurchase } = await load(GA);
    trackCheckout("coupon", { itemName: "Dovanų kuponas", value: 40 });
    trackPurchase("coupon", "KP-1", { itemName: "Dovanų kuponas", value: 40 });
    expect(gtag).toHaveBeenNthCalledWith(1, "event", "begin_checkout", { value: 40, currency: "EUR", items: [{ item_name: "Dovanų kuponas", item_category: "coupon", quantity: 1, price: 40 }] });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "purchase", { transaction_id: "KP-1", value: 40, currency: "EUR", items: [{ item_name: "Dovanų kuponas", item_category: "coupon", quantity: 1, price: 40 }] });
  });

  it("waits for gtag.js to load, then sends once", async () => {
    const win = browser({ analytics: true });
    const { trackSignUp } = await load(GA);
    trackSignUp("rider_registration");
    await vi.advanceTimersByTimeAsync(500);
    const gtag = vi.fn();
    win.gtag = gtag;
    await vi.advanceTimersByTimeAsync(500);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "sign_up", { method: "rider_registration" });
  });

  it("gives up after a few seconds if gtag.js never loads", async () => {
    const win = browser({ analytics: true });
    const { trackSignUp } = await load(GA);
    trackSignUp("x");
    await vi.advanceTimersByTimeAsync(10_000);
    const gtag = vi.fn();
    win.gtag = gtag;
    await vi.advanceTimersByTimeAsync(2000);
    expect(gtag).not.toHaveBeenCalled();
  });
  it("sends view_item and puts the discount code on checkout and purchase", async () => {
    const win = browser({ analytics: true });
    const gtag = vi.fn();
    win.gtag = gtag;
    const { trackViewItem, trackCheckout, trackPurchase } = await load(GA);
    const bf = { itemName: "WAKE sezono abonementas", value: 270, coupon: "WAKEBLACKFRIDAY2026" };
    trackViewItem("plan", bf);
    trackCheckout("plan", bf);
    trackPurchase("plan", "AB-7", bf);
    const item = { item_name: "WAKE sezono abonementas", item_category: "plan", quantity: 1, price: 270, coupon: "WAKEBLACKFRIDAY2026" };
    expect(gtag).toHaveBeenNthCalledWith(1, "event", "view_item", { value: 270, currency: "EUR", items: [item] });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "begin_checkout", { value: 270, currency: "EUR", coupon: "WAKEBLACKFRIDAY2026", items: [item] });
    expect(gtag).toHaveBeenNthCalledWith(3, "event", "purchase", { transaction_id: "AB-7", value: 270, currency: "EUR", coupon: "WAKEBLACKFRIDAY2026", items: [item] });
  });
});
