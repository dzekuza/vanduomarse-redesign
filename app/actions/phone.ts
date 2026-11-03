"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/app/admin/actions";
import { hashCode, hashIp, MissingVerificationSecretError, newCode, signToken } from "@/lib/phone-verification";
import { phoneCodeSchema, phoneNumberSchema } from "@/lib/phone-schema";
import { sendSms, smsConfigured, phoneSkipEnabled, smsDestinationAllowed, smsSkippedInDev, toE164 } from "@/lib/sms/twilio";
import { createAdminClient, MissingServiceKeyError } from "@/lib/supabase/admin";

/**
 * The phone gate before every public booking: send a one-time SMS code, then
 * swap the typed code for a signed token. Both talk to the database with the
 * service role: the code functions are closed to anon, and get the IP hashed.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

/** The code used (and returned to the form) by `next dev` when SMS is skipped; never reachable in production. */
const DEV_CODE = "000000";

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

/**
 * Vercel's edge overwrites x-real-ip and x-forwarded-for with the connecting
 * client, so neither can be spoofed there. Behind another proxy, revisit this:
 * a client-set header would let one sender dodge the per-IP cap.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
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
  /** Only in `next dev` without Twilio: the code itself, so the form can confirm it without an SMS. */
  devCode?: string;
}

export async function requestPhoneCode(input: z.infer<typeof phoneNumberSchema>): Promise<ActionResult<CodeSent>> {
  const parsed = phoneNumberSchema.safeParse(input);
  const phone = parsed.success ? toE164(parsed.data.phone) : null;
  if (!phone) return fail("Neteisingas telefono numeris.", "invalid");
  if (!smsDestinationAllowed(phone)) return fail("SMS siunčiame tik Lietuvos, Latvijos, Estijos ir Lenkijos numeriams.", "country");
  // `next dev` sends no SMS: the code goes to the dev server log and back to the form, which confirms
  // it by itself (SMS_IN_DEV=1 turns real SMS back on). NODE_ENV is "production" in every build.
  const devLog = smsSkippedInDev();
  if (!smsConfigured() && !devLog) {
    console.error("Phone verification: Twilio is not configured.");
    return fail(SETUP, "setup");
  }

  try {
    // Dev codes are fixed, so a previous dev code (and its 60 s cooldown) can be dropped before sending again.
    const code = devLog ? DEV_CODE : newCode();
    const supabase = createAdminClient();
    const codeHash = hashCode(phone, code);
    if (devLog) await supabase.rpc("cancel_phone_code", { p_phone: phone, p_code_hash: codeHash });
    const { data, error } = await supabase.rpc("request_phone_code", {
      p_phone: phone,
      p_ip_hash: hashIp(await clientIp()),
      p_code_hash: codeHash,
    });
    if (error) return fail("Nepavyko išsiųsti kodo. Bandykite dar kartą.", "db");
    const row = data[0];
    // In dev the database's send limits (cooldown, per phone/IP caps) must not block testing:
    // the fixed dev code is accepted by `confirmPhoneCode` even when no code was stored.
    if (row?.reason && devLog) {
      console.info(`[dev] Phone code limit hit (${row.reason}): the dev code ${DEV_CODE} still verifies locally.`);
    } else if (row?.reason === "phone_cooldown") {
      return fail(`Naują kodą galėsite išsiųsti po ${row.retry_after} s.`, "cooldown");
    } else if (row?.reason) {
      return fail(BY_REASON[row.reason] ?? BY_REASON.busy, row.reason);
    }

    if (devLog) {
      console.info(`[dev] Phone verification code: ${code}`);
    } else if (!(await sendSms(phone, `Vanduo Marse patvirtinimo kodas: ${code}. Galioja 10 min.`))) {
      // Nothing was sent: drop the code and its cooldown so the visitor can retry.
      await supabase.rpc("cancel_phone_code", { p_phone: phone, p_code_hash: codeHash });
      return fail("Nepavyko išsiųsti SMS. Patikrinkite numerį arba bandykite vėliau.", "sms");
    }
    return { data: { phone, resendIn: 60, ...(devLog ? { devCode: code } : {}) } };
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
    if (data !== "ok") {
      // Dev only: the fixed dev code verifies even when the database stored no code (send limits).
      // The booking tables still need a verification recorded by the database, so those may refuse.
      if (smsSkippedInDev() && parsed.data.code === DEV_CODE) {
        console.info(`[dev] Phone ${phone} verified locally with the dev code (the database has no code for it).`);
        return { data: { phone, ...signToken(phone) } };
      }
      return fail(BY_RESULT[data] ?? BY_RESULT.invalid, data);
    }
    return { data: { phone, ...signToken(phone) } };
  } catch (e) {
    return setupError(e);
  }
}

/** Whether the "skip phone check" button should show (dev, or PHONE_VERIFICATION_SKIP=1 on the server). */
export async function phoneSkipAvailable(): Promise<boolean> {
  return phoneSkipEnabled();
}

/**
 * Test-only: verify without any code, using the typed number (or a placeholder in `next dev`
 * when it is empty or invalid). Refuses unless `phoneSkipEnabled()`. Outside `next dev` it also
 * records the verification in the database (service role), so the booking triggers accept it.
 */
export async function skipPhoneVerification(typed?: string): Promise<ActionResult<PhoneVerified>> {
  if (!phoneSkipEnabled()) return fail("Praleisti patvirtinimo negalima.", "forbidden");
  try {
    if (smsSkippedInDev()) {
      const phone = toE164(typed) ?? "+37060000000";
      console.info(`[dev] Phone ${phone} verified without a code (skip button).`);
      return { data: { phone, ...signToken(phone) } };
    }
    const phone = toE164(typed);
    if (!phone) return fail("Neteisingas telefono numeris.", "phone_invalid");
    const { error } = await createAdminClient().rpc("record_skipped_phone", { p_phone: phone });
    if (error) return fail("Nepavyko praleisti patvirtinimo.", "db");
    console.warn(`Phone ${phone} verified WITHOUT SMS (PHONE_VERIFICATION_SKIP=1).`);
    return { data: { phone, ...signToken(phone) } };
  } catch (e) {
    return setupError(e);
  }
}
