import type { PaymentInfo } from "@/lib/admin/types";

/**
 * Most a request's cancellation can refund: what it paid (`total`), never more than is left on the Stripe payment.
 * 0 when it was not paid online or the payment is already refunded. The database re-checks (one refund per request).
 */
export function refundableAmount(payment: PaymentInfo | undefined, total: number): number {
  if (!payment || payment.status !== "apmoketa") return 0;
  return Math.max(0, Math.min(total, payment.amount - payment.refunded));
}
