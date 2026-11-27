import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const openCheckout = vi.fn();
const paymentsEnabled = vi.fn();
const campaignError = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/stripe", () => ({ paymentsEnabled: () => paymentsEnabled() }));
vi.mock("@/lib/plan-pass-checkout", () => ({ openPlanPassCheckout: (o: unknown) => openCheckout(o) }));
vi.mock("@/lib/client-ip", () => ({ clientIp: async () => "203.0.113.7" }));
vi.mock("@/lib/phone-verification", () => ({ hashIp: () => "hashed-ip" }));
vi.mock("@/lib/wake-campaign", () => ({ campaignDiscountError: (...a: unknown[]) => campaignError(...a) }));

const { buyPlanPass } = await import("@/app/actions/plan-pass");

const input = { planId: "52e95927-7591-4feb-99b4-1b92c878ca6c", buyerName: "Jonas Jonaitis", buyerEmail: "jonas@example.com", gift: false, recipientName: "Petras", paymentPlan: "visa" as const };
const created = { data: [{ id: "id-1", reference: "PS-1", plan_name: "WAKE sezono abonementas", price: 675, payment_plan: "visa", deposit_amount: null, balance_amount: null }], error: null };

beforeEach(() => {
  vi.resetAllMocks();
  paymentsEnabled.mockReturnValue(true);
  campaignError.mockResolvedValue(null);
  openCheckout.mockResolvedValue("https://checkout.stripe.com/c/pay/cs_test_1");
  rpc.mockResolvedValue(created);
});

const calls = (name: string) => rpc.mock.calls.filter(([n]) => n === name);

describe("buyPlanPass", () => {
  it("creates the pass for the buyer and returns the Stripe URL, with no registration", async () => {
    const result = await buyPlanPass(input);
    expect(result).toEqual({ data: { checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1" } });
    expect(calls("create_plan_pass")[0][1]).toMatchObject({ p_plan_id: input.planId, p_buyer_email: "jonas@example.com", p_gift: false, p_ip_hash: "hashed-ip" });
    // The pass is the only thing written: no rider, no registration.
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(["create_plan_pass"]);
    expect(openCheckout).toHaveBeenCalledWith(expect.objectContaining({ id: "id-1", amount: 675, buyerEmail: "jonas@example.com", gift: false }));
  });

  it("keeps the friend's name only for a gift", async () => {
    await buyPlanPass(input);
    expect(calls("create_plan_pass")[0][1].p_recipient_name).toBe("");
    rpc.mockClear();
    await buyPlanPass({ ...input, gift: true });
    expect(calls("create_plan_pass")[0][1]).toMatchObject({ p_gift: true, p_recipient_name: "Petras" });
  });

  it("stores nothing for a bot, a bad form, or when payments are off", async () => {
    expect(await buyPlanPass({ ...input, website: "x" })).toMatchObject({ error: { code: "db" } });
    expect("error" in (await buyPlanPass({ ...input, buyerEmail: "nope" }))).toBe(true);
    paymentsEnabled.mockReturnValue(false);
    expect("error" in (await buyPlanPass(input))).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses the campaign code before anything is stored", async () => {
    campaignError.mockResolvedValue("Šiuo metu „Black Friday“ pasiūlymas negalioja.");
    const result = await buyPlanPass({ ...input, discountCode: "WAKEBLACKFRIDAY2026" });
    expect(result).toMatchObject({ error: { code: "discount" } });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("drops the pass again when Checkout cannot open", async () => {
    openCheckout.mockResolvedValue(null);
    const result = await buyPlanPass(input);
    expect(result).toMatchObject({ error: { code: "payment" } });
    expect(calls("abandon_plan_pass")[0][1]).toEqual({ p_pass_id: "id-1" });
  });

  it("explains a used-up code and a busy shop", async () => {
    rpc.mockResolvedValue({ data: null, error: { hint: "discount_used_up", message: "x" } });
    expect(await buyPlanPass({ ...input, discountCode: "ABC" })).toMatchObject({ error: { code: "discount" } });
    rpc.mockResolvedValue({ data: null, error: { hint: "too_many_orders", message: "x" } });
    expect(await buyPlanPass(input)).toMatchObject({ error: { code: "busy" } });
    expect(openCheckout).not.toHaveBeenCalled();
  });

  it("pays the deposit of a WAKE pass paid in parts: the amount comes from the database", async () => {
    rpc.mockResolvedValue({ data: [{ id: "id-1", reference: "PS-1", plan_name: "WAKE sezono abonementas", price: 600, payment_plan: "dalimis", deposit_amount: 300, balance_amount: 300 }], error: null });
    const result = await buyPlanPass({ ...input, paymentPlan: "dalimis" });
    expect(result).toEqual({ data: { checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1" } });
    expect(calls("create_plan_pass")[0][1]).toMatchObject({ p_payment_plan: "dalimis" });
    expect(openCheckout).toHaveBeenCalledWith(expect.objectContaining({ amount: 300, part: "depozitas" }));
  });

  it("refuses parts for any plan but the WAKE season pass, before anything is stored", async () => {
    const result = await buyPlanPass({ ...input, planId: "11111111-1111-4111-8111-111111111111", paymentPlan: "dalimis" });
    expect(result).toMatchObject({ error: { code: "payment_plan" } });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("treats a request without a payment plan (a page opened before this change) as a full payment", async () => {
    const { paymentPlan: _omit, ...old } = input;
    void _omit;
    await buyPlanPass(old as typeof input);
    expect(calls("create_plan_pass")[0][1]).toMatchObject({ p_payment_plan: "visa" });
    expect(openCheckout).toHaveBeenCalledWith(expect.objectContaining({ amount: 675, part: undefined }));
  });
});
