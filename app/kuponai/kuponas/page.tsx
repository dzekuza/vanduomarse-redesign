import type { Metadata } from "next";
import Link from "next/link";
import { CouponVoucher } from "@/components/coupons/coupon-voucher";
import { PrintButton } from "@/components/coupons/print-button";
import { MAIN_CONTACT } from "@/lib/contacts";
import { SESSION_ID_PATTERN } from "@/lib/coupon-voucher";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Dovanų kuponas - Vanduo Marse",
  robots: { index: false, follow: false },
};

async function loadVoucher(sessionId: string | undefined) {
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) return null;
  try {
    const { data } = await createAdminClient().rpc("coupon_payment_state", { p_session_id: sessionId });
    const row = data?.[0];
    if (!row || row.status !== "aktyvus" || !row.code || !row.expires_at) return null;
    return {
      code: row.code,
      reference: row.reference,
      productName: row.product_name,
      faceValue: row.face_value,
      service: row.service,
      expiresAt: row.expires_at,
      buyerName: row.buyer_name,
      recipientName: row.recipient_name,
      message: row.message,
    };
  } catch (e) {
    console.error("Coupon voucher: could not read the coupon", e);
    return null;
  }
}

/** The paid coupon as a printable sheet; "Atsisiųsti PDF" opens the print dialog (Save as PDF). */
export default async function CouponVoucherPage({ searchParams }: { searchParams: Promise<{ sid?: string }> }) {
  const { sid } = await searchParams;
  const voucher = await loadVoucher(sid);

  if (!voucher) {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-gutter py-16">
        <h1 className="font-display text-heading font-bold uppercase">Kuponas nerastas</h1>
        <p className="text-copy">Nuoroda neteisinga, kuponas dar neapmokėtas arba atšauktas. Reikia pagalbos? Skambink {MAIN_CONTACT.phone}.</p>
        <Link href="/kuponai" className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold">
          Į kuponus
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-6 px-gutter py-8 print:p-0">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-copy">Spausdinimo lange pasirinkite „Išsaugoti kaip PDF“.</p>
        <PrintButton />
      </div>
      <CouponVoucher voucher={voucher} />
    </main>
  );
}
