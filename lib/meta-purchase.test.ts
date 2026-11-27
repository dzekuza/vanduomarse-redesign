import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const send = vi.fn<(event: unknown) => Promise<void>>(() => Promise.resolve());
let configured = true;
vi.mock("@/lib/meta-capi", () => ({ capiConfigured: () => configured, sendCapiEvent: (event: unknown) => send(event) }));

/** One table row per lookup; the test sets what the database "has" and checks which key was used. */
const tables: Record<string, Record<string, unknown> | null> = {};
const lookups: { table: string; column: string; value: string }[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: string) => {
          lookups.push({ table, column, value });
          return { maybeSingle: async () => ({ data: tables[table] ?? null }) };
        },
      }),
    }),
  }),
}));

const { reportPurchaseFromWebhook } = await import("@/lib/meta-purchase");

const SESSION = "cs_test_a1b2c3d4e5f6g7";
const FBP = "fb.1.1700000000000.1234567890";
const FBC = "fb.1.1700000000000.AbCdEfGh_ij-kl";
const consented = { metadata: { mk: "1", mk_fbp: FBP, mk_fbc: FBC, mk_ip: "203.0.113.9", mk_ua: "Mozilla/5.0 test" } };
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const sent = () => send.mock.calls[0]?.[0] as { name: string; eventId: string; sourceUrl: string; user: Record<string, unknown>; custom: Record<string, unknown> };

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue(undefined);
  configured = true;
  lookups.length = 0;
  for (const k of Object.keys(tables)) delete tables[k];
});

