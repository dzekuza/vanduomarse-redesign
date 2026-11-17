import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let enabled = true;
const sessionsCreate = vi.fn();
const sessionsExpire = vi.fn(() => Promise.resolve());
vi.mock("@/lib/stripe", () => ({
  MissingStripeKeyError: class extends Error {},
  paymentsEnabled: () => enabled,
  getStripe: () => ({
    checkout: { sessions: { create: sessionsCreate, expire: sessionsExpire } },
  }),
  siteOrigin: async () => "https://example.test",
  toCents: (n: number) => Math.round(n * 100),
}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));

const emailPaymentRequest = vi.fn<(...args: unknown[]) => Promise<boolean>>();
vi.mock("@/lib/email/notify", () => ({
  emailPaymentRequest: (...args: unknown[]) => emailPaymentRequest(...args),
}));

import { requestStaffPayment, staffPaymentProblem } from "@/lib/staff-payment";

const payment = {
  payment_id: "11111111-1111-4111-8111-111111111111",
  amount: 140,
  items: [{ reference: "PIR-1", label: "Pirtis", amount: 140 }],
};

beforeEach(() => {
  enabled = true;
  vi.clearAllMocks();
  rpc.mockImplementation(async (name: string) =>
    name === "start_staff_payment"
      ? { data: [payment], error: null }
      : { data: null, error: null },
  );
  sessionsCreate.mockResolvedValue({
    id: "cs_1",
    url: "https://pay.test/cs_1",
    expires_at: 1_900_000_000,
  });
  emailPaymentRequest.mockResolvedValue(true);
});

describe("staffPaymentProblem", () => {
  it("accepts an e-mail, a total above the Stripe minimum and enabled payments", () => {
    expect(staffPaymentProblem("a@b.lt", 140)).toBeNull();
  });

  it("needs an e-mail for the link", () => {
    expect(staffPaymentProblem("  ", 140)?.code).toBe("email_required");
  });

  it("refuses a total below the Stripe minimum", () => {
    expect(staffPaymentProblem("a@b.lt", 0.2)?.code).toBe("payment");
  });

  it("refuses when online payment is off", () => {
    enabled = false;
    expect(staffPaymentProblem("a@b.lt", 140)?.code).toBe("setup");
  });
});

describe("requestStaffPayment", () => {
  const request = {
    reference: "PIR-1",
    email: "a@b.lt",
    summary: "Pirtis 2026-11-20 18:00-20:00",
  };

  it("opens a day-long Checkout Session, attaches it and e-mails the link", async () => {
    const outcome = await requestStaffPayment(request);

    expect(outcome).toEqual({
      ok: true,
      paymentId: payment.payment_id,
      amount: 140,
      emailSent: true,
      url: "https://pay.test/cs_1",
    });
    const params = sessionsCreate.mock.calls[0][0] as {
      line_items: { price_data: { unit_amount: number } }[];
      metadata: unknown;
      customer_email: string;
      expires_at: number;
    };
    expect(params.line_items[0].price_data.unit_amount).toBe(14000);
    expect(params.metadata).toEqual({ payment_id: payment.payment_id });
    expect(params.customer_email).toBe("a@b.lt");
    const lifetime = params.expires_at - Math.floor(Date.now() / 1000);
    expect(lifetime).toBeGreaterThan(23 * 3600);
    expect(lifetime).toBeLessThanOrEqual(24 * 3600);
    expect(rpc).toHaveBeenCalledWith(
      "attach_payment_session",
      expect.objectContaining({
        p_payment_id: payment.payment_id,
        p_session_id: "cs_1",
      }),
    );
    expect(emailPaymentRequest).toHaveBeenCalledWith(
      "a@b.lt",
      "PIR-1",
      request.summary,
      140,
      "https://pay.test/cs_1",
    );
  });

  it("still succeeds when the e-mail could not be sent, so the staff can pass the link on", async () => {
    emailPaymentRequest.mockResolvedValue(false);
    const outcome = await requestStaffPayment(request);
    expect(outcome).toMatchObject({
      ok: true,
      emailSent: false,
      url: "https://pay.test/cs_1",
    });
  });

  it("abandons the payment when Stripe refuses", async () => {
    sessionsCreate.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const outcome = await requestStaffPayment(request);
    expect(outcome).toMatchObject({ ok: false, code: "payment" });
    expect(rpc).toHaveBeenCalledWith("abandon_payment", {
      p_payment_id: payment.payment_id,
    });
    expect(emailPaymentRequest).not.toHaveBeenCalled();
  });

  it("fails cleanly when no payment could be started", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "nope" } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const outcome = await requestStaffPayment(request);
    expect(outcome).toMatchObject({ ok: false });
    expect(sessionsCreate).not.toHaveBeenCalled();
  });
});
