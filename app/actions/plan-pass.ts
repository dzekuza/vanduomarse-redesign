"use server";

import type { ActionResult } from "@/app/admin/actions";
import { clientIp } from "@/lib/client-ip";
import { hashIp } from "@/lib/phone-verification";
import { planPassSchema, type PlanPassInput } from "@/lib/plan-pass";
import { openPlanPassCheckout } from "@/lib/plan-pass-checkout";
import { paymentsEnabled } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { campaignDiscountError } from "@/lib/wake-campaign";

/**
 * Buying a bracelet plan with only a name and an e-mail (ADR-0109): no registration first. The pass is created unattached
 * and unpaid, then Stripe Checkout opens; the webhook marks it paid and issues the code. Registration happens later, before
 * staff attach the pass to a rider at the park.
 */

const FAILED = "Nepavyko pradėti mokėjimo. Bandykite dar kartą arba skambinkite.";

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

export async function buyPlanPass(input: PlanPassInput): Promise<ActionResult<{ checkoutUrl: string }>> {
  const parsed = planPassSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Patikrinkite užsakymo duomenis.", "invalid");
  const v = parsed.data;

  // A bot that filled the honeypot gets a generic failure, and nothing is stored.
  if (v.website) return fail(FAILED, "db");
  if (!paymentsEnabled()) return fail("Mokėjimas šiuo metu neveikia. Skambinkite mums.", "setup");

  const campaignError = await campaignDiscountError(v.planId, v.discountCode);
  if (campaignError) return fail(campaignError, "discount");

  // Only a hash of the IP is kept, for the cap on unpaid passes; without it nothing is stored.
  let ipHash: string;
  try {
    ipHash = hashIp(await clientIp());
  } catch (e) {
    console.error("Plan pass: IP hash unavailable", e);
    return fail(FAILED, "setup");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_plan_pass", {
    p_plan_id: v.planId,
    p_buyer_name: v.buyerName,
    p_buyer_email: v.buyerEmail,
    p_gift: v.gift,
    p_recipient_name: v.gift ? v.recipientName : "",
    p_discount_code: v.discountCode || undefined,
    p_ip_hash: ipHash,
  });
  const row = data?.[0];
  if (error || !row) {
    if (error?.hint === "plan_unavailable") return fail("Šio abonemento internetu nebeparduodame. Skambinkite mums.", "payment");
    if (error?.hint === "discount_invalid") return fail("Nuolaidos kodas negalioja šiam užsakymui.", "discount");
    if (error?.hint === "discount_used_up") return fail("Šis nuolaidos kodas jau išnaudotas.", "discount");
    if (error?.hint === "below_minimum") return fail("Po nuolaidos suma per maža apmokėjimui (mažiausia 0,50 €).", "discount");
    if (error?.hint === "too_many_orders") return fail("Šiuo metu priimame per daug užsakymų. Bandykite vėliau arba skambinkite.", "busy");
    console.error("Plan pass: could not create the pass", error);
    return fail(FAILED, "db");
  }

  const checkoutUrl = await openPlanPassCheckout({ id: row.id, reference: row.reference, planName: row.plan_name, amount: row.price, buyerEmail: v.buyerEmail, gift: v.gift });
  if (!checkoutUrl) {
    try {
      await admin.rpc("abandon_plan_pass", { p_pass_id: row.id });
    } catch (e) {
      console.error("Plan pass: could not drop the pass", row.reference, e);
    }
    return fail(FAILED, "payment");
  }
  return { data: { checkoutUrl } };
}
