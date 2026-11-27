import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const rpc = vi.fn();
const emailPassPaidCustomer = vi.fn();
const emailPassDepositCustomer = vi.fn();
const emailStaffPassPaid = vi.fn();
const emailStaffPassCancelled = vi.fn();
const recordStaffNotification = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/email/notify", () => ({
  emailPassPaidCustomer: (o: unknown) => emailPassPaidCustomer(o),
  emailPassDepositCustomer: (o: unknown) => emailPassDepositCustomer(o),
  emailStaffPassPaid: (o: unknown) => emailStaffPassPaid(o),
  emailStaffPassCancelled: (...a: unknown[]) => emailStaffPassCancelled(...a),
  emailPlanPaidCustomer: vi.fn(),
  emailStaffPlanPaid: vi.fn(),
  emailStaffPlanCancelled: vi.fn(),
}));
vi.mock("@/lib/staff-notifications", () => ({ recordStaffNotification: (o: unknown) => recordStaffNotification(o) }));

const { onPlanPassPaid, onPlanOrderRefund, planPassIdOf, planPassPartOf } = await import("@/lib/plan-payment");

const session = { id: "cs_test_1", amount_total: 67500, payment_intent: "pi_1", metadata: { plan_pass_id: "11111111-1111-4111-8111-111111111111" } } as unknown as Stripe.Checkout.Session;

const row = (over: Record<string, unknown> = {}) => ({
  newly_paid: true, amount_ok: true, order_status: "apmoketa", reference: "PS-1", pass_code: "XZ8DNQKA6FUL",
  buyer_name: "Jonas", buyer_email: "jonas@example.com", plan_name: "WAKE sezono abonementas", price: 675, gift: true, recipient_name: "Petras", ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  emailPassPaidCustomer.mockResolvedValue(true);
  emailPassDepositCustomer.mockResolvedValue(true);
});

describe("plan pass payments", () => {
  it("finds the pass from the session metadata only", () => {
    expect(planPassIdOf(session)).toBe("11111111-1111-4111-8111-111111111111");
    expect(planPassIdOf({ metadata: { plan_pass_id: "nope" } } as unknown as Stripe.Checkout.Session)).toBeUndefined();
    expect(planPassIdOf({ metadata: {} } as unknown as Stripe.Checkout.Session)).toBeUndefined();
  });

  it("emails the buyer the code and tells staff, once the pass is newly paid", async () => {
    rpc.mockResolvedValue({ data: [row()], error: null });
    await onPlanPassPaid("p1", session);
    expect(rpc).toHaveBeenCalledWith("complete_plan_pass_payment", { p_pass_id: "p1", p_session_id: "cs_test_1", p_payment_intent: "pi_1", p_amount: 675, p_balance: false });
    expect(emailPassPaidCustomer).toHaveBeenCalledWith(expect.objectContaining({ buyerEmail: "jonas@example.com", code: "XZ8DNQKA6FUL", gift: true, recipientName: "Petras" }));
    expect(emailStaffPassPaid).toHaveBeenCalledWith(expect.not.objectContaining({ problem: expect.anything() }));
    expect(recordStaffNotification).toHaveBeenCalledWith(expect.objectContaining({ permissions: ["apyrankes"], kind: "mokejimas" }));
  });

  it("sends nothing again when Stripe repeats the event", async () => {
    rpc.mockResolvedValue({ data: [row({ newly_paid: false })], error: null });
    await onPlanPassPaid("p1", session);
    expect(emailPassPaidCustomer).not.toHaveBeenCalled();
    expect(emailStaffPassPaid).not.toHaveBeenCalled();
  });

  it("issues no code and flags staff when the paid amount differs from the price", async () => {
    rpc.mockResolvedValue({ data: [row({ amount_ok: false, newly_paid: false, order_status: "laukia_apmokejimo", pass_code: null })], error: null });
    await onPlanPassPaid("p1", session);
    expect(emailPassPaidCustomer).not.toHaveBeenCalled();
    expect(emailStaffPassPaid).toHaveBeenCalledWith(expect.objectContaining({ problem: expect.stringContaining("Kodas neišduotas") }));
    expect(recordStaffNotification).toHaveBeenCalledWith(expect.objectContaining({ kind: "mokejimas_patikrinti" }));
  });

  it("tells staff when the code e-mail could not be sent", async () => {
    rpc.mockResolvedValue({ data: [row()], error: null });
    emailPassPaidCustomer.mockResolvedValue(false);
    await onPlanPassPaid("p1", session);
    expect(emailStaffPassPaid).toHaveBeenCalledWith(expect.objectContaining({ problem: expect.stringContaining("laiško su kodu") }));
  });

  it("throws when the database fails, so Stripe retries", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("db down") });
    await expect(onPlanPassPaid("p1", session)).rejects.toThrow("db down");
  });

  it("a refund of an unattached pass tells staff it was cancelled", async () => {
    rpc.mockImplementation(async (name: string) => (name === "refund_plan_pass_payment" ? { data: [{ reference: "PS-1", was_attached: false }], error: null } : { data: null, error: null }));
    await onPlanOrderRefund({ payment_intent: "pi_1", amount_refunded: 67500 } as unknown as Stripe.Charge);
    expect(rpc).toHaveBeenCalledWith("refund_plan_pass_payment", { p_payment_intent: "pi_1", p_refunded: 675 });
    expect(emailStaffPassCancelled).toHaveBeenCalledWith("PS-1", false, undefined);
  });

  it("a refund of an already attached pass tells staff to change the rider's plan by hand", async () => {
    rpc.mockImplementation(async (name: string) => (name === "refund_plan_pass_payment" ? { data: [{ reference: "PS-1", was_attached: true }], error: null } : { data: null, error: null }));
    await onPlanOrderRefund({ payment_intent: "pi_1", amount_refunded: 67500 } as unknown as Stripe.Charge);
    expect(emailStaffPassCancelled).toHaveBeenCalledWith("PS-1", true, undefined);
  });

  it("sends nothing for a refund that is not a pass", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await onPlanOrderRefund({ payment_intent: "pi_other", amount_refunded: 1000 } as unknown as Stripe.Charge);
    expect(emailStaffPassCancelled).not.toHaveBeenCalled();
  });
});