describe("reportPurchaseFromWebhook", () => {
  it("sends the sale with the buyer's own contact and the browser details recorded at checkout", async () => {
    tables.rider_plan_orders = { reference: "AB-7", status: "apmoketa", price: 675, discount_code: "WAKEBLACKFRIDAY2026", paid_at: hoursAgo(0.01), rider_id: "r-1", riders: { email: "a@b.lt", phone: "+37061234567", name: "Jonas", surname: "Jonaitis" } };
    await reportPurchaseFromWebhook("plan", SESSION, consented);
    expect(lookups).toEqual([{ table: "rider_plan_orders", column: "stripe_session_id", value: SESSION }]);
    expect(sent()).toMatchObject({
      name: "Purchase",
      eventId: "purchase-AB-7",
      user: { ip: "203.0.113.9", userAgent: "Mozilla/5.0 test", fbp: FBP, fbc: FBC, email: "a@b.lt", phone: "+37061234567", firstName: "Jonas", lastName: "Jonaitis", externalId: "r-1" },
      custom: { value: 675, currency: "EUR", content_category: "plan", coupon: "WAKEBLACKFRIDAY2026" },
    });
    expect(sent().sourceUrl).toMatch(/\/registracija\/apmoketa$/);
  });

  it("sends nothing without the marketing consent recorded when the order was started", async () => {
    tables.rider_plan_orders = { reference: "AB-7", status: "apmoketa", price: 675, paid_at: hoursAgo(0.01), riders: null };
    await reportPurchaseFromWebhook("plan", SESSION, { metadata: {} });
    await reportPurchaseFromWebhook("plan", SESSION, { metadata: null });
    await reportPurchaseFromWebhook("plan", SESSION, { metadata: { mk: "0" } });
    expect(lookups).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it("sends nothing when the Conversions API is not configured", async () => {
    configured = false;
    await reportPurchaseFromWebhook("plan", SESSION, consented);
    expect(send).not.toHaveBeenCalled();
  });

  it("falls back to a plan pass bought without registering, and names the buyer from the pass", async () => {
    tables.plan_passes = { reference: "PS-7", status: "apmoketa", price: 675, discount_code: null, paid_at: hoursAgo(0.01), refunded_at: null, buyer_email: "a@b.lt", buyer_name: "Jonas Jonaitis" };
    await reportPurchaseFromWebhook("plan", SESSION, consented);
    expect(lookups.map((l) => l.table)).toEqual(["rider_plan_orders", "plan_passes"]);
    expect(sent()).toMatchObject({ eventId: "purchase-PS-7", user: { email: "a@b.lt", firstName: "Jonas", lastName: "Jonaitis", fbp: FBP } });
    expect(sent().user.externalId).toBeUndefined();
  });

  it("reports a pass paid in parts from its deposit on, worth the deposit (ADR-0139)", async () => {
    tables.plan_passes = { reference: "PS-8", status: "dalinai_apmoketa", price: 600, payment_plan: "dalimis", deposit_amount: 300, discount_code: null, paid_at: hoursAgo(0.01), refunded_at: null, buyer_email: "a@b.lt", buyer_name: "Jonas Jonaitis" };
    await reportPurchaseFromWebhook("plan", SESSION, consented);
    expect(sent()).toMatchObject({ eventId: "purchase-PS-8", custom: { value: 300 } });
  });

  it("reports a paid coupon at face value, found by the Stripe session", async () => {
    tables.coupons = { reference: "KP-1015", status: "aktyvus", face_value: 50, refunded_amount: 0, discount_code: null, paid_at: hoursAgo(0.01), buyer_email: "a@b.lt", buyer_phone: null, buyer_name: "Ona Onaitė", rider_id: null };
    await reportPurchaseFromWebhook("coupon", SESSION, consented);
    expect(lookups).toEqual([{ table: "coupons", column: "stripe_session_id", value: SESSION }]);
    expect(sent()).toMatchObject({ eventId: "purchase-KP-1015", custom: { value: 50, content_category: "coupon" }, user: { email: "a@b.lt", firstName: "Ona", lastName: "Onaitė" } });
    expect(sent().custom.coupon).toBeUndefined();
    expect(sent().sourceUrl).toMatch(/\/kuponai\/apmoketa$/);
  });

  it("finds a reservation only by its random payment id, never by a session id", async () => {
    const id = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";
    tables.payments = { id, status: "apmoketa", amount: 160, paid_at: hoursAgo(0.01), customer_email: "payer@b.lt", customer_phone: "+37061234567" };
    await reportPurchaseFromWebhook("reservation", SESSION, consented);
    expect(send).not.toHaveBeenCalled();
    await reportPurchaseFromWebhook("reservation", id, consented);
    expect(sent()).toMatchObject({ eventId: `purchase-${id}`, custom: { value: 160, content_category: "reservation" }, user: { email: "payer@b.lt", phone: "+37061234567" } });
    expect(sent().sourceUrl).toMatch(/\/rezervacija\/mokejimas$/);
  });

  it("does not report an unpaid, refunded, cancelled or old order, or a refunded attached pass", async () => {
    for (const r of [
      { reference: "AB-7", status: "laukia_apmokejimo", price: 675, paid_at: null, riders: null },
      { reference: "AB-7", status: "atsauktas", price: 675, paid_at: hoursAgo(0.01), riders: null },
      { reference: "AB-7", status: "apmoketa", price: 675, paid_at: hoursAgo(49), riders: null },
    ]) {
      tables.rider_plan_orders = r;
      await reportPurchaseFromWebhook("plan", SESSION, consented);
    }
    delete tables.rider_plan_orders;
    tables.plan_passes = { reference: "PS-7", status: "priskirtas", price: 675, paid_at: hoursAgo(1), refunded_at: hoursAgo(0.5), buyer_email: "a@b.lt", buyer_name: "Jonas Jonaitis" };
    await reportPurchaseFromWebhook("plan", SESSION, consented);
    tables.coupons = { reference: "KP-1", status: "aktyvus", face_value: 50, refunded_amount: 50, paid_at: hoursAgo(0.01) };
    await reportPurchaseFromWebhook("coupon", SESSION, consented);
    expect(send).not.toHaveBeenCalled();
  });

  it("never throws: a failing Meta call or lookup must not fail the Stripe webhook", async () => {
    tables.rider_plan_orders = { reference: "AB-7", status: "apmoketa", price: 675, paid_at: hoursAgo(0.01), riders: null };
    send.mockRejectedValue(new Error("Meta is down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(reportPurchaseFromWebhook("plan", SESSION, consented)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
