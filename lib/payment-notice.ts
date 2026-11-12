import "server-only";
import type { PaidRequest, PaidStaffInfo } from "@/lib/paid-request";
import { createAdminClient } from "@/lib/supabase/admin";

/** Who booked each request and what it cost, by reference. A failed read leaves the staff message without those lines. */
async function loadStaffDetails(paymentId: string): Promise<Map<string, PaidStaffInfo>> {
  const out = new Map<string, PaidStaffInfo>();
  const { data, error } = await createAdminClient().rpc("paid_staff_details", { p_payment_id: paymentId });
  if (error || !data) {
    console.error("Stripe webhook: paid_staff_details failed, the staff message has no customer lines", paymentId);
    return out;
  }
  for (const row of data) {
    out.set(row.reference, {
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      people: row.people,
      units: row.units,
      total: Number(row.total),
      discountCode: row.discount_code,
      note: row.note,
    });
  }
  return out;
}

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
    const staff = await loadStaffDetails(paymentId);
    return data.map((row) => ({
      staff: staff.get(row.reference),
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
