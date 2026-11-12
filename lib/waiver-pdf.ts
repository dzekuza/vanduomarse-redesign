import "server-only";
import path from "node:path";
import PDFDocument from "pdfkit";
import { POOL_RULES_TEXT, POOL_RULES_TITLE, PARK_RULES_TEXT, PARK_RULES_TITLE } from "@/lib/park-rules";

/** What the signed-rules PDF shows besides the rules themselves. */
export interface WaiverPdfData {
  fullName: string;
  /** yyyy-mm-dd, when known. */
  birthdate: string | null;
  email: string | null;
  phone: string | null;
  /** ISO time of the signature. */
  signedAt: string;
  termsVersion: string;
  /** The signature drawn at /registracija (PNG). */
  signature: Buffer;
}

const INK = "#382e38";
const COPY = "#5a4c5a";
const ROOT = process.cwd();
const FONT_REGULAR = path.join(ROOT, "app/fonts/Termina-Regular.otf");
const FONT_BOLD = path.join(ROOT, "app/fonts/Termina-Bold.otf");
const LOGO = path.join(ROOT, "public/brand/voucher/logo.png");

const formatSigned = (iso: string) =>
  new Date(iso).toLocaleString("lt-LT", { timeZone: "Europe/Vilnius", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * The park rules and the pool rules exactly as they were shown at /registracija, with the customer's signature and the
 * signing details below them. Built on demand for staff; the text comes from `lib/park-rules.ts`, so the caller must make sure
 * the signed `termsVersion` is the version in the file (an older signature must not be printed under newer wording).
 */
export function buildWaiverPdf(d: WaiverPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 54, bottom: 60, left: 54, right: 54 },
      bufferPages: true,
      info: { Title: `Pasirašytos taisyklės: ${d.fullName}`, Author: "Vanduo Marse" },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("Regular", FONT_REGULAR);
    doc.registerFont("Bold", FONT_BOLD);

    const W = doc.page.width;
    const L = doc.page.margins.left;
    const width = W - L - doc.page.margins.right;

    // First page header.
    doc.image(LOGO, L - 8, 40, { height: 40 });
    doc.font("Bold").fontSize(14).fillColor(INK).text("Pasirašytos taisyklės", L, 48, { width, align: "right" });
    doc.font("Regular").fontSize(8).fillColor(COPY).text(`Versija ${d.termsVersion}`, L, 66, { width, align: "right" });
    doc.y = 100;
    doc.moveTo(L, doc.y).lineTo(W - L, doc.y).lineWidth(0.8).strokeColor(INK).stroke();
    doc.moveDown(0.8);

    const section = (title: string, body: string) => {
      doc.font("Bold").fontSize(10).fillColor(INK).text(title, L, doc.y, { width });
      doc.moveDown(0.5);
      doc.font("Regular").fontSize(8).fillColor(INK).text(body, L, doc.y, { width, lineGap: 1.6, paragraphGap: 3 });
      doc.moveDown(1.2);
    };
    section(PARK_RULES_TITLE, PARK_RULES_TEXT);
    section(POOL_RULES_TITLE, POOL_RULES_TEXT);

    // Signature block, kept together on one page.
    const BLOCK = 200;
    if (doc.y + BLOCK > doc.page.height - doc.page.margins.bottom) doc.addPage();
    doc.moveDown(0.5);
    doc.moveTo(L, doc.y).lineTo(W - L, doc.y).lineWidth(0.8).strokeColor(INK).stroke();
    doc.moveDown(0.6);
    doc.font("Bold").fontSize(10).fillColor(INK).text("Pasirašė", L, doc.y, { width });
    doc.moveDown(0.4);
    const rows: [string, string][] = [
      ["Vardas, pavardė", d.fullName],
      ...(d.birthdate ? ([["Gimimo data", d.birthdate]] as [string, string][]) : []),
      ...(d.email ? ([["El. paštas", d.email]] as [string, string][]) : []),
      ...(d.phone ? ([["Telefonas", d.phone]] as [string, string][]) : []),
      ["Pasirašyta", formatSigned(d.signedAt)],
      ["Taisyklių versija", d.termsVersion],
    ];
    for (const [k, v] of rows) {
      const y = doc.y;
      doc.font("Regular").fontSize(8).fillColor(COPY).text(k, L, y, { width: 110 });
      doc.font("Bold").fontSize(8.5).fillColor(INK).text(v, L + 120, y, { width: width - 120 });
      doc.moveDown(0.3);
    }
    doc.moveDown(0.6);
    doc.font("Regular").fontSize(8).fillColor(COPY).text("Parašas", L, doc.y, { width });
    const signY = doc.y + 4;
    doc.image(d.signature, L, signY, { fit: [200, 80] });
    doc.moveTo(L, signY + 84).lineTo(L + 220, signY + 84).lineWidth(0.6).strokeColor(INK).stroke();

    // Page numbers: drawn below the bottom margin, so lift the margin while writing them.
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font("Regular").fontSize(7.5).fillColor(COPY).text(`Vanduo Marse · ${i + 1} / ${range.count}`, L, doc.page.height - 36, { width, align: "right", lineBreak: false });
      doc.page.margins.bottom = bottom;
    }
    doc.end();
  });
}
