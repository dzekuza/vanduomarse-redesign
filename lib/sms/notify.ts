import "server-only";
import { MAIN_CONTACT } from "@/lib/contacts";
import { sendSms } from "./twilio";

/**
 * Customer and staff SMS texts. ASCII only on purpose: one Lithuanian letter
 * would switch the message to UCS-2 (70 characters per segment instead of 160).
 */

type Outcome = "patvirtinta" | "atsaukta";

/** "Pirtis 2026-10-30 18:00" — what the customer asked for, in a few words. */
export function describeRequest(parts: (string | number | null | undefined)[]): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== "").join(" ");
}

const ref = (reference?: string) => (reference ? ` ${reference}` : "");
const what = (summary?: string) => (summary ? ` (${summary})` : "");

/** Sent right after a visitor submits; the slot is not confirmed yet. */
export const notifyReceived = (phone: string | null | undefined, reference: string | undefined, summary?: string) =>
  sendSms(phone, `Vanduo Marse: gavome jusu uzklausa${ref(reference)}${what(summary)}. Patvirtinsime netrukus.`);

/** Sent when staff confirm or cancel a request made on the website. */
export const notifyOutcome = (phone: string | null | undefined, reference: string, outcome: Outcome, summary?: string) =>
  sendSms(
    phone,
    outcome === "patvirtinta"
      ? `Vanduo Marse: ${reference}${what(summary)} patvirtinta. Iki pasimatymo!`
      : `Vanduo Marse: ${reference}${what(summary)} atsaukta. Klausimai: ${MAIN_CONTACT.phone}`,
  );

/** Heads-up for staff when a request lands; needs STAFF_NOTIFY_PHONE. */
export const notifyStaff = (reference: string | undefined, summary: string) =>
  sendSms(process.env.STAFF_NOTIFY_PHONE, `Nauja uzklausa${ref(reference)}: ${summary}. Zr. /admin`);
