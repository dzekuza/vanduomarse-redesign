import "server-only";
import type Stripe from "stripe";
import { getStripe, toCents } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Refunds what one request paid (ADR-0081), following Stripe's guidance on idempotency and unknown outcomes
 * (https://docs.stripe.com/error-low-level):
 *
 * - The database reserves the amount first (`begin_request_refund`, one per request, capped by what is left on the
 *   payment). A reservation is only released when Stripe CLEARLY refused (a 4xx content error, or a refund that came back
 *   failed / canceled). A timeout, a connection error, a 5xx or a 409/429 leaves it pending: the outcome is unknown.
 * - The Stripe call uses a key that is stable per request with fixed parameters, so retrying within 24 hours returns the
 *   same refund. Stripe also replays a saved error for that key, so an unknown outcome is reconciled instead: the
 *   payment's refunds are listed and matched on `metadata.reference`.
 * - A pending reservation is picked up again on the next attempt (`resumed`): reconcile first, create only if nothing
 *   is found and the key is still within its 24-hour window, never after that.
 * The `charge.refunded` webhook records the refund on the payment, as it does for a refund made in the Dashboard.
 */

export type RefundOutcome = { ok: true; amount: number } | { ok: false; message: string };
export type RefundKind = "booking" | "rental" | "ticket";

const BY_HINT: Record<string, string> = {
  not_paid_online: "Ši užklausa nebuvo apmokėta internetu: grąžinti nėra ko.",
  not_paid: "Mokėjimas neapmokėtas arba jau grąžintas.",
  already_refunded: "Šiai užklausai pinigai jau grąžinti.",
  nothing_to_refund: "Nebėra ko grąžinti: mokėjimas jau grąžintas.",
};

const UNKNOWN =
  "Nepavyko patvirtinti grąžinimo Stripe. Pinigai galėjo būti grąžinti: nekartokite Stripe paskyroje. Bandykite dar kartą po kelių minučių, sistema pirma patikrins Stripe.";
const STALE = "Grąžinimo būklė nežinoma ir praėjo daugiau nei 24 val. Patikrinkite Stripe paskyroje (nekartokite), prireikus kreipkitės į Stripe pagalbą.";
const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** A 4xx content error that Stripe answered for this request: it did not refund, and retrying changes nothing. 409 and 429 are not final. */
const isDefiniteRefusal = (e: unknown) => {
  const status = typeof e === "object" && e !== null && "statusCode" in e ? Number((e as { statusCode: unknown }).statusCode) : 0;
  return status >= 400 && status < 500 && status !== 409 && status !== 429;
};

/** The refund Stripe holds for this request, found by the metadata we attached (list refunds has no metadata filter). */
async function findRefund(stripe: Stripe, paymentIntent: string, reference: string): Promise<Stripe.Refund | null> {
  for await (const refund of stripe.refunds.list({ payment_intent: paymentIntent, limit: 100 })) {
    if (refund.metadata?.reference === reference) return refund;
  }
  return null;
}

export async function refundRequest(kind: RefundKind, id: string, staffId: string): Promise<RefundOutcome> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("begin_request_refund", { p_kind: kind, p_id: id, p_staff: staffId });
  const row = data?.[0];
  if (error || !row) {
    if (error && !error.hint) console.error("Refund: begin_request_refund failed", kind, id, error.message);
    return { ok: false, message: BY_HINT[error?.hint ?? ""] ?? "Nepavyko pradėti grąžinimo. Grąžinkite pinigus Stripe paskyroje." };
  }
  const stripe = getStripe();
  const { reference, amount, refund_id: reservation } = row;

  /** The reservation follows what Stripe holds: money moving keeps it (done), a failed or canceled refund releases it. */
  const settle = async (refund: Stripe.Refund): Promise<RefundOutcome> => {
    if (refund.status === "failed" || refund.status === "canceled") {
      await admin.rpc("fail_request_refund", { p_id: reservation });
      return { ok: false, message: `Stripe pranešė, kad grąžinimas nepavyko${refund.failure_reason ? ` (${refund.failure_reason})` : ""}. Grąžinkite pinigus Stripe paskyroje.` };
    }
    const { error: finishError } = await admin.rpc("finish_request_refund", { p_id: reservation, p_stripe_refund_id: refund.id });
    // The refund exists at Stripe either way; an unfinished reservation is reconciled by the next attempt.
    if (finishError) console.error("Refund: could not record the finished refund", reference, refund.id, finishError.message);
    return { ok: true, amount };
  };

  try {
    // An earlier attempt left a reservation: its outcome is unknown, so look at Stripe before doing anything.
    if (row.resumed) {
      const existing = await findRefund(stripe, row.payment_intent, reference);
      if (existing) return settle(existing);
      if (Date.now() - new Date(row.created_at).getTime() > IDEMPOTENCY_WINDOW_MS) return { ok: false, message: STALE };
    }

    const refund = await stripe.refunds.create(
      { payment_intent: row.payment_intent, amount: toCents(amount), reason: "requested_by_customer", metadata: { reference } },
      { idempotencyKey: `request-refund-${reference}` },
    );
    return settle(refund);
  } catch (e) {
    if (isDefiniteRefusal(e)) {
      console.error("Refund: Stripe refused the refund", reference, e);
      await admin.rpc("fail_request_refund", { p_id: reservation });
      return { ok: false, message: "Stripe atsisakė grąžinti pinigų. Grąžinkite juos Stripe paskyroje." };
    }
    // Unknown outcome (network, timeout, 5xx, 409, 429): keep the reservation and see whether the refund exists.
    console.error("Refund: unknown outcome from Stripe", reference, e);
    try {
      const existing = await findRefund(stripe, row.payment_intent, reference);
      if (existing) return settle(existing);
    } catch (lookupError) {
      console.error("Refund: could not reconcile with Stripe", reference, lookupError);
    }
    return { ok: false, message: UNKNOWN };
  }
}
