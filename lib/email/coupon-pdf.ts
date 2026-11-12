import "server-only";
import path from "node:path";
import PDFDocument from "pdfkit";
import { MAIN_CONTACT } from "@/lib/contacts";
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

// Brand colours (app/globals.css raw tokens): aubergine, blush paper, coral and its darker text variant.
const INK = "#382e38";
const PAPER = "#fbf3ef";
const CORAL = "#ed5257";
const CORAL_INK = "#a8282d";
const COPY = "#6d6069";

const FONT_REGULAR = path.join(process.cwd(), "app/fonts/Termina-Regular.otf");
const FONT_BOLD = path.join(process.cwd(), "app/fonts/Termina-Bold.otf");
const LOGO = path.join(process.cwd(), "public/brand/logo-email.png");

const STEPS = [
  "Rezervuodami pirtį ar nakvynę svetainėje, laukelyje „Turite dovanų kuponą?“ įveskite kodą.",
  "Arba parodykite šį kuponą (atspausdintą ar telefone) komandai parke.",
  "Kupono vertė sumažina sąskaitą; likutis lieka kuponui iki galiojimo pabaigos.",
];

/** The coupon as a one-page A4 PDF in the brand style: aubergine bands, coral code, blush paper, dashed tear lines. */
export function buildCouponPdf(c: CouponPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Vanduo Marse kuponas ${formatCode(c.code)}`, Author: "Vanduo Marse" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.registerFont("Regular", FONT_REGULAR);
    doc.registerFont("Bold", FONT_BOLD);

    const W = doc.page.width;
    const H = doc.page.height;
    const M = 48;
    const inner = W - M * 2;

    doc.rect(0, 0, W, H).fill(PAPER);

    // Header band with the logo.
    doc.rect(0, 0, W, 96).fill(INK);
    doc.image(LOGO, M, 26, { height: 44 });
    doc.font("Bold").fontSize(8).fillColor(CORAL).text("DOVANŲ KUPONAS", M, 44, { width: inner, align: "right", characterSpacing: 1 });

    let y = 140;
    const label = (text: string, x: number, top: number, width = inner) => doc.font("Regular").fontSize(7.5).fillColor(COPY).text(text.toUpperCase(), x, top, { width, characterSpacing: 1 });

    label(c.recipientName ? `Dovana: ${c.recipientName}` : "Dovana", M, y);
    y += 16;
    doc.font("Bold").fontSize(20).fillColor(INK).text(c.productName.toUpperCase(), M, y, { width: inner });
    y = doc.y + 8;
    doc.font("Bold").fontSize(36).fillColor(INK).text(formatEuro(c.faceValue), M, y, { width: inner });
    y = doc.y + 4;
    if (c.buyerName) {
      doc.font("Regular").fontSize(10).fillColor(COPY).text(`Dovanoja: ${c.buyerName}`, M, y, { width: inner });
      y = doc.y + 6;
    }

    if (c.message) {
      y += 10;
      const start = y;
      doc.font("Regular").fontSize(12).fillColor(INK).text(c.message, M + 14, y, { width: inner - 14 });
      doc.rect(M, start, 3, doc.y - start).fill(CORAL);
      y = doc.y + 8;
    }

    // Code between two dashed tear lines.
    y += 22;
    doc.lineWidth(0.8).strokeColor(INK).dash(3, { space: 3 }).moveTo(M, y).lineTo(W - M, y).stroke();
    label("Kupono kodas", M, y + 16);
    doc.font("Bold").fontSize(32).fillColor(CORAL_INK).text(formatCode(c.code), M, y + 30, { width: inner });
    const afterCode = doc.y + 14;
    doc.moveTo(M, afterCode).lineTo(W - M, afterCode).stroke().undash();
    y = afterCode + 24;

    // Details.
    const colW = inner / 3;
    const details: [string, string][] = [
      ["Galioja iki", formatExpiry(c.expiresAt)],
      ["Tinka", COUPON_SERVICE_LABEL[c.service]],
      ["Užsakymo nr.", c.reference ?? ""],
    ];
    details.forEach(([k, v], i) => {
      const x = M + i * colW;
      label(k, x, y, colW - 10);
      doc.font("Bold").fontSize(10.5).fillColor(INK).text(v, x, y + 14, { width: colW - 10 });
    });
    y += 64;

    // How to use.
    label("Kaip panaudoti", M, y);
    y += 20;
    STEPS.forEach((step, i) => {
      doc.font("Bold").fontSize(10.5).fillColor(CORAL_INK).text(String(i + 1), M, y, { width: 14 });
      doc.font("Regular").fontSize(10.5).fillColor(INK).text(step, M + 22, y, { width: inner - 22 });
      y = doc.y + 8;
    });

    // Footer band.
    doc.rect(0, H - 56, W, 56).fill(INK);
    doc.font("Bold").fontSize(10).fillColor(PAPER).text("vanduomarse.lt", M, H - 33, { width: 150 });
    doc.font("Regular").fontSize(10).fillColor(PAPER).text(`${MAIN_CONTACT.email} · ${MAIN_CONTACT.phone}`, M + 150, H - 33, { width: inner - 150, align: "right" });

    doc.end();
  });
}
