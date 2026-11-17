import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
const alertStaffPaidOrder = vi.fn();
const recordStaffNotification = vi.fn<(o: unknown) => Promise<boolean>>(async () => true);

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/staff-order-alert", () => ({ alertStaffPaidOrder: (o: unknown) => alertStaffPaidOrder(o) }));
vi.mock("@/lib/staff-notifications", () => ({ recordStaffNotification: (o: unknown) => recordStaffNotification(o) }));
vi.mock("@/lib/email/notify", () => ({
  emailPassPaidCustomer: vi.fn(), emailStaffPassPaid: vi.fn(), emailStaffPassCancelled: vi.fn(),
  emailPlanPaidCustomer: vi.fn(async () => true), emailStaffPlanPaid: vi.fn(async () => true), emailStaffPlanCancelled: vi.fn(),
  emailStaffCouponPaid: vi.fn(async () => true), emailStaffCouponCancelled: vi.fn(),
}));
vi.mock("@/lib/email/send-coupon", () => ({ sendCouponEmails: vi.fn(async () => true) }));
vi.mock("@/lib/coupon-voucher", () => ({ voucherUrl: async () => "https://example.test/voucher" }));

const { onPlanOrderPaid } = await import("@/lib/plan-payment");
const { onCouponPaid } = await import("@/lib/coupon-payment");

const session = (cents: number) => ({ id: "cs_test_1", amount_total: cents, payment_intent: "pi_1", metadata: {} }) as unknown as Stripe.Checkout.Session;

const planRow = (over: Record<string, unknown> = {}) => ({ newly_paid: true, amount_ok: true, order_status: "apmoketa", reference: "AB-7", rider_id: "r1", rider_name: "Jonas Jonaitis", rider_email: "a@b.lt", plan_name: "WAKE sezono abonementas", price: 675, ...over });
const couponRow = (over: Record<string, unknown> = {}) => ({
  newly_paid: true, amount_ok: true, reference: "KP-1016", code: "ABCDEFGHJKLM", product_name: "Dovanų kuponas 25 €", face_value: 25, service: "visi", expires_at: null,
  buyer_name: "Jonas", buyer_email: "a@b.lt", recipient_name: "", recipient_email: "", message: "", ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("phones are alerted when a plan order is paid", () => {
  it("once, with a reference and the price", async () => {
    rpc.mockResolvedValue({ data: [planRow()], error: null });
    await onPlanOrderPaid("o1", session(67500));
    expect(alertStaffPaidOrder).toHaveBeenCalledTimes(1);
    expect(alertStaffPaidOrder).toHaveBeenCalledWith({ kind: "planas", reference: "AB-7", amount: 675, review: false });
  });

  it("flags a payment whose amount did not match, and says nothing again for a repeated event", async () => {
    rpc.mockResolvedValue({ data: [planRow({ amount_ok: false, newly_paid: false })], error: null });
    await onPlanOrderPaid("o1", session(10000));
    expect(alertStaffPaidOrder).toHaveBeenCalledWith({ kind: "planas", reference: "AB-7", amount: 100, review: true });
    alertStaffPaidOrder.mockClear();
    rpc.mockResolvedValue({ data: [planRow({ newly_paid: false })], error: null });
    await onPlanOrderPaid("o1", session(67500));
    expect(alertStaffPaidOrder).not.toHaveBeenCalled();
  });
});

describe("phones are alerted when a coupon is paid", () => {
  it("once, with a reference and the paid amount", async () => {
    rpc.mockResolvedValue({ data: [couponRow()], error: null });
    await onCouponPaid("c1", session(2500));
    expect(alertStaffPaidOrder).toHaveBeenCalledTimes(1);
    expect(alertStaffPaidOrder).toHaveBeenCalledWith({ kind: "kuponas", reference: "KP-1016", amount: 25, review: false });
  });

  it("flags a mismatch, and says nothing again for a repeated event", async () => {
    rpc.mockResolvedValue({ data: [couponRow({ amount_ok: false, newly_paid: false })], error: null });
    await onCouponPaid("c1", session(1000));
    expect(alertStaffPaidOrder).toHaveBeenCalledWith({ kind: "kuponas", reference: "KP-1016", amount: 10, review: true });
    alertStaffPaidOrder.mockClear();
    rpc.mockResolvedValue({ data: [couponRow({ newly_paid: false })], error: null });
    await onCouponPaid("c1", session(2500));
    expect(alertStaffPaidOrder).not.toHaveBeenCalled();
  });
});
