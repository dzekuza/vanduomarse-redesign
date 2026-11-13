"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CouponProduct } from "@/lib/coupons";
import { buildCouponPdf } from "@/lib/email/coupon-pdf";
import { sendCouponEmails } from "@/lib/email/send-coupon";
import { refundCouponPayment } from "@/lib/coupon-refund";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";

/* ---------------- coupons ---------------- */

const couponProductInput = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/).max(60),
    kind: z.enum(["verte", "paslauga"]),
    service: z.enum(["visi", "kabelis", "pirtis", "miegas"]),
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(200),
    value: z.number().positive().max(10_000),
    active: z.boolean(),
  })
  .refine((p) => (p.kind === "verte") === (p.service === "visi"));

export async function saveCouponProduct(product: CouponProduct): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  const parsed = couponProductInput.safeParse(product);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const p = parsed.data;
  const { error } = await ctx.supabase
    .from("coupon_products")
    .upsert({ id: p.id, kind: p.kind, service: p.service, name: p.name, description: p.description, value: p.value, active: p.active });
  revalidatePath("/kuponai");
  return error ? dbError(error) : done(null);
}

export async function deleteCouponProduct(id: string): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("coupon_products").delete().eq("id", id);
  if (error?.code === "23503") return fail("Šio kupono jau yra užsakymų – jį galima tik išjungti.", "in_use");
  revalidatePath("/kuponai");
  return error ? dbError(error) : done(null);
}

export interface ActivatedCoupon {
  code: string;
  /** yyyy-mm-dd */
  expiresAt: string;
  /** False when no email service is configured or Resend refused the message. */
  emailSent: boolean;
}

/** Staff confirm payment: the database issues the code and expiry, then the buyer is emailed. */
export async function activateCoupon(id: string): Promise<ActionResult<ActivatedCoupon>> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { supabase } = ctx;

  const { data, error } = await supabase.rpc("activate_coupon", { p_id: id });
  if (error) return dbError(error);
  const issued = data[0];

  const { data: c } = await supabase.from("coupons").select("*").eq("id", id).single();
  const emailSent = c
    ? await sendCouponEmails({
        to: c.buyer_email,
        recipientEmail: c.recipient_email,
        buyerName: c.buyer_name,
        recipientName: c.recipient_name,
        message: c.message,
        code: issued.code,
        productName: c.product_name,
        faceValue: c.face_value,
        service: c.service,
        expiresAt: issued.expires_at,
        reference: c.reference,
      })
    : false;
  return done({ code: issued.code, expiresAt: issued.expires_at, emailSent });
}

export async function resendCouponEmail(id: string): Promise<ActionResult<{ emailSent: boolean }>> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data: c, error } = await ctx.supabase.from("coupons").select("*").eq("id", id).single();
  if (error) return dbError(error);
  if (c.status !== "aktyvus" || !c.code || !c.expires_at) return fail("Kodas išsiunčiamas tik aktyviam kuponui.", "invalid");
  const emailSent = await sendCouponEmails({
    to: c.buyer_email,
    recipientEmail: c.recipient_email,
    buyerName: c.buyer_name,
    recipientName: c.recipient_name,
    message: c.message,
    code: c.code,
    productName: c.product_name,
    faceValue: c.face_value,
    service: c.service,
    expiresAt: c.expires_at,
    reference: c.reference,
  });
  return { data: { emailSent } };
}

/** The coupon as a PDF for staff to download or print (base64, so it can cross the server action boundary). */
export async function couponPdf(id: string): Promise<ActionResult<{ fileName: string; base64: string }>> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data: c, error } = await ctx.supabase.from("coupons").select("*").eq("id", id).single();
  if (error) return dbError(error);
  if (!c.code || !c.expires_at || (c.status !== "aktyvus" && c.status !== "panaudotas")) return fail("PDF paruošiamas tik aktyviam ar panaudotam kuponui.", "invalid");
  try {
    const pdf = await buildCouponPdf({
      code: c.code,
      reference: c.reference,
      productName: c.product_name,
      faceValue: c.face_value,
      service: c.service,
      expiresAt: c.expires_at,
      buyerName: c.buyer_name,
      recipientName: c.recipient_name,
      message: c.message,
    });
    return done({ fileName: `Vanduo-Marse-kuponas-${c.reference}.pdf`, base64: pdf.toString("base64") });
  } catch (e) {
    console.error("Coupon PDF for staff could not be built", c.reference, e);
    return fail("Nepavyko sukurti PDF.", "pdf");
  }
}

/**
 * Returns the unspent part of a cancelled, online-paid coupon to the buyer's card through Stripe (`lib/coupon-refund.ts`).
 * Cancelling the coupon does not refund by itself, so staff do it here on purpose. The refund is reserved in the database
 * (one per coupon, amount computed there) and sent to Stripe with a fixed key, so a repeated click or retry cannot pay twice.
 */
export async function refundCoupon(id: string): Promise<ActionResult<{ refunded: number }>> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const outcome = await refundCouponPayment(id, ctx.userId);
  return outcome.ok ? done({ refunded: outcome.amount }) : fail(outcome.message, "refund");
}

const redeemInput = z.object({ id: z.uuid(), amount: z.number().positive().max(10_000), note: z.string().trim().max(200) });

/** Spends `amount` from an active coupon; the database enforces balance, status and expiry. */
export async function redeemCoupon(id: string, amount: number, note: string): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  const parsed = redeemInput.safeParse({ id, amount: Math.round(amount * 100) / 100, note });
  if (!parsed.success) return fail("Netinkama suma.", "invalid");
  const v = parsed.data;
  const { error } = await ctx.supabase.from("coupon_redemptions").insert({ coupon_id: v.id, amount: v.amount, note: v.note, redeemed_by: ctx.userId });
  return error ? dbError(error) : done(null);
}

export async function cancelCoupon(id: string): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("coupons").update({ status: "atsauktas" }).eq("id", id).in("status", ["laukia_apmokejimo", "aktyvus"]);
  return error ? dbError(error) : done(null);
}
