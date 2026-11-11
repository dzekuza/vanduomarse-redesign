"use server";

import type { AuthError } from "@supabase/supabase-js";
import type { ActionResult } from "@/app/admin/actions";
import { getCustomer, toCustomer } from "@/lib/customer";
import type { Customer } from "@/lib/customer-types";
import { customerNameSchema, loginCodeSchema, loginTargetSchema, type LoginTarget } from "@/lib/customer-schema";
import { smsDestinationAllowed, toE164 } from "@/lib/sms/twilio";
import { createClient } from "@/lib/supabase/server";

/**
 * Customer sign-in for the reservation page: a one-time code to a phone or an email, through
 * Supabase Auth (it creates the account the first time and signs in an existing one). The session
 * lives in the Supabase cookie, set by these actions; nothing here returns a token. Supabase
 * applies its own send limits per address and per IP; the destination check below keeps SMS to
 * the same Baltic and Polish prefixes as before so a script cannot make us pay for far-off numbers.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

const GENERIC = "Nepavyko. Bandykite dar kartą arba skambinkite.";

function authFailure(e: AuthError, fallback: string) {
  if (e.status === 429 || /rate_limit/.test(e.code ?? "")) return fail("Per daug bandymų. Palaukite minutę ir bandykite dar kartą.", "rate_limit");
  if (e.code === "sms_send_failed") return fail("Nepavyko išsiųsti SMS. Pabandykite el. paštą arba skambinkite.", "sms_failed");
  if (e.code === "otp_expired") return fail("Kodas nebegalioja. Išsiųskite naują.", "expired");
  if (e.code === "otp_disabled" || e.code === "phone_provider_disabled") return fail("Šis prisijungimo būdas šiuo metu neveikia. Pabandykite kitą.", "disabled");
  if (e.status === 400 || e.status === 422) return fail(fallback, "invalid");
  console.error("Customer auth failed:", e.code, e.status);
  return fail(GENERIC, "auth");
}

export interface CodeSent {
  channel: LoginTarget["channel"];
  /** The normalised phone (E.164) or the email, to show and to verify against. */
  value: string;
  /** Seconds before another code may be asked for. */
  resendIn: number;
}

export async function sendLoginCode(input: unknown): Promise<ActionResult<CodeSent>> {
  const parsed = loginTargetSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Patikrinkite duomenis.", "invalid");
  const target = parsed.data;

  const supabase = await createClient();
  if (target.channel === "phone") {
    const phone = toE164(target.value);
    if (!phone) return fail("Neteisingas telefono numeris.", "invalid");
    if (!smsDestinationAllowed(phone)) return fail("SMS šiai šaliai nesiunčiame. Prisijunkite el. paštu.", "destination");
    const { error } = await supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true, channel: "sms" } });
    if (error) return authFailure(error, "Neteisingas telefono numeris.");
    return { data: { channel: "phone", value: phone, resendIn: 60 } };
  }

  const email = target.value.toLowerCase();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return authFailure(error, "Neteisingas el. paštas.");
  return { data: { channel: "email", value: email, resendIn: 60 } };
}

export async function confirmLoginCode(input: unknown): Promise<ActionResult<Customer>> {
  const target = loginTargetSchema.safeParse(input);
  const code = loginCodeSchema.safeParse((input as { code?: unknown } | null)?.code);
  if (!target.success || !code.success) return fail("Įveskite kodą iš žinutės.", "invalid");

  const supabase = await createClient();
  const { data, error } =
    target.data.channel === "phone"
      ? await supabase.auth.verifyOtp({ phone: target.data.value, token: code.data, type: "sms" })
      : await supabase.auth.verifyOtp({ email: target.data.value.toLowerCase(), token: code.data, type: "email" });
  if (error) return authFailure(error, "Neteisingas kodas. Patikrinkite žinutę ir bandykite dar kartą.");

  const customer = data.user ? toCustomer(data.user) : null;
  if (!customer) return fail(GENERIC, "auth");
  return { data: customer };
}

/** The signed-in customer (or null), for forms on pages that are not rendered per request, such as the home page drawer. */
export async function loadCurrentCustomer(): Promise<Customer | null> {
  return getCustomer();
}

/** Remembers the name on the account so the next booking is pre-filled. */
export async function saveCustomerName(input: unknown): Promise<ActionResult<null>> {
  const name = customerNameSchema.safeParse(input);
  if (!name.success) return fail(name.error.issues[0]?.message ?? "Įveskite vardą", "invalid");
  if (!(await getCustomer())) return fail("Prisijunkite, kad tęstumėte.", "unauthorized");
  const { error } = await (await createClient()).auth.updateUser({ data: { full_name: name.data } });
  if (error) return fail(GENERIC, "auth");
  return { data: null };
}

/**
 * Adds a phone to a signed-in account (for example one created with an email): Supabase texts a code to the
 * new number, and the number only counts once `confirmPhoneChange` verifies it. Same destination rules as sign-in.
 */
export async function sendPhoneChangeCode(input: unknown): Promise<ActionResult<CodeSent>> {
  const target = loginTargetSchema.safeParse({ channel: "phone", value: input });
  if (!target.success) return fail(target.error.issues[0]?.message ?? "Neteisingas telefono numeris.", "invalid");
  if (!(await getCustomer())) return fail("Prisijunkite, kad tęstumėte.", "unauthorized");
  const phone = toE164(target.data.value);
  if (!phone) return fail("Neteisingas telefono numeris.", "invalid");
  if (!smsDestinationAllowed(phone)) return fail("SMS šiai šaliai nesiunčiame.", "destination");

  const { error } = await (await createClient()).auth.updateUser({ phone });
  if (error) {
    if (error.code === "phone_exists") return fail("Šis numeris jau naudojamas kitoje paskyroje.", "exists");
    return authFailure(error, "Neteisingas telefono numeris.");
  }
  return { data: { channel: "phone", value: phone, resendIn: 60 } };
}

export async function confirmPhoneChange(input: unknown): Promise<ActionResult<Customer>> {
  const { phone, code } = (input ?? {}) as { phone?: unknown; code?: unknown };
  const parsedCode = loginCodeSchema.safeParse(code);
  const parsedPhone = typeof phone === "string" ? toE164(phone) : null;
  if (!parsedCode.success || !parsedPhone) return fail("Įveskite kodą iš žinutės.", "invalid");
  if (!(await getCustomer())) return fail("Prisijunkite, kad tęstumėte.", "unauthorized");

  const { data, error } = await (await createClient()).auth.verifyOtp({ phone: parsedPhone, token: parsedCode.data, type: "phone_change" });
  if (error) return authFailure(error, "Neteisingas kodas. Patikrinkite žinutę ir bandykite dar kartą.");
  const customer = data.user ? toCustomer(data.user) : null;
  if (!customer) return fail(GENERIC, "auth");
  return { data: customer };
}

export async function signOutCustomer(): Promise<ActionResult<null>> {
  await (await createClient()).auth.signOut();
  return { data: null };
}
