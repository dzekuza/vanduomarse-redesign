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

const input = { planId: "52e95927-7591-4feb-99b4-1b92c878ca6c", buyerName: "Jonas Jonaitis", buyerEmail: "jonas@example.com", gift: false, recipientName: "Petras" };
const created = { data: [{ id: "id-1", reference: "PS-1", plan_name: "WAKE sezono abonementas", price: 675 }], error: null };

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
});
