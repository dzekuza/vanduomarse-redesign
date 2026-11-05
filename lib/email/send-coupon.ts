import "server-only";
import { COUPON_SERVICE_LABEL, formatCode, formatExpiry, type CouponService } from "@/lib/coupons";
import { CONTACTS } from "@/lib/contacts";
import { escapeHtml, sendEmail } from "./resend";

/**
 * Coupon delivery over the Resend HTTP API (no SDK). Needs RESEND_API_KEY and
 * COUPON_FROM_EMAIL (an address on a Resend-verified domain). Without them the
 * send is skipped and the caller reports it, so staff can pass the code on by hand.
 */

export interface CouponEmail {
  to: string;
  buyerName: string;
  recipientName: string;
  message: string;
  code: string;
  productName: string;
  faceValue: number;
  service: CouponService;
  /** yyyy-mm-dd */
  expiresAt: string;
}

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.COUPON_FROM_EMAIL);

/** Returns true when Resend accepted the message. */
export async function sendCouponEmail(c: CouponEmail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.COUPON_FROM_EMAIL;
  if (!key || !from) return false;

  const code = formatCode(c.code);
  const contact = CONTACTS[0];
  const lines = [
    `Sveiki, ${c.buyerName}!`,
    "",
    `Dėkojame už užsakymą. Jūsų ${c.productName} (${c.faceValue} €) paruoštas${c.recipientName ? `, dovana: ${c.recipientName}` : ""}.`,
    "",
    `Kupono kodas: ${code}`,
    `Galioja: ${COUPON_SERVICE_LABEL[c.service].toLowerCase()}, iki ${formatExpiry(c.expiresAt)}`,
    ...(c.message ? ["", `Palinkėjimas: ${c.message}`] : []),
    "",
    "Kaip panaudoti: įveskite kodą rezervuodami pirtį ar nakvynę svetainėje, arba parodykite jį parke.",
    "",
    `Klausimai? ${contact.email}, ${contact.phone}`,
    "Vanduo Marse",
  ];

  const html = [
    `<p>Sveiki, ${escapeHtml(c.buyerName)}!</p>`,
    `<p>Dėkojame už užsakymą. Jūsų <strong>${escapeHtml(c.productName)}</strong> (${c.faceValue} €) paruoštas${c.recipientName ? `, dovana: ${escapeHtml(c.recipientName)}` : ""}.</p>`,
    `<h1>${escapeHtml(code)}</h1>`,
    `<p>Galioja: ${escapeHtml(COUPON_SERVICE_LABEL[c.service].toLowerCase())}, iki ${escapeHtml(formatExpiry(c.expiresAt))}.</p>`,
    ...(c.message ? [`<blockquote>${escapeHtml(c.message)}</blockquote>`] : []),
    `<p>Kaip panaudoti: įveskite kodą rezervuodami pirtį ar nakvynę svetainėje, arba parodykite jį parke.</p>`,
    `<p>Klausimai? ${escapeHtml(contact.email)}, ${escapeHtml(contact.phone)}<br>Vanduo Marse</p>`,
  ].join("\n");

  // Staff pressed "Pažymėti apmokėtu" on purpose, so this sends from `next dev` too.
  return sendEmail({ from, to: c.to, subject: `Jūsų Vanduo Marse kuponas ${code}`, text: lines.join("\n"), html }, { skipInDev: false });
}
