import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCustomer } from "@/lib/customer";
import { verifiedPhone } from "@/lib/phone-verification";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

export interface Requester {
  supabase: SupabaseClient<Database>;
  /** E.164, or null for an account that signed in with email only. */
  phone: string | null;
  email: string | undefined;
  /**
   * The address we may email: only a signed-in account's confirmed email. The anonymous path proves the
   * phone only, so its typed email is filed with the request but never mailed (it could be anyone's).
   */
  notifyEmail: string | null;
}

/**
 * Who a public request is filed for. A signed-in customer (`viaAccount`): their confirmed phone and
 * email from the session, filed with their own session so the database records the account. Anyone
 * else: the SMS-verified phone token, filed anonymously (the stand-alone and embed forms).
 * Null when neither proves who they are.
 */
export async function requester(v: { customerPhone: string; customerEmail: string; verificationToken?: string; viaAccount?: boolean }): Promise<Requester | null> {
  if (v.viaAccount) {
    const customer = await getCustomer();
    if (!customer) return null;
    return { supabase: await createClient(), phone: customer.phone, email: customer.email ?? undefined, notifyEmail: customer.email ?? null };
  }
  const phone = verifiedPhone(v.verificationToken, v.customerPhone);
  if (!phone) return null;
  return { supabase: createPublicClient(), phone, email: v.customerEmail || undefined, notifyEmail: null };
}
