import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Map([["user-agent", "UA"], ["x-forwarded-for", "1.2.3.4"]]),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/lib/customer", () => ({ getCustomer: async () => null }));

const send = vi.fn<(event: unknown) => Promise<void>>(() => Promise.resolve());
vi.mock("@/lib/meta-capi", () => ({
  CAPI_EVENTS: ["ViewContent", "Lead", "InitiateCheckout", "CompleteRegistration", "Purchase"],
  capiConfigured: () => true,
  sendCapiEvent: (event: unknown) => send(event),
}));

/** One table row per lookup; the test sets what the database "has". */
let row: Record<string, unknown> | null = null;
const lookups: { table: string; column: string; value: string }[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: string) => {
          lookups.push({ table, column, value });
          return { maybeSingle: async () => ({ data: row }) };
        },
      }),
    }),
  }),
}));

const SESSION = "cs_test_a1b2c3d4e5f6g7";
const base = { name: "Purchase" as const, eventId: "forged-event-id", sourceUrl: "https://www.vanduomarse.lt/registracija/apmoketa", value: 1 };
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

describe("reportMetaEvent purchases", () => {
  beforeEach(() => {
    send.mockClear();
    lookups.length = 0;
    row = null;
  });
  afterEach(() => vi.restoreAllMocks());

  it("looks the plan order up by the payer's Stripe session, builds the event id itself and uses the paid amount", async () => {
    row = { reference: "AB-7", price: 675, paid_at: hoursAgo(1), rider_id: "r-1", riders: { email: "a@b.lt", phone: "+37061234567", name: "Jonas", surname: "Jonaitis" } };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    expect(lookups).toEqual([{ table: "rider_plan_orders", column: "stripe_session_id", value: SESSION }]);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ eventId: "purchase-AB-7", custom: expect.objectContaining({ value: 675 }) }));
  });

  it("refuses a guessable reference instead of a session id", async () => {
    row = { reference: "KP-1015", paid_amount: 25, paid_at: hoursAgo(1) };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "coupon", proof: "KP-1015-guess" } });
    expect(lookups).toEqual([]);
    expect(send).not.toHaveBeenCalled();
  });

  it("does not report an unpaid order or one paid more than 48 hours ago", async () => {
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    row = { reference: "AB-7", price: 675, paid_at: null, riders: null };
    await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    row = { reference: "AB-7", price: 675, paid_at: hoursAgo(49), riders: null };
    await reportMetaEvent({ ...base, purchase: { kind: "plan", proof: SESSION } });
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts a reservation only by its random payment id", async () => {
    const id = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
    row = { id, amount: 160, paid_at: hoursAgo(2), customer_email: "a@b.lt", customer_phone: null };
    const { reportMetaEvent } = await import("@/app/actions/meta-capi");
    await reportMetaEvent({ ...base, purchase: { kind: "reservation", proof: "PM-1083-guess" } });
    expect(send).not.toHaveBeenCalled();
    await reportMetaEvent({ ...base, purchase: { kind: "reservation", proof: id } });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ eventId: `purchase-${id}`, custom: expect.objectContaining({ value: 160 }) }));
  });
});
