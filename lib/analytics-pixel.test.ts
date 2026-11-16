import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const report = vi.fn<(input: unknown) => Promise<void>>(() => Promise.resolve());
vi.mock("@/app/actions/meta-capi", () => ({ reportMetaEvent: (input: unknown) => report(input) }));

const PIXEL = "1234567890";
/** Every Pixel event now carries an event id, shared with its Conversions API copy. */
const ANY_ID = expect.objectContaining({ eventID: expect.any(String) });

/** A browser with localStorage and timers, and the consent a visitor stored. */
function browser(consent: { marketing: boolean } | null) {
  const store: Record<string, string> = {};
  if (consent) store.vm_consent = JSON.stringify({ analytics: false, marketing: consent.marketing, v: 1, at: Date.now() });
  const win = {
    localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v) },
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    location: { href: "https://www.vanduomarse.lt/registracija/wake/black-friday" },
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
  beforeEach(() => {
    vi.useFakeTimers();
    report.mockClear();
  });
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
    expect(fbq).toHaveBeenNthCalledWith(1, "track", "Lead", { content_category: "stay", content_name: "Namelis 2 asmenims", value: 100, currency: "EUR" }, ANY_ID);
    expect(fbq).toHaveBeenNthCalledWith(2, "track", "InitiateCheckout", { content_category: "coupon", content_name: "Dovanų kuponas", value: 40, currency: "EUR" }, ANY_ID);
    expect(fbq).toHaveBeenNthCalledWith(3, "track", "Purchase", { content_category: "coupon", content_name: "Dovanų kuponas", value: 40, currency: "EUR" }, { eventID: "purchase-KP-1" });
    expect(fbq).toHaveBeenNthCalledWith(4, "track", "CompleteRegistration", { content_name: "rider_registration" }, ANY_ID);
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
    expect(fbq).toHaveBeenNthCalledWith(1, "track", "ViewContent", params, ANY_ID);
    expect(fbq).toHaveBeenNthCalledWith(2, "track", "InitiateCheckout", params, ANY_ID);
    expect(fbq).toHaveBeenNthCalledWith(3, "track", "Purchase", params, { eventID: "purchase-AB-7" });
  });
  it("sends the same event id to the Conversions API, with the order to verify for a purchase", async () => {
    const win = browser({ marketing: true });
    const fbq = vi.fn();
    win.fbq = fbq;
    const { trackLead, trackPurchase } = await load(PIXEL);
    trackLead("sauna", { itemName: "Pirtis Marse", value: 160 });
    trackPurchase("plan", "AB-7", { itemName: "WAKE sezono abonementas", value: 675, coupon: "WAKEBLACKFRIDAY2026" });
    const leadId = (fbq.mock.calls[0][3] as { eventID: string }).eventID;
    expect(report).toHaveBeenNthCalledWith(1, expect.objectContaining({ name: "Lead", eventId: leadId, value: 160, contentName: "Pirtis Marse", contentCategory: "sauna" }));
    expect(report).toHaveBeenNthCalledWith(2, expect.objectContaining({
      name: "Purchase", eventId: "purchase-AB-7", coupon: "WAKEBLACKFRIDAY2026", purchase: { kind: "plan", transactionId: "AB-7" },
      sourceUrl: "https://www.vanduomarse.lt/registracija/wake/black-friday",
    }));
  });

  it("reports to the Conversions API even when the Pixel script never loads (ad blocker)", async () => {
    browser({ marketing: true });
    const { trackCheckout } = await load(PIXEL);
    trackCheckout("plan", { value: 675 });
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ name: "InitiateCheckout", value: 675 }));
  });

  it("sends nothing to the Conversions API without marketing consent", async () => {
    browser({ marketing: false });
    const { trackLead } = await load(PIXEL);
    trackLead("sauna");
    expect(report).not.toHaveBeenCalled();
  });
});
