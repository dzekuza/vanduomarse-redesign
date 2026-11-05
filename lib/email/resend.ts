import "server-only";
import { MAIN_CONTACT } from "@/lib/contacts";

/**
 * Email over the Resend HTTP API (no SDK). Needs RESEND_API_KEY and a sender on a
 * Resend-verified domain: NOTIFY_FROM_EMAIL (falls back to COUPON_FROM_EMAIL).
 * Without them every send is skipped, so a booking never fails because of email.
 */

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  /** Overrides the sender, e.g. COUPON_FROM_EMAIL for coupons. */
  from?: string;
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const notifyFrom = () => process.env.NOTIFY_FROM_EMAIL || process.env.COUPON_FROM_EMAIL;

export const notifyEmailConfigured = () => Boolean(process.env.RESEND_API_KEY && notifyFrom());

/**
 * `next dev` emails nobody by default (the message is logged instead), like SMS.
 * Set EMAIL_IN_DEV=1 to send real email locally. Never applies to a production build.
 */
export const emailSkippedInDev = () => process.env.NODE_ENV === "development" && process.env.EMAIL_IN_DEV !== "1";

/** A plausible single address; the database already checked shape, this only guards odd values. */
const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** "a@x.lt, b@y.lt" → ["a@x.lt", "b@y.lt"]. */
export const emailList = (value: string | null | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(looksLikeEmail);

/** Returns true when Resend accepted the message. Never throws. */
export async function sendEmail(m: EmailMessage, opts: { skipInDev?: boolean } = { skipInDev: true }): Promise<boolean> {
  const to = (Array.isArray(m.to) ? m.to : [m.to]).filter(looksLikeEmail);
  if (to.length === 0) return false;
  if (opts.skipInDev && emailSkippedInDev()) {
    console.info(`[dev] email "${m.subject}" to ${to.length} recipient(s) not sent:\n${m.text}`);
    return true;
  }
  const key = process.env.RESEND_API_KEY;
  const from = m.from ?? notifyFrom();
  if (!key || !from) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, reply_to: MAIN_CONTACT.email, subject: m.subject, text: m.text, html: m.html }),
    });
    // Log the status only: the body and the address are customer data.
    if (!res.ok) console.error(`Resend email failed: HTTP ${res.status}`);
    return res.ok;
  } catch {
    console.error("Resend email failed: network error");
    return false;
  }
}
