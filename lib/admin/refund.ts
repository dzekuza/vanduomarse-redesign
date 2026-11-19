import type { PaymentInfo } from "@/lib/admin/types";
import { cashShare } from "@/lib/points";

/**
 * Most a request's cancellation can refund: what it paid in cash (`total`, less its share paid with points), never more than is left on the Stripe payment.
 * 0 when it was not paid online or the payment is already refunded. The database re-checks (one refund per request).
 */
export function refundableAmount(payment: PaymentInfo | undefined, total: number): number {
  if (!payment || payment.status !== "apmoketa") return 0;
  return Math.max(0, Math.min(cashShare(total, payment), payment.amount - payment.refunded));
}
