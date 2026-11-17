import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const rpc = vi.fn();
const emailPassPaidCustomer = vi.fn();
const emailStaffPassPaid = vi.fn();
const emailStaffPassCancelled = vi.fn();
const recordStaffNotification = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/email/notify", () => ({
  emailPassPaidCustomer: (o: unknown) => emailPassPaidCustomer(o),
  emailStaffPassPaid: (o: unknown) => emailStaffPassPaid(o),
  emailStaffPassCancelled: (...a: unknown[]) => emailStaffPassCancelled(...a),
  emailPlanPaidCustomer: vi.fn(),
  emailStaffPlanPaid: vi.fn(),
  emailStaffPlanCancelled: vi.fn(),
}));
vi.mock("@/lib/staff-notifications", () => ({ recordStaffNotification: (o: unknown) => recordStaffNotification(o) }));

const { onPlanPassPaid, onPlanOrderRefund, planPassIdOf } = await import("@/lib/plan-payment");

const session = { id: "cs_test_1", amount_total: 67500, payment_intent: "pi_1", metadata: { plan_pass_id: "11111111-1111-4111-8111-111111111111" } } as unknown as Stripe.Checkout.Session;

const row = (over: Record<string, unknown> = {}) => ({
  newly_paid: true, amount_ok: true, order_status: "apmoketa", reference: "PS-1", pass_code: "XZ8DNQKA6FUL",
  buyer_name: "Jonas", buyer_email: "jonas@example.com", plan_name: "WAKE sezono abonementas", price: 675, gift: true, recipient_name: "Petras", ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  emailPassPaidCustomer.mockResolvedValue(true);
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
    expect(rpc).toHaveBeenCalledWith("complete_plan_pass_payment", { p_pass_id: "p1", p_session_id: "cs_test_1", p_payment_intent: "pi_1", p_amount: 675 });
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
    expect(emailStaffPassCancelled).toHaveBeenCalledWith("PS-1", false);
  });

  it("a refund of an already attached pass tells staff to change the rider's plan by hand", async () => {
    rpc.mockImplementation(async (name: string) => (name === "refund_plan_pass_payment" ? { data: [{ reference: "PS-1", was_attached: true }], error: null } : { data: null, error: null }));
    await onPlanOrderRefund({ payment_intent: "pi_1", amount_refunded: 67500 } as unknown as Stripe.Charge);
    expect(emailStaffPassCancelled).toHaveBeenCalledWith("PS-1", true);
  });

  it("sends nothing for a refund that is not a pass", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await onPlanOrderRefund({ payment_intent: "pi_other", amount_refunded: 1000 } as unknown as Stripe.Charge);
    expect(emailStaffPassCancelled).not.toHaveBeenCalled();
});
});
