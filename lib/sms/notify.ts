import "server-only";
import { MAIN_CONTACT } from "@/lib/contacts";
import { formatHour } from "@/lib/sauna";
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

/** "Pirtis 2026-11-08 15:00-17:00, 4 zm., 140 EUR": the sauna booking in one line; party and total when known. */
export function saunaSummary(b: { date: string; startHour: number; hours: number; party?: number | null; total?: number | null }): string {
  const parts = [`Pirtis ${b.date} ${formatHour(b.startHour)}-${formatHour(b.startHour + b.hours)}`];
  if (b.party) parts.push(`${b.party} zm.`);
  if (b.total !== null && b.total !== undefined) parts.push(`${Number.isInteger(b.total) ? b.total : b.total.toFixed(2)} EUR`);
  return parts.join(", ");
}

const ref = (reference?: string) => (reference ? ` ${reference}` : "");
const what = (summary?: string) => (summary ? ` (${summary})` : "");

/** Sent right after a visitor submits; the slot is not confirmed yet. */
export const notifyReceived = (phone: string | null | undefined, reference: string | undefined, summary?: string) =>
  sendSms(phone, `Vanduo Marse: gavome jusu uzklausa${ref(reference)}${what(summary)}. Patvirtinsime netrukus.`);

/** The sauna version: a booking with a reference and full details, still waiting for staff to confirm. */
export const notifyBookingReceived = (phone: string | null | undefined, reference: string | undefined, summary: string) =>
  sendSms(phone, `Vanduo Marse: rezervacija${ref(reference)} gauta. ${summary}. Patvirtinsime netrukus.`);

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

const eur = (amount: number) => (Number.isInteger(amount) ? String(amount) : amount.toFixed(2));

/** Sent once Stripe confirms the payment of a reservation; staff still confirm each request. */
export const notifyPaid = (phone: string | null | undefined, references: string[], amount: number) =>
  sendSms(phone, `Vanduo Marse: apmoketa ${eur(amount)} EUR (${references.join(", ")}). Uzklausas patvirtinsime netrukus.`);

/** Heads-up for staff when a reservation is paid; `review` flags a payment that needs a manual look (late or odd amount). */
export const notifyStaffPaid = (references: string[], amount: number, review: boolean) =>
  sendSms(
    process.env.STAFF_NOTIFY_PHONE,
    `${review ? "PATIKRINTI APMOKEJIMA" : "Nauja apmoketa uzklausa"} ${references.join(", ")}: ${eur(amount)} EUR. Zr. /admin`,
  );
