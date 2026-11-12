import "server-only";
import { MAIN_CONTACT } from "@/lib/contacts";
import { contactFor, requestDate, requestHeading, requestTime, type PaidRequest } from "@/lib/paid-request";
import { formatHour } from "@/lib/sauna";
import type { MessageTopic } from "@/lib/notification-topics";
import { sendStaffSms } from "./staff-recipients";
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

/** Heads-up for staff when a request lands; goes to the numbers subscribed to `topic` (/admin/pranesimai). */
export const notifyStaff = (topic: MessageTopic, reference: string | undefined, summary: string) =>
  sendStaffSms(topic, `Nauja uzklausa${ref(reference)}: ${summary}. Zr. /admin`);

const eur = (amount: number) => (Number.isInteger(amount) ? String(amount) : amount.toFixed(2));

/** Lithuanian letters to ASCII, so the text stays a 160-character GSM message ("Pirties ritualas" stays, "Nakvynė" becomes "Nakvyne"). */
const ascii = (text: string) =>
  text
    .replace(/[ąĄ]/g, (c) => (c === "ą" ? "a" : "A"))
    .replace(/[čČ]/g, (c) => (c === "č" ? "c" : "C"))
    .replace(/[ęĘėĖ]/g, (c) => (c === "ę" || c === "ė" ? "e" : "E"))
    .replace(/[įĮ]/g, (c) => (c === "į" ? "i" : "I"))
    .replace(/[šŠ]/g, (c) => (c === "š" ? "s" : "S"))
    .replace(/[ųŲūŪ]/g, (c) => (c === "ų" || c === "ū" ? "u" : "U"))
    .replace(/[žŽ]/g, (c) => (c === "ž" ? "z" : "Z"))
    .replace(/[„“"]/g, "'")
    .replace(/[–—]/g, "-");

/** The confirmation text of a paid, auto-confirmed reservation: what, when, and who to ask. */
export function paidConfirmationText(requests: PaidRequest[]): string {
  const blocks = requests.map((r) =>
    [requestHeading(r), `Data: ${requestDate(r)}`, ...(requestTime(r) ? [`Laikas: ${requestTime(r)}`] : [])].join("\n"),
  );
  const contact = contactFor(requests);
  return ascii(`Jusu mokejimas gautas. Jusu rezervacija:\n${blocks.join("\n\n")}\n\nTurite klausimu? skambinkite ${contact.phone} arba rasykite ${contact.email}`);
}

/**
 * Sent once Stripe confirms the payment. A paid reservation is confirmed by the database at once (no staff step),
 * so the text lists it. A payment that needs a manual look (`confirmed` false), or details that could not be read,
 * gets the short wording instead.
 */
export const notifyPaid = (phone: string | null | undefined, references: string[], amount: number, requests: PaidRequest[] = [], confirmed = false) =>
  sendSms(
    phone,
    confirmed && requests.length > 0
      ? paidConfirmationText(requests)
      : confirmed
        ? `Vanduo Marse: apmoketa ${eur(amount)} EUR, rezervacija ${references.join(", ")} patvirtinta. Klausimai: ${MAIN_CONTACT.phone}`
        : `Vanduo Marse: apmoketa ${eur(amount)} EUR (${references.join(", ")}). Patikrinsime ir patvirtinsime netrukus.`,
  );

/** A reservation was paid twice (two Checkout Sessions): staff refund the extra payment in Stripe. */
export const notifyStaffDuplicate = (references: string[], amount: number) =>
  sendStaffSms("mokejimai", `DVIGUBAS MOKEJIMAS ${references.join(", ")}: ${eur(amount)} EUR. Grazinkite per Stripe. Zr. /admin`);

/** Heads-up for staff when a reservation is paid; `review` flags a payment that needs a manual look (late or odd amount). */
export const notifyStaffPaid = (references: string[], amount: number, review: boolean) =>
  sendStaffSms(
    "mokejimai",
    `${review ? "PATIKRINTI APMOKEJIMA" : "Apmoketa ir patvirtinta"} ${references.join(", ")}: ${eur(amount)} EUR. Zr. /admin`,
  );
