import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PIXEL = "1234567890";

/** A browser with localStorage and timers, and the consent a visitor stored. */
function browser(consent: { marketing: boolean } | null) {
  const store: Record<string, string> = {};
  if (consent) store.vm_consent = JSON.stringify({ analytics: false, marketing: consent.marketing, v: 1, at: Date.now() });
  const win = {
    localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) },
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    fbq: undefined as undefined | ((...args: unknown[]) => void),
    gtag: undefined as undefined | ((...args: unknown[]) => void),
  };
  vi.stubGlobal("window", win);
  return win;
}

async function load(id: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", id ?? "");
  return import("@/lib/analytics");
}

describe("Meta Pixel events", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends nothing without a stored choice, after a refusal, or without a Pixel id", async () => {
    for (const [consent, id] of [[null, PIXEL], [{ marketing: false }, PIXEL], [{ marketing: true }, undefined]] as const) {
      const win = browser(consent);
      const fbq = vi.fn();
      win.fbq = fbq;
      const { trackLead } = await load(id);
      trackLead("sauna", { value: 50 });
      await vi.advanceTimersByTimeAsync(1000);
      expect(fbq).not.toHaveBeenCalled();
    }
  });

  it("maps the GA helpers to Meta standard events with the choice and price only", async () => {
    const win = browser({ marketing: true });
    const fbq = vi.fn();
    win.fbq = fbq;
    const { trackLead, trackCheckout, trackPurchase, trackSignUp } = await load(PIXEL);
    trackLead("stay", { itemName: "Namelis 2 asmenims", value: 100 });
    trackCheckout("coupon", { itemName: "Dovanų kuponas", value: 40 });
    trackPurchase("coupon", "KP-1", { itemName: "Dovanų kuponas", value: 40 });
    trackSignUp("rider_registration");
    expect(fbq).toHaveBeenNthCalledWith(1, "track", "Lead", { content_category: "stay", content_name: "Namelis 2 asmenims", value: 100, currency: "EUR" }, undefined);
    expect(fbq).toHaveBeenNthCalledWith(2, "track", "InitiateCheckout", { content_category: "coupon", content_name: "Dovanų kuponas", value: 40, currency: "EUR" }, undefined);
    expect(fbq).toHaveBeenNthCalledWith(3, "track", "Purchase", { content_category: "coupon", content_name: "Dovanų kuponas", value: 40, currency: "EUR" }, { eventID: "purchase-KP-1" });
    expect(fbq).toHaveBeenNthCalledWith(4, "track", "CompleteRegistration", { content_name: "rider_registration" }, undefined);
  });

  it("gives a Purchase without a known amount a value of 0, as Meta requires one", async () => {
    const win = browser({ marketing: true });
    const fbq = vi.fn();
    win.fbq = fbq;
    const { trackPurchase } = await load(PIXEL);
    trackPurchase("plan", "PL-9");
    expect(fbq).toHaveBeenCalledWith("track", "Purchase", { content_category: "plan", content_name: "plan", value: 0, currency: "EUR" }, { eventID: "purchase-PL-9" });
  });

  it("waits for fbevents.js to load, then sends once", async () => {
    const win = browser({ marketing: true });
    const { trackLead } = await load(PIXEL);
    trackLead("quad_tour");
    const fbq = vi.fn();
    await vi.advanceTimersByTimeAsync(300);
    win.fbq = fbq;
    await vi.advanceTimersByTimeAsync(5000);
    expect(fbq).toHaveBeenCalledTimes(1);
  });
  it("labels a campaign landing, checkout and purchase with the discount code", async () => {
    const win = browser({ marketing: true });
    const fbq = vi.fn();
    win.fbq = fbq;
    const { trackViewItem, trackCheckout, trackPurchase } = await load(PIXEL);
    const bf = { itemName: "WAKE sezono abonementas", value: 270, coupon: "WAKEBLACKFRIDAY2026" };
    trackViewItem("plan", bf);
    trackCheckout("plan", bf);
    trackPurchase("plan", "AB-7", bf);
    const params = { content_category: "plan", content_name: "WAKE sezono abonementas", value: 270, currency: "EUR", coupon: "WAKEBLACKFRIDAY2026" };
    expect(fbq).toHaveBeenNthCalledWith(1, "track", "ViewContent", params, undefined);
    expect(fbq).toHaveBeenNthCalledWith(2, "track", "InitiateCheckout", params, undefined);
    expect(fbq).toHaveBeenNthCalledWith(3, "track", "Purchase", params, { eventID: "purchase-AB-7" });
  });
});
