import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let enabled = true;
const sessionsCreate = vi.fn();
const sessionsExpire = vi.fn(() => Promise.resolve());
const sessionsRetrieve = vi.fn();
const closeCheckoutSession = vi.fn<(id: string) => Promise<"expired" | "paid">>();
vi.mock("@/lib/payment-release", () => ({ closeCheckoutSession: (id: string) => closeCheckoutSession(id) }));
vi.mock("@/lib/stripe", () => ({
  MissingStripeKeyError: class extends Error {},
  paymentsEnabled: () => enabled,
  getStripe: () => ({
    checkout: { sessions: { create: sessionsCreate, expire: sessionsExpire, retrieve: sessionsRetrieve } },
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

import { openStaffPayment, requestStaffPayment, retireStaffPayment, staffPaymentProblem } from "@/lib/staff-payment";

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
      smsSent: false,
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

  it("expires the new session and abandons the payment when attaching it fails", async () => {
    rpc.mockImplementation(async (name: string) => {
      if (name === "start_staff_payment") return { data: [payment], error: null };
      if (name === "attach_payment_session") return { data: null, error: { message: "boom" } };
      return { data: null, error: null };
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const outcome = await requestStaffPayment(request);
    expect(outcome).toMatchObject({ ok: false });
    expect(sessionsExpire).toHaveBeenCalledWith("cs_1");
    expect(rpc).toHaveBeenCalledWith("abandon_payment", { p_payment_id: payment.payment_id });
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

describe("openStaffPayment (send again / copy)", () => {
  const withSession = (session: string | null) =>
    rpc.mockImplementation(async (name: string) => (name === "start_staff_payment" ? { data: [{ ...payment, stripe_session_id: session }], error: null } : { data: null, error: null }));

  it("reuses the payment's open Checkout Session", async () => {
    withSession("cs_old");
    sessionsRetrieve.mockResolvedValue({ status: "open", url: "https://pay.test/cs_old" });
    expect(await openStaffPayment("PIR-1", "a@b.lt")).toEqual({ ok: true, paymentId: payment.payment_id, amount: 140, url: "https://pay.test/cs_old" });
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("replaces an expired session, handing the old id to attach, and keeps the payment on failure", async () => {
    withSession("cs_old");
    sessionsRetrieve.mockResolvedValue({ status: "expired", url: null });
    expect(await openStaffPayment("PIR-1", "a@b.lt")).toMatchObject({ ok: true, url: "https://pay.test/cs_1" });
    expect(rpc).toHaveBeenCalledWith("attach_payment_session", expect.objectContaining({ p_expected_session_id: "cs_old" }));

    sessionsCreate.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await openStaffPayment("PIR-1", "a@b.lt")).toMatchObject({ ok: false });
    expect(rpc).not.toHaveBeenCalledWith("abandon_payment", expect.anything());
  });

  it("refuses when the customer already paid", async () => {
    withSession("cs_old");
    sessionsRetrieve.mockResolvedValue({ status: "complete", url: null });
    expect(await openStaffPayment("PIR-1", "a@b.lt")).toMatchObject({ ok: false, code: "settled" });
  });

  it("works without an e-mail address (copy only)", async () => {
    await openStaffPayment("PIR-1", "");
    expect((sessionsCreate.mock.calls[0][0] as { customer_email?: string }).customer_email).toBeUndefined();
  });
});

describe("retireStaffPayment (mark paid at entry)", () => {
  const state = (status: string, session: string | null) =>
    rpc.mockImplementation(async (name: string) => (name === "payment_state" ? { data: [{ status, stripe_session_id: session }], error: null } : { data: null, error: null }));

  it("expires the session, then voids the payment", async () => {
    state("laukia", "cs_1");
    closeCheckoutSession.mockResolvedValue("expired");
    expect(await retireStaffPayment(payment.payment_id)).toEqual({ ok: true });
    expect(closeCheckoutSession).toHaveBeenCalledWith("cs_1");
    expect(rpc).toHaveBeenCalledWith("void_staff_payment", { p_payment_id: payment.payment_id });
  });

  it("refuses a payment the customer already paid", async () => {
    state("apmoketa", "cs_1");
    expect(await retireStaffPayment(payment.payment_id)).toMatchObject({ ok: false });
    state("laukia", "cs_1");
    closeCheckoutSession.mockResolvedValue("paid");
    expect(await retireStaffPayment(payment.payment_id)).toMatchObject({ ok: false });
    expect(rpc).not.toHaveBeenCalledWith("void_staff_payment", expect.anything());
  });

  it("does not void when Stripe cannot confirm the session is closed", async () => {
    state("laukia", "cs_1");
    closeCheckoutSession.mockRejectedValue(new Error("still open"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await retireStaffPayment(payment.payment_id)).toMatchObject({ ok: false });
    expect(rpc).not.toHaveBeenCalledWith("void_staff_payment", expect.anything());
  });
});
