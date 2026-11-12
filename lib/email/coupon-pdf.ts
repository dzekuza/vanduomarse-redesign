import "server-only";
import path from "node:path";
import PDFDocument from "pdfkit";
import { COUPON_RULES, COUPON_RULES_TITLE } from "@/lib/coupon-rules";
import { COUPON_SERVICE_LABEL, formatCode, formatEuro, formatExpiry, type CouponService } from "@/lib/coupons";

/** What the voucher PDF shows. Mirrors the printable page at /kuponai/kuponas. */
export interface CouponPdfData {
  code: string;
  reference?: string;
  productName: string;
  faceValue: number;
  service: CouponService;
  /** yyyy-mm-dd */
  expiresAt: string;
  buyerName: string;
  recipientName: string;
  message: string;
}

// Brand colours (app/globals.css raw tokens): aubergine ink, coral-ink for the code, muted copy.
const INK = "#382e38";
const CORAL = "#ed5257";
const CORAL_INK = "#a8282d";
const COPY = "#5a4c5a";

const ROOT = process.cwd();
const FONT_REGULAR = path.join(ROOT, "app/fonts/Termina-Regular.otf");
const FONT_BOLD = path.join(ROOT, "app/fonts/Termina-Bold.otf");
// Cut from the Figma design: outlined logo, four-point star and the "Iki susitikimo Marse." banner with the night photo.
const LOGO = path.join(ROOT, "public/brand/voucher/logo.png");
const STAR = path.join(ROOT, "public/brand/voucher/star.png");
const BANNER = path.join(ROOT, "public/brand/voucher/banner.jpg");

/**
 * The coupon as a one-page A4 PDF, laid out like the Figma design: white page with a thin aubergine frame, outlined logo and
 * "Dovanų kuponas" title on top, a star mark, the gift details, the coral code between dashed lines, rules, and the
 * dark "Iki susitikimo Marse." banner across the bottom.
 */
export function buildCouponPdf(c: CouponPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Vanduo Marse kuponas ${formatCode(c.code)}`, Author: "Vanduo Marse" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("Regular", FONT_REGULAR);
    doc.registerFont("Bold", FONT_BOLD);

    const FX = 27.7; // frame
    const FY = 26.7;
    const FW = 539.5;
    const FH = 761.5;
    const L = 53; // content left
    const R = FX + FW - 23; // content right
    const inner = R - L;

    doc.lineWidth(0.8).strokeColor(INK).rect(FX, FY, FW, FH).stroke();

    // Header: logo left, title right, star below it.
    doc.image(LOGO, 43, 33, { width: 143 });
    const title = "Dovanų kuponas";
    doc.font("Bold").fontSize(20);
    const titleSize = (20 * 244) / doc.widthOfString(title);
    doc.fontSize(titleSize).fillColor(INK).text(title, L, 50, { width: inner, align: "right", lineBreak: false });
    doc.image(STAR, 452, 94, { width: 96 });

    const label = (text: string, x: number, top: number, width = inner) => doc.font("Regular").fontSize(7.5).fillColor(COPY).text(text.toUpperCase(), x, top, { width, characterSpacing: 0.8 });

    let y = 131;
    label(c.recipientName ? `Dovana: ${c.recipientName}` : "Dovana", L, y, 330);
    y += 14;
    doc.font("Bold").fontSize(17).fillColor(INK).text(c.productName.toUpperCase(), L, y, { width: 380 });
    y = doc.y + 6;
    doc.font("Bold").fontSize(28).fillColor(INK).text(formatEuro(c.faceValue), L, y, { width: 380 });
    y = doc.y + 4;
    if (c.buyerName) {
      doc.font("Regular").fontSize(9.5).fillColor(COPY).text(`Dovanoja: ${c.buyerName}`, L, y, { width: 380 });
      y = doc.y + 6;
    }

    if (c.message) {
      y += 14;
      const start = y;
      doc.font("Regular").fontSize(11).fillColor(INK).text(c.message, L + 15, y + 3, { width: 360 });
      doc.rect(L, start, 3, Math.max(doc.y - start + 3, 20)).fill(CORAL);
      y = doc.y + 8;
    }

    // Code between two dashed lines.
    y = Math.max(y + 18, 285);
    doc.lineWidth(0.7).strokeColor(INK).dash(2.5, { space: 2.5 }).moveTo(L, y).lineTo(R, y).stroke();
    label("Kupono kodas", L, y + 17);
    doc.font("Bold").fontSize(27).fillColor(CORAL_INK).text(formatCode(c.code), L, y + 31, { width: inner });
    const afterCode = doc.y + 14;
    doc.moveTo(L, afterCode).lineTo(R, afterCode).stroke().undash();
    y = afterCode + 22;

    // Details in three columns.
    const colW = inner / 3;
    const details: [string, string][] = [
      ["Galioja iki", formatExpiry(c.expiresAt)],
      ["Tinka", COUPON_SERVICE_LABEL[c.service]],
      ["Užsakymo nr.", c.reference ?? ""],
    ];
    details.forEach(([k, v], i) => {
      const x = L + i * colW;
      label(k, x, y, colW - 8);
      doc.font("Bold").fontSize(9.5).fillColor(INK).text(v, x, y + 13, { width: colW - 8 });
    });
    y += 58;

    // How to use.
    label(COUPON_RULES_TITLE, L, y);
    y += 20;
    COUPON_RULES.forEach((step, i) => {
      doc.font("Bold").fontSize(10).fillColor(CORAL_INK).text(String(i + 1), L, y, { width: 14 });
      doc.font("Regular").fontSize(10).fillColor(INK).text(step, L + 20, y, { width: inner - 20 });
      y = doc.y + 8;
    });

    // Banner across the bottom of the frame.
    doc.image(BANNER, FX, FY + FH - 145.6, { width: FW });
    doc.lineWidth(0.8).strokeColor(INK).rect(FX, FY, FW, FH).stroke();

    doc.end();
  });
}
