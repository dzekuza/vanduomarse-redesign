import type { Metadata } from "next";
import { z } from "zod";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { PaymentStatus, type PaymentView } from "@/components/reservation/payment-status";
import { releaseCancelledPayment } from "@/lib/payment-release";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Mokėjimas - Vanduo Marse",
  robots: { index: false },
};

async function loadPayment(raw: string | undefined): Promise<PaymentView | null> {
  const id = z.uuid().safeParse(raw);
  if (!id.success) return null;
  try {
    const admin = createAdminClient();
    const [{ data }, { data: rows }] = await Promise.all([
      admin.rpc("payment_state", { p_payment_id: id.data }),
      admin.rpc("payment_requests", { p_payment_id: id.data }),
    ]);
    const state = data?.[0];
    if (!state) return null;
    // The details are context: a failed read (for example before the migration) still shows the status and references.
    const requests = (rows ?? []).map((r) => ({
      reference: r.reference,
      kind: r.kind as PaymentView["requests"][number]["kind"],
      title: r.title,
      date: r.date,
      startHour: r.start_hour,
      hours: r.hours,
      nights: r.nights,
      units: r.units,
      guests: r.guests,
      startTime: r.start_time,
      total: r.total,
    }));
    return { id: id.data, status: state.status, amount: state.amount, refs: state.refs, needsReview: state.needs_review, requests };
  } catch (e) {
    console.error("Payment page: could not read the payment", e);
    return null;
  }
}

/** Where Stripe sends the visitor back; the webhook, not this page, decides what happened to the payment. */
export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ pid?: string; atsaukta?: string }> }) {
  const { pid, atsaukta } = await searchParams;
  // Back from Stripe without paying: the held slots are freed now, not after the checkout expires.
  const paymentId = z.uuid().safeParse(pid);
  if (atsaukta === "1" && paymentId.success) await releaseCancelledPayment(paymentId.data);
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
