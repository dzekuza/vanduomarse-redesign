import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const verifyPurchase = vi.fn();
vi.mock("@/lib/meta-purchase", () => ({ verifyPurchase: (...a: unknown[]) => verifyPurchase(...a) }));
vi.mock("@/lib/meta-capi", () => ({ normalizeEmail: (e: string) => e.trim().toLowerCase() }));

const { placedOrderEvent, reportOrderToOmnisend } = await import("@/lib/omnisend-order");

const PASS = { transactionId: "WAKE-7Q2K", value: 300, coupon: "BF2026", user: { email: " Ona@Example.lt " } };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  process.env.OMNISEND_API_KEY = "test-key";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OMNISEND_API_KEY;
});

const json = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body });

describe("placedOrderEvent (ADR-0143)", () => {
  it("builds a v2 placed order with the paid value as the total and the discount code", () => {
    const e = placedOrderEvent("plan", PASS, "ona@example.lt", new Date("2026-11-28T10:00:00Z"));
    expect(e).toMatchObject({ eventName: "placed order", origin: "api", eventVersion: "v2", contact: { email: "ona@example.lt" } });
    expect(e.properties).toMatchObject({ orderID: "WAKE-7Q2K", currency: "EUR", totalPrice: 300, paymentStatus: "paid", discounts: [{ code: "BF2026" }] });
    expect(e.properties.lineItems[0]).toMatchObject({ productTitle: "WAKE abonementas", productPrice: 300, productQuantity: 1 });
  });
});

describe("reportOrderToOmnisend", () => {
  it("sends the order for a buyer who is already a contact", async () => {
    verifyPurchase.mockResolvedValue(PASS);
    fetchMock.mockResolvedValueOnce(json({ contacts: [{ id: "c1" }] })).mockResolvedValueOnce(json({}, 202));
    await reportOrderToOmnisend("plan", "cs_test_a1b2c3d4e5f6");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://api.omnisend.com/api/events");
    expect((init.headers as Record<string, string>)["X-API-KEY"]).toBe("test-key");
    expect(JSON.parse(String(init.body)).contact.email).toBe("ona@example.lt");
  });

  it("does not add a buyer who is not an Omnisend contact", async () => {
    verifyPurchase.mockResolvedValue(PASS);
    fetchMock.mockResolvedValueOnce(json({ contacts: [] }));
    await reportOrderToOmnisend("plan", "cs_test_a1b2c3d4e5f6");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends nothing without an API key, for an unpaid order, or without an e-mail", async () => {
    delete process.env.OMNISEND_API_KEY;
    await reportOrderToOmnisend("plan", "cs_x");
    process.env.OMNISEND_API_KEY = "test-key";
    verifyPurchase.mockResolvedValueOnce(null);
    await reportOrderToOmnisend("plan", "cs_x");
    verifyPurchase.mockResolvedValueOnce({ ...PASS, user: {} });
    await reportOrderToOmnisend("plan", "cs_x");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when Omnisend is down", async () => {
    verifyPurchase.mockResolvedValue(PASS);
    fetchMock.mockRejectedValue(new Error("network"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(reportOrderToOmnisend("plan", "cs_x")).resolves.toBeUndefined();
    log.mockRestore();
  });
});
