import "server-only";
import type { User } from "@supabase/supabase-js";
import type { Customer } from "@/lib/customer-types";
import { createClient } from "@/lib/supabase/server";

/**
 * Customer accounts are plain Supabase Auth users signed in with a one-time code sent to their phone
 * or email (no password). A customer is only recognised through a contact they confirmed, and the
 * server reads the session from the cookie on every call, never from anything the browser sends.
 */

export function toCustomer(user: User): Customer | null {
  const digits = (user.phone ?? "").replace(/\D/g, "");
  const phone = digits && user.phone_confirmed_at ? `+${digits}` : null;
  const email = user.email && user.email_confirmed_at ? user.email : null;
  if (!phone && !email) return null;
  const name = user.user_metadata?.full_name;
  return { id: user.id, phone, email, name: typeof name === "string" ? name : "" };
}

/** The signed-in customer, or null. `getUser` asks Supabase Auth to validate the session. */
export async function getCustomer(): Promise<Customer | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? toCustomer(data.user) : null;
}
