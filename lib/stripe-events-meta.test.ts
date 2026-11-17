import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

vi.mock("server-only", () => ({}));

const calls: string[] = [];
const onCouponPaid = vi.fn(async () => void calls.push("coupon-handler"));
const onPlanOrderPaid = vi.fn(async () => void calls.push("plan-order-handler"));
const onPlanPassPaid = vi.fn(async () => void calls.push("plan-pass-handler"));
const report = vi.fn(async (...args: unknown[]) => void calls.push(`report:${String(args[0])}:${String(args[1])}`));
const rpc = vi.fn();
const notifyPaymentReceived = vi.fn(async () => undefined);
const notifyDuplicatePayment = vi.fn(async () => undefined);

vi.mock("@/lib/coupon-payment", () => ({ couponIdOf: (s: { metadata?: Record<string, string> }) => s.metadata?.coupon_id, onCouponPaid: (...a: unknown[]) => onCouponPaid(...(a as [])), onCouponRefund: vi.fn(), onCouponSessionClosed: vi.fn() }));
vi.mock("@/lib/plan-payment", () => ({
  planOrderIdOf: (s: { metadata?: Record<string, string> }) => s.metadata?.plan_order_id,
  planPassIdOf: (s: { metadata?: Record<string, string> }) => s.metadata?.plan_pass_id,
  onPlanOrderPaid: (...a: unknown[]) => onPlanOrderPaid(...(a as [])),
  onPlanPassPaid: (...a: unknown[]) => onPlanPassPaid(...(a as [])),
  onPlanOrderRefund: vi.fn(),
  onPlanSessionClosed: vi.fn(),
}));
vi.mock("@/lib/meta-purchase", () => ({ reportPurchaseFromWebhook: (...a: unknown[]) => report(...a) }));
vi.mock("@/lib/notify", () => ({ notifyPaymentReceived: (...a: unknown[]) => notifyPaymentReceived(...(a as [])), notifyDuplicatePayment: (...a: unknown[]) => notifyDuplicatePayment(...(a as [])) }));
vi.mock("@/lib/payment-notice", () => ({ loadPaidRequests: async () => [] }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));

const { handleStripeEvent } = await import("@/lib/stripe-events");

const event = (metadata: Record<string, string>, over: Record<string, unknown> = {}) =>
  ({ type: "checkout.session.completed", data: { object: { id: "cs_test_a1b2c3d4e5f6", payment_status: "paid", amount_total: 16000, payment_intent: "pi_1", metadata, ...over } } }) as unknown as Stripe.Event;

const PAYMENT = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const paid = (over: Record<string, unknown> = {}) => ({ data: [{ payment_id: PAYMENT, newly_paid: true, duplicate: false, needs_review: false, refs: ["PIR-1"], amount: 160, phone: null, confirmed: true, ...over }], error: null });

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
});

describe("Stripe webhook reports sales to Meta (ADR-0111)", () => {
  it("reports a paid coupon, plan order and plan pass by their Checkout session, after the order is recorded", async () => {
    await handleStripeEvent(event({ coupon_id: "11111111-1111-4111-8111-111111111111" }));
    await handleStripeEvent(event({ plan_order_id: "22222222-2222-4222-8222-222222222222" }));
    await handleStripeEvent(event({ plan_pass_id: "33333333-3333-4333-8333-333333333333" }));
    expect(calls).toEqual([
      "coupon-handler", "report:coupon:cs_test_a1b2c3d4e5f6",
      "plan-order-handler", "report:plan:cs_test_a1b2c3d4e5f6",
      "plan-pass-handler", "report:plan:cs_test_a1b2c3d4e5f6",
    ]);
  });

  it("does not report when recording the order failed: Stripe retries the event instead", async () => {
    onPlanPassPaid.mockRejectedValueOnce(new Error("db down"));
    await expect(handleStripeEvent(event({ plan_pass_id: "33333333-3333-4333-8333-333333333333" }))).rejects.toThrow("db down");
    expect(report).not.toHaveBeenCalled();
  });

  it("reports a newly paid reservation by its payment id", async () => {
    rpc.mockImplementation(async (name: string) => (name === "complete_payment" ? paid() : { data: "a@b.lt", error: null }));
    await handleStripeEvent(event({ payment_id: PAYMENT }));
    expect(report).toHaveBeenCalledWith("reservation", PAYMENT, expect.objectContaining({ metadata: { payment_id: PAYMENT } }));
  });

  it("does not report a payment that needs a look, a double charge, or a repeated event", async () => {
    rpc.mockImplementation(async (name: string) => (name === "complete_payment" ? paid({ needs_review: true }) : { data: null, error: null }));
    await handleStripeEvent(event({ payment_id: PAYMENT }));
    rpc.mockImplementation(async () => paid({ duplicate: true }));
    await handleStripeEvent(event({ payment_id: PAYMENT }));
    rpc.mockImplementation(async () => paid({ newly_paid: false }));
    await handleStripeEvent(event({ payment_id: PAYMENT }));
    expect(report).not.toHaveBeenCalled();
  });

  it("waits for a delayed payment: an unpaid completed session reports nothing", async () => {
    await handleStripeEvent(event({ coupon_id: "11111111-1111-4111-8111-111111111111" }, { payment_status: "unpaid" }));
    expect(report).not.toHaveBeenCalled();
    expect(onCouponPaid).not.toHaveBeenCalled();
  });
});
