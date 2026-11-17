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
  CAPI_EVENTS: ["ViewContent", "Lead", "InitiateCheckout", "CompleteRegistration", "Purchase"],
  capiConfigured: () => true,
  sendCapiEvent: (event: unknown) => send(event),
}));

/** One table row per lookup; the test sets what the database "has" and checks which key was used. */
let row: Record<string, unknown> | null = null;
/** The plan-pass table (a plan bought without registering), read only after the plan-order lookup finds nothing. */
let passRow: Record<string, unknown> | null = null;
const lookups: { table: string; column: string; value: string }[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: string) => {
          lookups.push({ table, column, value });
          return { maybeSingle: async () => ({ data: table === "plan_passes" ? passRow : row }) };
        },
      }),
    }),
  }),
}));

const SESSION = "cs_test_a1b2c3d4e5f6g7";
const base = { name: "Purchase" as const, eventId: "forged-event-id", sourceUrl: "https://www.vanduomarse.lt/registracija/apmoketa", value: 1, coupon: "FORGED" };
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const sent = () => send.mock.calls[0]?.[0] as { eventId: string; user: Record<string, unknown>; custom: Record<string, unknown> };

describe("reportMetaEvent", () => {
  beforeEach(() => {
    send.mockClear();
    customer.mockReset();
    customer.mockResolvedValue(null);
    lookups.length = 0;
    row = null;
    passRow = null;
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

  it("looks the plan order up by the payer's Stripe session; event id, value and coupon come from the row", async () => {
    row = { reference: "AB-7", status: "apmoketa", price: 675, discount_code: "WAKEBLACKFRIDAY2026", paid_at: hoursAgo(1), rider_id: "r-1", riders: { email: "a@b.lt", phone: "+37061234567", name: "Jonas", surname: "Jonaitis" } };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    expect(lookups).toEqual([{ table: "rider_plan_orders", column: "stripe_session_id", value: SESSION }]);
    expect(sent()).toMatchObject({ eventId: "purchase-AB-7", custom: { value: 675, coupon: "WAKEBLACKFRIDAY2026" } });
  });

  it("falls back to a plan pass bought without registering, found by the same Stripe session", async () => {
    passRow = { reference: "PS-7", status: "apmoketa", price: 675, discount_code: "WAKEBLACKFRIDAY2026", paid_at: hoursAgo(1), buyer_email: "a@b.lt", buyer_name: "Jonas Jonaitis" };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    expect(lookups).toEqual([
      { table: "rider_plan_orders", column: "stripe_session_id", value: SESSION },
      { table: "plan_passes", column: "stripe_session_id", value: SESSION },
    ]);
    expect(sent()).toMatchObject({ eventId: "purchase-PS-7", custom: { value: 675, coupon: "WAKEBLACKFRIDAY2026" }, user: { email: "a@b.lt", firstName: "Jonas", lastName: "Jonaitis" } });
  });

  it("still reports a pass once staff attached it, but not an unpaid, cancelled or old one", async () => {
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    passRow = { reference: "PS-7", status: "priskirtas", price: 675, discount_code: null, paid_at: hoursAgo(1), buyer_email: "a@b.lt", buyer_name: "Jonas Jonaitis" };
    await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    expect(send).toHaveBeenCalledTimes(1);
    send.mockClear();
    for (const r of [
      { reference: "PS-7", status: "laukia_apmokejimo", price: 675, paid_at: null },
      { reference: "PS-7", status: "atsauktas", price: 675, paid_at: hoursAgo(1) },
      { reference: "PS-7", status: "apmoketa", price: 675, paid_at: hoursAgo(49) },
      // A full refund leaves an attached pass `priskirtas`, so the refund marker is what stops the event.
      { reference: "PS-7", status: "priskirtas", price: 675, paid_at: hoursAgo(1), refunded_at: hoursAgo(0.5) },
    ]) {
      passRow = { discount_code: null, buyer_email: "a@b.lt", buyer_name: "Jonas Jonaitis", refunded_at: null, ...r };
      await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a paid coupon at face value, found by the Stripe session", async () => {
    row = { reference: "KP-1015", status: "aktyvus", face_value: 50, refunded_amount: 0, discount_code: null, paid_at: hoursAgo(1), buyer_email: "a@b.lt", buyer_phone: null, buyer_name: "Ona Onaitė", rider_id: null };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "coupon", proof: SESSION } });
    expect(lookups).toEqual([{ table: "coupons", column: "stripe_session_id", value: SESSION }]);
    expect(sent()).toMatchObject({ eventId: "purchase-KP-1015", custom: { value: 50 }, user: { email: "a@b.lt", firstName: "Ona", lastName: "Onaitė" } });
    expect(sent().custom.coupon).toBeUndefined();
  });

  it("refuses a guessable reference instead of a session id", async () => {
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "coupon", proof: "KP-1015-guess" } });
    expect(lookups).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it("does not report an unpaid, refunded, cancelled or older-than-48-hours order", async () => {
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    for (const r of [
      { reference: "AB-7", status: "laukia_apmokejimo", price: 675, paid_at: null, riders: null },
      { reference: "AB-7", status: "atsauktas", price: 675, paid_at: hoursAgo(1), riders: null },
      { reference: "AB-7", status: "apmoketa", price: 675, paid_at: hoursAgo(49), riders: null },
    ]) {
      row = r;
      await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    }
    row = { reference: "KP-1015", status: "aktyvus", face_value: 50, refunded_amount: 50, paid_at: hoursAgo(1) };
    await reportMetaEvent({ ...base, purchase: { kind: "coupon", proof: SESSION } });
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts a reservation only by its random payment id, and only the payer's identity", async () => {
    const id = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
    customer.mockResolvedValue({ id: "someone-else", email: "other@b.lt", phone: null, name: "Kitas Žmogus" });
    row = { id, status: "apmoketa", amount: 160, paid_at: hoursAgo(2), customer_email: "payer@b.lt", customer_phone: null };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "reservation", proof: "PM-1083-guess" } });
    expect(send).not.toHaveBeenCalled();
    await reportMetaEvent({ ...base, purchase: { kind: "reservation", proof: id } });
    expect(lookups).toEqual([{ table: "payments", column: "id", value: id }]);
    expect(sent()).toMatchObject({ eventId: `purchase-${id}`, custom: { value: 160 }, user: { email: "payer@b.lt" } });
    expect(sent().user.externalId).toBeUndefined();
    expect(sent().user.firstName).toBeUndefined();
  });

  it("does not report a refunded reservation payment", async () => {
    const id = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
    row = { id, status: "grazinta", amount: 160, paid_at: hoursAgo(2), customer_email: "payer@b.lt", customer_phone: null };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "reservation", proof: id } });
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

    it("ignores a typed contact on a Purchase: only the paid order's contact is used", async () => {
      passRow = { reference: "PS-7", status: "apmoketa", price: 675, discount_code: null, paid_at: hoursAgo(1), refunded_at: null, buyer_email: "payer@b.lt", buyer_name: "Ona Onaitė" };
      const { reportMetaEvent } = await import("@/app/actions/meta-capi");
      await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION }, contact: typed });
      expect(sent().user).toMatchObject({ email: "payer@b.lt", firstName: "Ona" });
      expect(sent().user.phone).toBeUndefined();
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
