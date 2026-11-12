import "server-only";
import { formatCode, type CouponService } from "@/lib/coupons";
import { buildCouponPdf } from "./coupon-pdf";
import { buildCouponEmail } from "./coupon-template";
import { sendEmail, type EmailMessage } from "./resend";

/**
 * Coupon delivery over the Resend HTTP API (no SDK). Needs RESEND_API_KEY and
 * COUPON_FROM_EMAIL (an address on a Resend-verified domain). Without them the
 * send is skipped and the caller reports it, so staff can pass the code on by hand.
 */

export interface CouponEmail {
  to: string;
  /** Optional gift recipient; gets their own copy of the code. */
  recipientEmail?: string;
  buyerName: string;
  recipientName: string;
  message: string;
  code: string;
  productName: string;
  faceValue: number;
  service: CouponService;
  /** yyyy-mm-dd */
  expiresAt: string;
  /** Order number printed on the voucher, when known. */
  reference?: string;
  /** Printable voucher page (save as PDF); linked from the email when known. */
  voucherUrl?: string;
}

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.COUPON_FROM_EMAIL);

/** The voucher as an attachment, or none when it could not be built (the email still carries the code). */
async function voucherAttachment(c: CouponEmail): Promise<EmailMessage["attachments"]> {
  try {
    const pdf = await buildCouponPdf({ ...c, expiresAt: c.expiresAt });
    return [{ filename: `Vanduo-Marse-kuponas-${formatCode(c.code)}.pdf`, content: pdf }];
  } catch (e) {
    console.error("Coupon PDF could not be built, email goes without it", e);
    return undefined;
  }
}

/** Returns true when Resend accepted the message. */
export async function sendCouponEmail(c: CouponEmail): Promise<boolean> {
  const from = process.env.COUPON_FROM_EMAIL;
  if (!process.env.RESEND_API_KEY || !from) return false;
  const { subject, html, text } = buildCouponEmail(c, "buyer");
  // Staff pressed "Pažymėti apmokėtu" on purpose, so this sends from `next dev` too.
  return sendEmail({ from, to: c.to, subject, text, html, attachments: await voucherAttachment(c) }, { skipInDev: false });
}

/** The gift email: the same code, addressed to the recipient, with the buyer's wish. Returns true when Resend accepted it. */
export async function sendCouponRecipientEmail(c: CouponEmail): Promise<boolean> {
  const from = process.env.COUPON_FROM_EMAIL;
  if (!process.env.RESEND_API_KEY || !from || !c.recipientEmail) return false;
  const { subject, html, text } = buildCouponEmail(c, "recipient");
  return sendEmail({ from, to: c.recipientEmail, subject, text, html, attachments: await voucherAttachment(c) }, { skipInDev: false });
}

/** Buyer and, when given, the recipient. True only when every intended email was accepted. */
export async function sendCouponEmails(c: CouponEmail): Promise<boolean> {
  const [buyer, recipient] = await Promise.all([sendCouponEmail(c), c.recipientEmail ? sendCouponRecipientEmail(c) : Promise.resolve(true)]);
  return buyer && recipient;
}
