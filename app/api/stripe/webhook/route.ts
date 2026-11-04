import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/stripe-events";

export const runtime = "nodejs";

/**
 * Stripe webhook: the only thing that marks a reservation paid, expired or refunded. The raw
 * body is verified against the signing secret before anything is read. Register it in Stripe
 * (Developers → Webhooks) for: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired and charge.refunded.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) return new Response("Payments are not configured", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (e) {
    console.error(`Stripe webhook: ${event.type} (${event.id}) failed`, e);
    return new Response("Could not process the event", { status: 500 });
  }
  return Response.json({ received: true });
}
