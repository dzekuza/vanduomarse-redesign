import type { Metadata } from "next";
import { z } from "zod";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { PaymentStatus, type PaymentView } from "@/components/reservation/payment-status";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Mokėjimas - Vanduo Marse",
  robots: { index: false },
};

async function loadPayment(raw: string | undefined): Promise<PaymentView | null> {
  const id = z.uuid().safeParse(raw);
  if (!id.success) return null;
  try {
    const { data } = await createAdminClient().rpc("payment_state", { p_payment_id: id.data });
    const state = data?.[0];
    if (!state) return null;
    return { id: id.data, status: state.status, amount: state.amount, refs: state.refs, needsReview: state.needs_review };
  } catch (e) {
    console.error("Payment page: could not read the payment", e);
    return null;
  }
}

/** Where Stripe sends the visitor back; the webhook, not this page, decides what happened to the payment. */
export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ pid?: string; atsaukta?: string }> }) {
  const { pid, atsaukta } = await searchParams;
  const payment = await loadPayment(pid);

  return (
    <BookingPage>
      <div className="theme-reservation space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <BookingHeader crumb="Mokėjimas" title={["Mokėjimas"]} />
        <PaymentStatus payment={payment} cancelled={atsaukta === "1"} />
      </div>
    </BookingPage>
  );
}
