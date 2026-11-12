import type { Metadata } from "next";
import { BookingHeader } from "@/components/booking/booking-header";
import { BookingPage } from "@/components/booking/booking-page";
import { PlanPaymentStatus, type PlanPaymentView } from "@/components/registration/plan-payment-status";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Plano apmokėjimas - Vanduo Marse",
  robots: { index: false },
};

async function loadOrder(sessionId: string | undefined): Promise<PlanPaymentView | null> {
  if (!sessionId || !/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) return null;
  try {
    const { data } = await createAdminClient().rpc("plan_order_state", { p_session_id: sessionId });
    const row = data?.[0];
    if (!row) return null;
    return { status: row.status, reference: row.reference, planName: row.plan_name, amount: row.price, hasEmail: row.rider_email !== "" };
  } catch (e) {
    console.error("Plan payment page: could not read the order", e);
    return null;
  }
}

/** Where Stripe sends a plan buyer back; the webhook, not this page, attaches the plan. */
export default async function PlanPaymentPage({ searchParams }: { searchParams: Promise<{ sid?: string; atsaukta?: string }> }) {
  const { sid, atsaukta } = await searchParams;
  const order = await loadOrder(sid);

  return (
    <BookingPage>
      <div className="theme-reservation space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
        <BookingHeader crumb="Plano apmokėjimas" title={["Plano", "apmokėjimas"]} />
        <PlanPaymentStatus order={order} cancelled={Boolean(atsaukta)} />
      </div>
    </BookingPage>
  );
}
