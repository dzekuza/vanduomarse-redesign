import "server-only";
import { MAIN_CONTACT } from "@/lib/contacts";
import { SITE_URL } from "@/lib/site";
import { escapeHtml } from "./resend";

/**
 * Shared HTML shell of the notification emails (same look as the coupon email): aubergine header with the logo,
 * blush paper, contact band at the bottom. Mail clients ignore classes and external CSS, so this is a table layout
 * with inline styles (the one place inline styles are required) and web-safe fonts. Brand colours: app/globals.css.
 */

const INK = "#382e38";
const PAPER = "#fbf3ef";
const BACKGROUND = "#eed9ce";
const CORAL = "#ed5257";
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export type EmailParagraph = string | { strong: string };
export interface EmailButton {
  label: string;
  href: string;
}

const paragraphHtml = (p: EmailParagraph) =>
  typeof p === "string"
    ? `<p style="margin:0 0 16px;font:400 16px/1.5 ${FONT};">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
    : `<p style="margin:0 0 16px;font:700 16px/1.5 ${FONT};">${escapeHtml(p.strong).replace(/\n/g, "<br>")}</p>`;

const buttonHtml = ({ label, href }: EmailButton) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 8px;"><tr><td style="background:${INK};"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 24px;font:700 14px ${FONT};color:${PAPER};text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;

export function brandedEmailHtml({ subject = "Vanduo Marse", paragraphs, button }: { subject?: string; paragraphs: EmailParagraph[]; button?: EmailButton }): string {
  const logo = `${SITE_URL}/brand/logo-email.png`;
  return `<!doctype html>
<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only;}</style><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${BACKGROUND};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BACKGROUND};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${PAPER};border:1px solid ${INK};">
  <tr><td style="background:${INK};padding:24px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><img src="${escapeHtml(logo)}" alt="Vanduo Marse" height="44" style="display:block;height:44px;width:auto;border:0;"></td>
      <td align="right" style="font:700 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:${CORAL};">Rezervacija</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:32px 32px 16px;font-family:${FONT};color:${INK};">
    ${paragraphs.map(paragraphHtml).join("\n    ")}
    ${button ? buttonHtml(button) : ""}
  </td></tr>
  <tr><td style="background:${INK};padding:16px 32px;font:400 13px/1.5 ${FONT};color:${PAPER};">
    <strong>Vanduo Marse</strong> · ${escapeHtml(MAIN_CONTACT.email)} · ${escapeHtml(MAIN_CONTACT.phone)}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
