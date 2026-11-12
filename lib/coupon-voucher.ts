import "server-only";
import { siteOrigin } from "@/lib/stripe";

/** The Checkout Session id as Stripe issues it; also the key to the buyer's own payment and voucher pages. */
export const SESSION_ID_PATTERN = /^cs_[A-Za-z0-9_]{10,200}$/;

/** Printable voucher page for a paid coupon. The session id is unguessable, like on the payment page. */
export async function voucherUrl(sessionId: string): Promise<string | undefined> {
  try {
    return `${await siteOrigin()}/kuponai/kuponas?sid=${encodeURIComponent(sessionId)}`;
  } catch {
    return undefined;
  }
}
