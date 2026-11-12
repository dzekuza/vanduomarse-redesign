import "server-only";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * The visitor came back from Stripe Checkout without paying (the "back" link): free the slots at once, so a
 * time is held only while a payment can still happen (ADR-0077). The open Checkout Session is expired first, so
 * it cannot be paid after the slots are released; a session that is already paid stops the release.
 * Only the payment's own signed-in customer can trigger it: ownership is read through their session (row level
 * security on `payments`), so knowing a payment id is not enough.
 * Safe to repeat, never throws (the cron and the `checkout.session.expired` webhook are the safety net).
 */
export async function releaseCancelledPayment(paymentId: string): Promise<void> {
  try {
    const { data: own } = await (await createClient()).from("payments").select("id").eq("id", paymentId).maybeSingle();
    if (!own) return;

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("payment_state", { p_payment_id: paymentId });
    const state = data?.[0];
    if (error || !state || state.status !== "laukia") return;

    if (state.stripe_session_id) {
      const stripe = getStripe();
      const sessionId = state.stripe_session_id;
      // Expiring fails when the session is already paid or already expired: only a paid one must stop here.
      const paid = await stripe.checkout.sessions.expire(sessionId).then(
        () => false,
        async () => (await stripe.checkout.sessions.retrieve(sessionId)).status === "complete",
      );
      if (paid) return;
    }
    await admin.rpc("abandon_payment", { p_payment_id: paymentId });
  } catch (e) {
    console.error("Payments: could not release a cancelled payment", paymentId, e);
  }
}
