import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/** The visitor's cookies; `vm_mkt=1` is the marketing consent the banner mirrors for the server. */
let cookieJar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  headers: async () => new Map([["user-agent", "UA"], ["x-forwarded-for", "1.2.3.4"]]),
  cookies: async () => ({ get: (name: string) => (name in cookieJar ? { value: cookieJar[name] } : undefined) }),
}));
const customer = vi.fn<() => Promise<{ id: string; email: string | null; phone: string | null; name: string } | null>>(async () => null);
vi.mock("@/lib/customer", () => ({ getCustomer: () => customer() }));

const send = vi.fn<(event: unknown) => Promise<void>>(() => Promise.resolve());
vi.mock("@/lib/meta-capi", () => ({
  CAPI_EVENTS: ["ViewContent", "Lead", "Schedule", "InitiateCheckout", "CompleteRegistration", "Purchase"],
  capiConfigured: () => true,
  sendCapiEvent: (event: unknown) => send(event),
}));

const base = { name: "Purchase" as const, eventId: "forged-event-id", sourceUrl: "https://www.vanduomarse.lt/registracija/apmoketa", value: 1, coupon: "FORGED" };
const sent = () => send.mock.calls[0]?.[0] as { eventId: string; user: Record<string, unknown>; custom: Record<string, unknown> };

describe("reportMetaEvent", () => {
  beforeEach(() => {
    send.mockClear();
    customer.mockReset();
    customer.mockResolvedValue(null);
    cookieJar = { vm_mkt: "1" };
  });
  afterEach(() => vi.restoreAllMocks());

  it("sends nothing without the marketing consent cookie, whatever the browser asks", async () => {
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    cookieJar = {};
    await reportMetaEvent({ name: "ViewContent", eventId: "abc12345", sourceUrl: "https://www.vanduomarse.lt/" });
    cookieJar = { vm_mkt: "0" };
    await reportMetaEvent({ name: "ViewContent", eventId: "abc12345", sourceUrl: "https://www.vanduomarse.lt/" });
    expect(send).not.toHaveBeenCalled();
  });

  it("no longer accepts a Purchase from the browser: the Stripe webhook reports sales (ADR-0111)", async () => {
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, name: "Purchase", value: 675 } as unknown as Parameters<typeof reportMetaEvent>[0]);
    expect(send).not.toHaveBeenCalled();
  });

  describe("contact typed into the checkout form", () => {
    const checkout = { name: "InitiateCheckout" as const, eventId: "checkout-evt-1", sourceUrl: "https://www.vanduomarse.lt/registracija/wake/black-friday", value: 675 };
    const typed = { email: "jonas@example.com", name: "Jonas Jonaitis Vyresnysis", phone: "+37061234567" };

    it("fills the user data of an anonymous visitor's checkout event", async () => {
      const { reportMetaEvent } = await import("@/app/actions/meta-capi");
      await reportMetaEvent({ ...checkout, contact: typed });
      expect(sent().user).toMatchObject({ email: "jonas@example.com", phone: "+37061234567", firstName: "Jonas", lastName: "Jonaitis Vyresnysis" });
      expect(sent().user.externalId).toBeUndefined();
    });

    it("lets a signed-in customer's confirmed details win, typed text only fills what the account lacks", async () => {
      customer.mockResolvedValue({ id: "cust-1", email: null, phone: "+37069999999", name: "Ona Onaitė" });
      const { reportMetaEvent } = await import("@/app/actions/meta-capi");
      await reportMetaEvent({ ...checkout, contact: typed });
      expect(sent().user).toMatchObject({ email: "jonas@example.com", phone: "+37069999999", firstName: "Ona", lastName: "Onaitė", externalId: "cust-1" });
    });

    it("still sends the event when the typed e-mail is malformed or over-long fields are cut by the schema", async () => {
      const { reportMetaEvent } = await import("@/app/actions/meta-capi");
      await reportMetaEvent({ ...checkout, contact: { email: "not-an-email", name: "Jonas" } });
      expect(send).toHaveBeenCalledTimes(1);
      send.mockClear();
      await reportMetaEvent({ ...checkout, contact: { email: "a".repeat(200) + "@b.lt" } });
      expect(send).not.toHaveBeenCalled();
    });
  });
});
