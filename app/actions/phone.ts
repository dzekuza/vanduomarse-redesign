"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/app/admin/actions";
import { hashCode, hashIp, MissingVerificationSecretError, newCode, signToken } from "@/lib/phone-verification";
import { phoneCodeSchema, phoneNumberSchema } from "@/lib/phone-schema";
import { sendSms, smsConfigured, smsDestinationAllowed, toE164 } from "@/lib/sms/twilio";
import { createAdminClient, MissingServiceKeyError } from "@/lib/supabase/admin";

/**
 * The phone gate before every public booking: send a one-time SMS code, then
 * swap the typed code for a signed token. Both talk to the database with the
 * service role: the code functions are closed to anon, and get the IP hashed.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

const SETUP = "Patvirtinimas SMS šiuo metu neveikia. Skambinkite mums ir užregistruosime.";

const BY_REASON: Record<string, string> = {
  phone_invalid: "Neteisingas telefono numeris.",
  phone_limit: "Šiam numeriui išsiuntėme per daug kodų. Bandykite vėliau arba skambinkite.",
  ip_limit: "Per daug bandymų iš šio įrenginio. Bandykite vėliau.",
  busy: "Šiuo metu siunčiame per daug kodų. Bandykite po kelių minučių arba skambinkite.",
};

const BY_RESULT: Record<string, string> = {
  invalid: "Neteisingas kodas. Patikrinkite SMS ir bandykite dar kartą.",
  expired: "Kodas nebegalioja. Išsiųskite naują.",
  locked: "Per daug neteisingų bandymų. Išsiųskite naują kodą.",
};

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function setupError(e: unknown) {
  if (e instanceof MissingVerificationSecretError || e instanceof MissingServiceKeyError) {
    console.error(`Phone verification: ${e.message}`);
    return fail(SETUP, "setup");
  }
  throw e;
}

export interface CodeSent {
  phone: string;
  /** Seconds before another code may be sent. */
  resendIn: number;
}

export async function requestPhoneCode(input: z.infer<typeof phoneNumberSchema>): Promise<ActionResult<CodeSent>> {
  const parsed = phoneNumberSchema.safeParse(input);
  const phone = parsed.success ? toE164(parsed.data.phone) : null;
  if (!phone) return fail("Neteisingas telefono numeris.", "invalid");
  if (!smsDestinationAllowed(phone)) return fail("SMS siunčiame tik Lietuvos, Latvijos, Estijos ir Lenkijos numeriams.", "country");
  // Local development without Twilio shows the code in the dev server log instead of sending it.
  const devLog = process.env.NODE_ENV === "development" && !smsConfigured();
  if (!smsConfigured() && !devLog) {
    console.error("Phone verification: Twilio is not configured.");
    return fail(SETUP, "setup");
  }

  try {
    const code = newCode();
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("request_phone_code", {
      p_phone: phone,
      p_ip_hash: hashIp(await clientIp()),
      p_code_hash: hashCode(phone, code),
    });
    if (error) return fail("Nepavyko išsiųsti kodo. Bandykite dar kartą.", "db");
    const row = data[0];
    if (row?.reason === "phone_cooldown") {
      return fail(`Naują kodą galėsite išsiųsti po ${row.retry_after} s.`, "cooldown");
    }
    if (row?.reason) return fail(BY_REASON[row.reason] ?? BY_REASON.busy, row.reason);

    if (devLog) {
      console.info(`[dev] Phone verification code: ${code}`);
    } else if (!(await sendSms(phone, `Vanduo Marse patvirtinimo kodas: ${code}. Galioja 10 min.`))) {
      return fail("Nepavyko išsiųsti SMS. Patikrinkite numerį arba bandykite vėliau.", "sms");
    }
    return { data: { phone, resendIn: 60 } };
  } catch (e) {
    return setupError(e);
  }
}

export interface PhoneVerified {
  phone: string;
  token: string;
  expiresAt: number;
}

export async function confirmPhoneCode(input: z.infer<typeof phoneCodeSchema>): Promise<ActionResult<PhoneVerified>> {
  const parsed = phoneCodeSchema.safeParse(input);
  const phone = parsed.success ? toE164(parsed.data.phone) : null;
  if (!parsed.success || !phone) return fail("Įveskite 6 skaitmenų kodą.", "invalid");

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("verify_phone_code", { p_phone: phone, p_code_hash: hashCode(phone, parsed.data.code) });
    if (error) return fail("Nepavyko patikrinti kodo. Bandykite dar kartą.", "db");
    if (data !== "ok") return fail(BY_RESULT[data] ?? BY_RESULT.invalid, data);
    return { data: { phone, ...signToken(phone) } };
  } catch (e) {
    return setupError(e);
  }
}
