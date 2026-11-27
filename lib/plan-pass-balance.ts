import "server-only";
import { formatEuro } from "@/lib/coupons";
import { STAFF_LINK_MINUTES } from "@/lib/staff-payment";
import {
  MissingStripeKeyError,
  getStripe,
  paymentsEnabled,
  siteOrigin,
  toCents,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The balance link of a WAKE pass paid in parts (ADR-0139). There is no deadline: staff send it from /admin when they want.
 * The link is a Stripe Checkout Session of about a day, like a staff payment link (ADR-0112): the pass's own open session is
 * reused, an expired one is replaced. Its metadata (`plan_pass_part: "likutis"`) makes the webhook record it as the balance,
 * which issues the code. Staff permission is checked by the caller.
 */

/** Tags our Checkout Sessions in the Stripe Dashboard (the same as the pass checkout). */
const INTEGRATION_ID = "vanduomarse-plan-pass-w3n8cz5d";

/** Session metadata value the webhook routes on. */
export const BALANCE_PART = "likutis";

export interface PassBalanceToPay {
  id: string;
  reference: string;
  planName: string;
  gift: boolean;
  buyerEmail: string;
  /** The stored balance, never a client number. */
  balance: number;
  /** The session made for it last time, if any. */
  balanceSessionId: string | null;
}

export type PassBalanceLink =
  | { ok: true; url: string }
  | { ok: false; message: string; code: "setup" | "payment" | "settled" };

const FAILED: PassBalanceLink = {
  ok: false,
  message: "Nepavyko sukurti likučio apmokėjimo nuorodos.",
  code: "payment",
};
const SETUP: PassBalanceLink = {
  ok: false,
  message: "Internetinis apmokėjimas neįjungtas.",
  code: "setup",
};

export async function openPassBalanceCheckout(
  p: PassBalanceToPay,
): Promise<PassBalanceLink> {
  if (!paymentsEnabled()) return SETUP;
  try {
    const stripe = getStripe();
    // An earlier link is reused while it is open; a paid one stops here (the webhook is on its way); an expired one is replaced.
    if (p.balanceSessionId) {
      const existing = await stripe.checkout.sessions.retrieve(
        p.balanceSessionId,
      );
      if (existing.status === "open" && existing.url)
        return { ok: true, url: existing.url };
      if (existing.status === "complete")
        return {
          ok: false,
          message: "Likutis jau apmokėtas. Atnaujinkite puslapį.",
          code: "settled",
        };
    }

    const origin = await siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: toCents(p.balance),
            product_data: {
              name: `${p.planName}${p.gift ? " (dovana)" : ""} · likutis (50 %) · ${p.reference}`,
            },
          },
        },
      ],
      customer_email: p.buyerEmail,
      client_reference_id: p.id,
      metadata: {
        plan_pass_id: p.id,
        plan_pass_reference: p.reference,
        plan_pass_part: BALANCE_PART,
      },
      payment_intent_data: {
        metadata: { plan_pass_id: p.id, plan_pass_part: BALANCE_PART },
        description: `Vanduo Marse abonementas ${p.reference}, likutis (${formatEuro(p.balance)})`,
      },
      success_url: `${origin}/registracija/apmoketa?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/registracija/apmoketa?sid={CHECKOUT_SESSION_ID}&atsaukta=1`,
      expires_at: Math.floor(Date.now() / 1000) + STAFF_LINK_MINUTES * 60,
      locale: "lt",
      integration_identifier: INTEGRATION_ID,
    });
    if (!session.url) throw new Error("Stripe returned no Checkout URL");

    const { error } = await createAdminClient().rpc(
      "attach_plan_pass_balance_session",
      {
        p_pass_id: p.id,
        p_session_id: session.id,
        p_expected_session_id: p.balanceSessionId ?? undefined,
      },
    );
    if (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => null);
      if (error.hint === "pass_not_part_paid")
        return {
          ok: false,
          message: "Abonementas nebelaukia likučio. Atnaujinkite puslapį.",
          code: "settled",
        };
      throw error;
    }
    return { ok: true, url: session.url };
  } catch (e) {
    if (e instanceof MissingStripeKeyError) return SETUP;
    console.error(
      "Plan pass: could not open the balance checkout",
      p.reference,
      e,
    );
    return FAILED;
  }
}
