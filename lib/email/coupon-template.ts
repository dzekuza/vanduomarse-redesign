import "server-only";
import { CONTACTS } from "@/lib/contacts";
import { COUPON_RULES, COUPON_RULES_TITLE } from "@/lib/coupon-rules";
import { COUPON_SERVICE_LABEL, formatCode, formatEuro, formatExpiry } from "@/lib/coupons";
import { SITE_URL } from "@/lib/site";
import type { CouponEmail } from "./send-coupon";
import { escapeHtml } from "./resend";

/**
 * The gift coupon email in the brand style: aubergine header with the logo, blush paper, coral code between dashed
 * tear lines. Mail clients ignore classes and external CSS, so this is a table layout with inline styles (the one
 * place inline styles are required) and web-safe fonts. Brand colours: app/globals.css raw tokens.
 */

const INK = "#382e38";
const PAPER = "#fbf3ef";
const BACKGROUND = "#eed9ce";
const CORAL = "#ed5257";
const CORAL_INK = "#a8282d";
const COPY = "#6d6069";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const label = (text: string) => `<p style="margin:0 0 4px;font:700 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:${COPY};">${escapeHtml(text)}</p>`;

export type CouponEmailAudience = "buyer" | "recipient";

export function buildCouponEmail(c: CouponEmail, audience: CouponEmailAudience): { subject: string; html: string; text: string } {
  const code = formatCode(c.code);
  const contact = CONTACTS[0];
  const expires = formatExpiry(c.expiresAt);
  const service = COUPON_SERVICE_LABEL[c.service];
  const value = formatEuro(c.faceValue);

  const greeting = audience === "buyer" ? `Sveiki, ${c.buyerName}!` : c.recipientName ? `Sveiki, ${c.recipientName}!` : "Sveiki!";
  const intro =
    audience === "buyer"
      ? `Dėkojame už užsakymą. Jūsų ${c.productName} (${value}) paruoštas${c.recipientName ? `, dovana: ${c.recipientName}` : ""}.`
      : `${c.buyerName} dovanoja jums Vanduo Marse kuponą: ${c.productName} (${value}).`;
  const subject = audience === "buyer" ? `Jūsų Vanduo Marse kuponas ${code}` : `${c.buyerName} padovanojo jums Vanduo Marse kuponą`;
  const logo = `${SITE_URL}/brand/logo-email.png`;

  const html = `<!doctype html>
<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only;}</style><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BACKGROUND};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BACKGROUND};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${PAPER};border:1px solid ${INK};">
  <tr><td style="background:${INK};padding:24px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><img src="${escapeHtml(logo)}" alt="Vanduo Marse" height="44" style="display:block;height:44px;width:auto;border:0;"></td>
      <td align="right" style="font:700 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:${CORAL};">Dovanų kuponas</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:32px;font-family:${FONT};color:${INK};">
    <p style="margin:0 0 16px;font:400 16px/1.5 ${FONT};">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 24px;font:400 16px/1.5 ${FONT};">${escapeHtml(intro)}</p>
    ${c.message ? `<p style="margin:0 0 24px;padding:4px 0 4px 14px;border-left:4px solid ${CORAL};font:italic 400 16px/1.5 ${FONT};">${escapeHtml(c.message)}</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px dashed ${INK};border-bottom:1px dashed ${INK};"><tr><td style="padding:20px 0;">
      ${label("Kupono kodas")}
      <p style="margin:0;font:700 30px/1.15 ${FONT};letter-spacing:1px;color:${CORAL_INK};">${escapeHtml(code)}</p>
    </td></tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>
      <td width="34%" valign="top" style="padding-right:8px;">${label("Vertė")}<p style="margin:0;font:700 15px ${FONT};">${escapeHtml(value)}</p></td>
      <td width="33%" valign="top" style="padding-right:8px;">${label("Galioja iki")}<p style="margin:0;font:700 15px ${FONT};">${escapeHtml(expires)}</p></td>
      <td width="33%" valign="top">${label("Tinka")}<p style="margin:0;font:700 15px ${FONT};">${escapeHtml(service)}</p></td>
    </tr></table>
    ${
      c.voucherUrl
        ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:${INK};"><a href="${escapeHtml(c.voucherUrl)}" style="display:inline-block;padding:14px 24px;font:700 14px ${FONT};color:${PAPER};text-decoration:none;">Atidaryti kuponą</a></td></tr></table>
    <p style="margin:0 0 8px;font:400 13px/1.5 ${FONT};color:${COPY};">Kuponą PDF formatu rasite ir prisegtame faile.</p>`
        : `<p style="margin:24px 0 8px;font:400 13px/1.5 ${FONT};color:${COPY};">Kuponą PDF formatu rasite prisegtame faile.</p>`
    }
    <p style="margin:24px 0 8px;font:700 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:${COPY};">${escapeHtml(COUPON_RULES_TITLE)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0">${COUPON_RULES.map(
      (s, i) => `<tr><td valign="top" style="padding:0 10px 8px 0;font:700 14px/1.5 ${FONT};color:${CORAL_INK};">${i + 1}</td><td style="padding:0 0 8px;font:400 14px/1.5 ${FONT};">${escapeHtml(s)}</td></tr>`,
    ).join("")}</table>
  </td></tr>
  <tr><td style="background:${INK};padding:16px 32px;font:400 13px/1.5 ${FONT};color:${PAPER};">
    <strong>Vanduo Marse</strong> · ${escapeHtml(contact.email)} · ${escapeHtml(contact.phone)}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    greeting,
    "",
    intro,
    ...(c.message ? ["", `Palinkėjimas: ${c.message}`] : []),
    "",
    `Kupono kodas: ${code}`,
    `Vertė: ${value}`,
    `Galioja: ${service.toLowerCase()}, iki ${expires}`,
    "",
    `${COUPON_RULES_TITLE}:`,
    ...COUPON_RULES.map((s, i) => `${i + 1}. ${s}`),
    ...(c.voucherUrl ? ["", `Kuponas spausdinimui / PDF: ${c.voucherUrl}`] : []),
    "Kuponą PDF formatu rasite prisegtame faile.",
    "",
    `Klausimai? ${contact.email}, ${contact.phone}`,
    "Vanduo Marse",
  ].join("\n");

  return { subject, html, text };
}
