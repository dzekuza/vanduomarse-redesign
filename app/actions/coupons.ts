"use server";

import type { ActionResult } from "@/app/admin/actions";
import { couponOrderSchema, type CouponOrderInput } from "@/lib/coupon-schema";
import { normalizeCode, COUPON_CODE_LENGTH, type CheckedCoupon, type RedeemableService, couponApplies } from "@/lib/coupons";
import { openCouponCheckout } from "@/lib/coupon-checkout";
import { clientIp } from "@/lib/client-ip";
import { hashIp } from "@/lib/phone-verification";
import { paymentsEnabled } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Public coupon actions. They run as the anonymous role: the database only lets
 * anon create an order and check a code (security definer functions), so
 * nothing here can read other customers' coupons.
 */

const FAILED = "Nepavyko pateikti užsakymo. Bandykite dar kartą.";

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

export interface CouponOrderResult {
  reference: string;
  amount: number;
  productName: string;
  /** Stripe Checkout. The buyer pays there and the webhook issues the code: no staff step. */
  checkoutUrl: string;
}

export async function createCouponOrder(input: CouponOrderInput): Promise<ActionResult<CouponOrderResult>> {
  const parsed = couponOrderSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užsakymo duomenis.", "invalid");
  const v = parsed.data;

  // A bot that filled the honeypot gets a generic failure, and nothing is stored.
  if (v.website) return fail(FAILED, "db");
  // Coupons are bought online only: without Stripe there is nothing to pay with, so no order is stored.
  if (!paymentsEnabled()) return fail("Kuponų pirkimas šiuo metu neveikia. Skambinkite mums ir padėsime.", "setup");

  // Only a hash of the IP is kept, for the per-IP cap on unpaid orders. Without the secret the cap is skipped.
  let ipHash: string | undefined;
  try {
    ipHash = hashIp(await clientIp());
  } catch (e) {
    console.error("Coupon order: IP hash unavailable, per-IP cap skipped", e);
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_coupon_order", {
    p_product_id: v.productId,
    p_buyer_name: v.buyerName,
    p_buyer_email: v.buyerEmail,
    p_buyer_phone: v.buyerPhone,
    p_recipient_name: v.recipientName,
    p_recipient_email: v.recipientEmail,
    p_message: v.message,
    p_ip_hash: ipHash,
  });

  if (error) {
    if (error.hint === "product_unavailable") return fail("Šio kupono jau nebeparduodame. Atnaujinkite puslapį.", "unavailable");
    if (error.hint === "too_many_orders") return fail("Šiuo metu priimame per daug užsakymų. Bandykite vėliau arba skambinkite.", "busy");
    return fail(FAILED, "db");
  }
  const row = data[0];
  // The webhook issues the code and sends the emails once Stripe confirms payment.
  const checkoutUrl = await openCouponCheckout({ id: row.id, reference: row.reference, productName: row.product_name, amount: row.amount, buyerEmail: v.buyerEmail });
  if (!checkoutUrl) {
    // Checkout could not open: drop the order so nothing waits for a payment that cannot happen.
    try {
      await createAdminClient().rpc("abandon_coupon_order", { p_coupon_id: row.id });
    } catch (e) {
      console.error("Coupon order: could not drop the order", row.reference, e);
    }
    return fail("Nepavyko pradėti mokėjimo. Bandykite dar kartą arba skambinkite.", "payment");
  }
  return { data: { reference: row.reference, amount: row.amount, productName: row.product_name, checkoutUrl } };
}

/** Looks a code up for a booking flow; says nothing about unknown, unpaid, spent or expired codes. */
export async function checkCoupon(code: string, flow: RedeemableService): Promise<ActionResult<CheckedCoupon>> {
  const normalized = normalizeCode(code);
  if (normalized.length !== COUPON_CODE_LENGTH) return fail("Kodą sudaro 12 simbolių.", "format");

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("check_coupon", { p_code: normalized });
  if (error) return fail("Nepavyko patikrinti kupono. Bandykite dar kartą.", "db");

  const row = data[0];
  if (!row) return fail("Toks galiojantis kuponas nerastas.", "not_found");
  if (!couponApplies(row.service, flow)) {
    return fail(flow === "pirtis" ? "Šis kuponas skirtas kitai paslaugai, ne pirčiai." : "Šis kuponas skirtas kitai paslaugai, ne nakvynei.", "wrong_service");
  }
  return { data: { code: normalized, balance: row.balance, service: row.service, expiresAt: row.expires_at, productName: row.product_name } };
}
