import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const refundsCreate = vi.fn();
const refundsList = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ refunds: { create: refundsCreate, list: refundsList } }),
  toCents: (euros: number) => Math.round(euros * 100),
}));

const { refundRequest } = await import("@/lib/refund");

const reservation = (over: Record<string, unknown> = {}) => ({
  data: [{ reference: "PIR-1", amount: 80, refund_id: "res-1", payment_intent: "pi_1", resumed: false, created_at: new Date().toISOString(), ...over }],
  error: null,
});

const calls = (name: string) => rpc.mock.calls.filter(([n]) => n === name);
const stripeError = (statusCode: number) => Object.assign(new Error("stripe"), { statusCode });

async function* refunds(items: unknown[]) {
  for (const item of items) yield item;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  rpc.mockImplementation(async (name: string) => (name === "begin_request_refund" ? reservation() : { error: null }));
});

describe("refundRequest", () => {
  it("refunds the reserved amount in cents with a key that is stable per reservation, then records it", async () => {
    refundsCreate.mockResolvedValue({ id: "re_1", status: "succeeded" });
    expect(await refundRequest("booking", "id-1", "staff-1")).toEqual({ ok: true, amount: 80 });
    expect(refundsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_1", amount: 8000, metadata: { reference: "PIR-1", request_refund_id: "res-1" } }),
      { idempotencyKey: "request-refund-res-1" },
    );
    expect(calls("finish_request_refund")).toHaveLength(1);
    expect(calls("fail_request_refund")).toHaveLength(0);
  });

  it("explains a refusal from the database instead of calling Stripe", async () => {
    rpc.mockResolvedValue({ data: null, error: { hint: "already_refunded", message: "x" } });
    const outcome = await refundRequest("booking", "id-1", "staff-1");
    expect(outcome).toEqual({ ok: false, message: "Šiai užklausai pinigai jau grąžinti." });
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it("releases the reservation when Stripe clearly refuses", async () => {
    refundsCreate.mockRejectedValue(stripeError(400));
    const outcome = await refundRequest("booking", "id-1", "staff-1");
    expect(outcome.ok).toBe(false);
    expect(calls("fail_request_refund")).toHaveLength(1);
  });

  it("releases the reservation when the refund comes back failed", async () => {
    refundsCreate.mockResolvedValue({ id: "re_1", status: "failed", failure_reason: "lost_or_stolen_card" });
    const outcome = await refundRequest("booking", "id-1", "staff-1");
    expect(outcome.ok).toBe(false);
    expect(calls("fail_request_refund")).toHaveLength(1);
    expect(calls("finish_request_refund")).toHaveLength(0);
  });

  it.each([500, 409, 429, 0])("keeps the reservation when the outcome is unknown (status %i)", async (status) => {
    refundsCreate.mockRejectedValue(stripeError(status));
    refundsList.mockReturnValue(refunds([]));
    const outcome = await refundRequest("booking", "id-1", "staff-1");
    expect(outcome.ok).toBe(false);
    expect(calls("fail_request_refund")).toHaveLength(0);
  });

  it("adopts a refund Stripe already made when the call timed out", async () => {
    refundsCreate.mockRejectedValue(stripeError(500));
    refundsList.mockReturnValue(refunds([{ id: "re_9", status: "succeeded", metadata: { request_refund_id: "res-1" } }]));
    expect(await refundRequest("booking", "id-1", "staff-1")).toEqual({ ok: true, amount: 80 });
    expect(calls("finish_request_refund")[0][1]).toEqual({ p_id: "res-1", p_stripe_refund_id: "re_9" });
  });

  it("reconciles a resumed reservation before creating anything", async () => {
    rpc.mockImplementation(async (name: string) => (name === "begin_request_refund" ? reservation({ resumed: true }) : { error: null }));
    refundsList.mockReturnValue(refunds([{ id: "re_9", status: "succeeded", metadata: { request_refund_id: "res-1" } }]));
    expect(await refundRequest("booking", "id-1", "staff-1")).toEqual({ ok: true, amount: 80 });
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it("never creates a new refund for a resumed reservation older than the idempotency window", async () => {
    const old = new Date(Date.now() - 25 * 3_600_000).toISOString();
    rpc.mockImplementation(async (name: string) => (name === "begin_request_refund" ? reservation({ resumed: true, created_at: old }) : { error: null }));
    refundsList.mockReturnValue(refunds([]));
    const outcome = await refundRequest("booking", "id-1", "staff-1");
    expect(outcome.ok).toBe(false);
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it("turns an unexpected failure into a message and never throws", async () => {
    rpc.mockRejectedValue(new Error("boom"));
    const outcome = await refundRequest("booking", "id-1", "staff-1");
    expect(outcome.ok).toBe(false);
  });
});
