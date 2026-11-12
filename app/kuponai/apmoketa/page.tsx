import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { CouponPaymentStatus, type CouponPaymentView } from "@/components/coupons/coupon-payment-status";
import { SESSION_ID_PATTERN } from "@/lib/coupon-voucher";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Kupono apmokėjimas - Vanduo Marse",
  robots: { index: false },
};

async function loadCoupon(sessionId: string | undefined): Promise<CouponPaymentView | null> {
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) return null;
  try {
    const { data } = await createAdminClient().rpc("coupon_payment_state", { p_session_id: sessionId });
    const row = data?.[0];
    if (!row) return null;
    return {
      status: row.status,
      reference: row.reference,
      productName: row.product_name,
      amount: row.face_value,
      hasRecipient: row.has_recipient,
      code: row.code,
      expiresAt: row.expires_at,
      sessionId,
    };
  } catch (e) {
    console.error("Coupon payment page: could not read the coupon", e);
    return null;
  }
}

/** Where Stripe sends a coupon buyer back; the webhook, not this page, issues the code. */
export default async function CouponPaymentPage({ searchParams }: { searchParams: Promise<{ sid?: string }> }) {
  const { sid } = await searchParams;
  const coupon = await loadCoupon(sid);

  return (
    <BookingPage>
      <div className="theme-reservation space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <BookingHeader crumb="Kupono apmokėjimas" title={["Kupono", "apmokėjimas"]} />
        <CouponPaymentStatus coupon={coupon} />
      </div>
    </BookingPage>
  );
}
