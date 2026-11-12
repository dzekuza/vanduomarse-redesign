import "server-only";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Releasing an unpaid payment (ADR-0077): the visitor came back from Stripe Checkout unpaid, or cancelled it
 * from /paskyra. A time is held only while a payment can still happen, so the slots are freed at once, but only
 * after the Checkout Session can no longer be paid.
 */

/** Whether the signed-in customer is the payment's owner (its `user_id`), not merely able to read it. */
export async function ownsPayment(paymentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data } = await supabase.from("payments").select("user_id").eq("id", paymentId).maybeSingle();
  return data?.user_id === auth.user.id;
}

/**
 * Makes sure a Checkout Session can no longer be paid: "expired" (now or already) or "paid". Throws when it
 * could not be confirmed either way (a transient Stripe error, or the session is still open), so the caller
 * leaves the release to the `checkout.session.expired` webhook and the cron instead of freeing a payable slot.
 */
export async function closeCheckoutSession(sessionId: string): Promise<"expired" | "paid"> {
  const stripe = getStripe();
  try {
    await stripe.checkout.sessions.expire(sessionId);
    return "expired";
  } catch {
    // Expiring fails when the session is already paid or already expired; anything else is unconfirmed.
    const { status } = await stripe.checkout.sessions.retrieve(sessionId);
    if (status === "complete") return "paid";
    if (status === "expired") return "expired";
    throw new Error(`Checkout session ${sessionId} is still open`);
  }
}

/**
 * The visitor came back from Stripe Checkout without paying (the "back" link): free the slots now. Only the
 * payment's own signed-in customer can trigger it, so knowing a payment id is not enough. A paid session stops it.
 * Safe to repeat, never throws (the cron and the `checkout.session.expired` webhook are the safety net).
 */
export async function releaseCancelledPayment(paymentId: string): Promise<void> {
  try {
    if (!(await ownsPayment(paymentId))) return;

    const admin = createAdminClient();
    const { data, error } = await admin.rpc("payment_state", { p_payment_id: paymentId });
    const state = data?.[0];
    if (error || !state || state.status !== "laukia") return;

    if (state.stripe_session_id && (await closeCheckoutSession(state.stripe_session_id)) === "paid") return;
    await admin.rpc("abandon_payment", { p_payment_id: paymentId });
  } catch (e) {
    console.error("Payments: could not release a cancelled payment", paymentId, e);
  }
}
