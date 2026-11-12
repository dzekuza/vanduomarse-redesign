import "server-only";
import { getStripe, toCents } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Refunds what one request paid (ADR-0081). The database reserves the amount first (`begin_request_refund`: one refund
 * per request, capped by what is left on the payment), then Stripe refunds it, then the reservation is closed. The
 * `charge.refunded` webhook records it on the payment (`record_refund`), as it does for a refund made in the Dashboard.
 */

export type RefundOutcome = { ok: true; amount: number } | { ok: false; message: string };

const BY_HINT: Record<string, string> = {
  not_paid_online: "Ši užklausa nebuvo apmokėta internetu: grąžinti nėra ko.",
  not_paid: "Mokėjimas neapmokėtas arba jau grąžintas.",
  already_refunded: "Šiai užklausai pinigai jau grąžinti.",
  nothing_to_refund: "Nebėra ko grąžinti: mokėjimas jau grąžintas.",
};

export async function refundRequest(reference: string, staffId: string): Promise<RefundOutcome> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("begin_request_refund", { p_reference: reference, p_staff: staffId });
  const row = data?.[0];
  if (error || !row) {
    if (error && !error.hint) console.error("Refund: begin_request_refund failed", reference, error.message);
    return { ok: false, message: BY_HINT[error?.hint ?? ""] ?? "Nepavyko pradėti grąžinimo. Grąžinkite pinigus Stripe paskyroje." };
  }

  try {
    const refund = await getStripe().refunds.create(
      { payment_intent: row.payment_intent, amount: toCents(row.amount), reason: "requested_by_customer", metadata: { reference } },
      // Stable per request: a retry within 24 h returns the same refund instead of a second one.
      { idempotencyKey: `request-refund-${reference}` },
    );
    await admin.rpc("finish_request_refund", { p_id: row.refund_id, p_stripe_refund_id: refund.id });
    return { ok: true, amount: row.amount };
  } catch (e) {
    console.error("Refund: Stripe refused the refund", reference, e);
    await admin.rpc("fail_request_refund", { p_id: row.refund_id });
    return { ok: false, message: "Stripe negrąžino pinigų. Grąžinkite juos Stripe paskyroje." };
  }
}