describe("plan passes paid in parts (ADR-0139)", () => {
  const split = (over: Record<string, unknown> = {}) =>
    row({ payment_plan: "dalimis", deposit_amount: 300, balance_amount: 300, price: 600, gift: false, recipient_name: "", ...over });
  const deposit = { id: "cs_dep", amount_total: 30000, payment_intent: "pi_dep", metadata: { plan_pass_id: "11111111-1111-4111-8111-111111111111", plan_pass_part: "depozitas" } } as unknown as Stripe.Checkout.Session;
  const balance = { id: "cs_bal", amount_total: 30000, payment_intent: "pi_bal", metadata: { plan_pass_id: "11111111-1111-4111-8111-111111111111", plan_pass_part: "likutis" } } as unknown as Stripe.Checkout.Session;

  it("tells a balance session from a first payment by its metadata", () => {
    expect(planPassPartOf(balance)).toBe("likutis");
    expect(planPassPartOf(deposit)).toBe("pirmas");
    expect(planPassPartOf(session)).toBe("pirmas");
  });

  it("a paid deposit sends the deposit e-mail, issues no code and tells staff the balance is open", async () => {
    rpc.mockResolvedValue({ data: [split({ order_status: "dalinai_apmoketa", pass_code: null })], error: null });
    await onPlanPassPaid("p1", deposit);
    expect(rpc).toHaveBeenCalledWith("complete_plan_pass_payment", expect.objectContaining({ p_amount: 300, p_balance: false, p_payment_intent: "pi_dep" }));
    expect(emailPassDepositCustomer).toHaveBeenCalledWith(expect.objectContaining({ buyerEmail: "jonas@example.com", deposit: 300, balance: 300, amount: 600 }));
    expect(emailPassPaidCustomer).not.toHaveBeenCalled();
    expect(emailStaffPassPaid).toHaveBeenCalledWith(expect.objectContaining({ stage: "depozitas", deposit: 300, balance: 300 }));
    expect(recordStaffNotification).toHaveBeenCalledWith(expect.objectContaining({ kind: "mokejimas", title: expect.stringContaining("dalis") }));
  });

  it("a paid balance goes down the same path as a full payment: the code e-mail and the staff notice", async () => {
    rpc.mockResolvedValue({ data: [split({ order_status: "apmoketa" })], error: null });
    await onPlanPassPaid("p1", balance);
    expect(rpc).toHaveBeenCalledWith("complete_plan_pass_payment", expect.objectContaining({ p_session_id: "cs_bal", p_payment_intent: "pi_bal", p_amount: 300, p_balance: true }));
    expect(emailPassPaidCustomer).toHaveBeenCalledWith(expect.objectContaining({ code: "XZ8DNQKA6FUL", amount: 600 }));
    expect(emailPassDepositCustomer).not.toHaveBeenCalled();
    expect(emailStaffPassPaid).toHaveBeenCalledWith(expect.objectContaining({ stage: "likutis" }));
  });

  it("a balance the pass was not waiting for issues nothing and flags staff", async () => {
    rpc.mockResolvedValue({ data: [split({ amount_ok: false, newly_paid: false, order_status: "atsauktas", pass_code: null })], error: null });
    await onPlanPassPaid("p1", balance);
    expect(emailPassPaidCustomer).not.toHaveBeenCalled();
    expect(emailStaffPassPaid).toHaveBeenCalledWith(expect.objectContaining({ problem: expect.stringContaining("likučio") }));
    expect(recordStaffNotification).toHaveBeenCalledWith(expect.objectContaining({ kind: "mokejimas_patikrinti" }));
  });

  it("a repeated deposit or balance event sends nothing again", async () => {
    rpc.mockResolvedValue({ data: [split({ newly_paid: false, order_status: "dalinai_apmoketa", pass_code: null })], error: null });
    await onPlanPassPaid("p1", deposit);
    rpc.mockResolvedValue({ data: [split({ newly_paid: false })], error: null });
    await onPlanPassPaid("p1", balance);
    expect(emailPassDepositCustomer).not.toHaveBeenCalled();
    expect(emailPassPaidCustomer).not.toHaveBeenCalled();
    expect(emailStaffPassPaid).not.toHaveBeenCalled();
  });

  it("passes what a refund of either half did on to the staff e-mail", async () => {
    rpc.mockImplementation(async (name: string) =>
      name === "refund_plan_pass_payment" ? { data: [{ reference: "PS-1", was_attached: false, part: "likutis", outcome: "dalinai_apmoketa" }], error: null } : { data: null, error: null },
    );
    await onPlanOrderRefund({ payment_intent: "pi_bal", amount_refunded: 30000 } as unknown as Stripe.Charge);
    expect(rpc).toHaveBeenCalledWith("refund_plan_pass_payment", { p_payment_intent: "pi_bal", p_refunded: 300 });
    expect(emailStaffPassCancelled).toHaveBeenCalledWith("PS-1", false, { part: "likutis", outcome: "dalinai_apmoketa" });
  });
});
