import "server-only";
import type { PaidRequest } from "@/lib/paid-request";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What a paid reservation consists of, for the customer's confirmation message. A failed read gives an empty list
 * (the message then falls back to the references): a notification must never fail the webhook.
 */
export async function loadPaidRequests(paymentId: string): Promise<PaidRequest[]> {
  try {
    const { data, error } = await createAdminClient().rpc("paid_request_details", { p_payment_id: paymentId });
    if (error || !data) {
      console.error("Stripe webhook: paid_request_details failed, the generic message is sent", paymentId);
      return [];
    }
    return data.map((row) => ({
      reference: row.reference,
      service: row.service as PaidRequest["service"],
      title: row.title,
      day: row.day,
      startTime: row.start_time ?? "",
      endTime: row.end_time ?? "",
      nights: row.nights,
    }));
  } catch (e) {
    console.error("Stripe webhook: could not load the paid requests", paymentId, e);
    return [];
  }
}
