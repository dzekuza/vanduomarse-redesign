"use server";

import { after } from "next/server";
import type { ActionResult } from "@/app/admin/actions";
import { couponOrderSchema, type CouponOrderInput } from "@/lib/coupon-schema";
import { normalizeCode, COUPON_CODE_LENGTH, type CheckedCoupon, type RedeemableService, couponApplies } from "@/lib/coupons";
import { openCouponCheckout } from "@/lib/coupon-checkout";
import { notifyCouponOrdered } from "@/lib/notify";
import { paymentsEnabled } from "@/lib/stripe";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Public coupon actions. They run as the anonymous role: the database only lets
 * anon create an order and check a code (security definer functions), so
 * nothing here can read other customers' coupons.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

export interface CouponOrderResult {
  reference: string;
  amount: number;
  productName: string;
  /** Stripe Checkout, when online payment is on; otherwise staff arrange payment and issue the code. */
  checkoutUrl?: string;
}

export async function createCouponOrder(input: CouponOrderInput): Promise<ActionResult<CouponOrderResult>> {
  const parsed = couponOrderSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užsakymo duomenis.", "invalid");
  const v = parsed.data;

  // A bot that filled the honeypot gets the same answer as a person, and nothing is stored.
  if (v.website) return { data: { reference: "KP-0000", amount: 0, productName: "" } };

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_coupon_order", {
    p_product_id: v.productId,
    p_buyer_name: v.buyerName,
    p_buyer_email: v.buyerEmail,
    p_buyer_phone: v.buyerPhone,
    p_recipient_name: v.recipientName,
    p_recipient_email: v.recipientEmail,
    p_message: v.message,
  });

  if (error) {
    if (error.hint === "product_unavailable") return fail("Šio kupono jau nebeparduodame. Atnaujinkite puslapį.", "unavailable");
    if (error.hint === "too_many_orders") return fail("Šiuo metu priimame per daug užsakymų. Bandykite vėliau arba skambinkite.", "busy");
    return fail("Nepavyko pateikti užsakymo. Bandykite dar kartą.", "db");
  }
  const row = data[0];
  // Online payment: Stripe Checkout, and the webhook issues the code and sends the emails once paid.
  if (paymentsEnabled()) {
    const checkoutUrl = await openCouponCheckout({ id: row.id, reference: row.reference, productName: row.product_name, amount: row.amount, buyerEmail: v.buyerEmail });
    if (checkoutUrl) return { data: { reference: row.reference, amount: row.amount, productName: row.product_name, checkoutUrl } };
  }
  // No online payment (or Stripe refused): staff arrange payment and issue the code; the buyer and staff are told now.
  after(() => notifyCouponOrdered({ reference: row.reference, amount: row.amount, productName: row.product_name, buyerName: v.buyerName, buyerEmail: v.buyerEmail, buyerPhone: v.buyerPhone, recipientName: v.recipientName, recipientEmail: v.recipientEmail }));
  return { data: { reference: row.reference, amount: row.amount, productName: row.product_name } };
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
