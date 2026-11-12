import { MAIN_CONTACT, SAUNA_CONTACT, type Contact } from "@/lib/contacts";

/** One request of a paid reservation, as the customer's confirmation message lists it (`paid_request_details`). */
export interface PaidRequest {
  reference: string;
  service: "pirtis" | "nakvyne" | "keturraciai" | "renginys";
  /** The sauna, program, stay type, tour or event name. */
  title: string;
  /** yyyy-mm-dd */
  day: string;
  /** "HH:MM", empty for stays. */
  startTime: string;
  endTime: string;
  nights: number | null;
  /** Who booked and what it cost; read for the staff notification only (`paid_staff_details`). */
  staff?: PaidStaffInfo;
}

export interface PaidStaffInfo {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  /** Guests, riders or ticket holders. */
  people: number | null;
  /** Quads or cabin units. */
  units: number | null;
  /** EUR this request cost (after any discount code). */
  total: number;
  discountCode: string | null;
  note: string | null;
}

export const SERVICE_NOUN: Record<PaidRequest["service"], string> = {
  pirtis: "Pirties seansas",
  nakvyne: "Nakvynė",
  keturraciai: "Keturračiai",
  renginys: "Renginys",
};

/** The contact a customer writes to: the sauna's (the events inbox, renginiai@) when the reservation is only sauna, else the main one. */
export const contactFor = (requests: PaidRequest[]): Contact =>
  requests.length > 0 && requests.every((r) => r.service === "pirtis") ? SAUNA_CONTACT : MAIN_CONTACT;

/** "Pirties seansas: Pirties ritualas su pirtininku" or just the noun when the name adds nothing. */
export const requestHeading = (r: PaidRequest) => {
  const noun = SERVICE_NOUN[r.service];
  return r.title && r.title.toLowerCase() !== noun.toLowerCase() ? `${noun}: ${r.title}` : noun;
};

/** "17:00-20:00", "17:00" or "" when the request has no time (a stay). */
export const requestTime = (r: PaidRequest) => (r.startTime ? (r.endTime ? `${r.startTime}-${r.endTime}` : r.startTime) : "");

const money = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/**
 * One request for staff: the heading, date and time, how many people or units, and its price,
 * e.g. "Pirties seansas: Pirties ritualas, 2026-11-15 17:00-20:00, 4 zm., 140 EUR".
 */
export function staffRequestLine(r: PaidRequest): string {
  const time = requestTime(r);
  const parts = [requestHeading(r), `${requestDate(r)}${time ? ` ${time}` : ""}`];
  if (r.staff?.people) parts.push(`${r.staff.people} zm.`);
  if (r.staff?.units && r.service !== "pirtis") parts.push(`${r.staff.units} vnt.`);
  if (r.staff) parts.push(`${money(r.staff.total)} EUR`);
  return parts.join(", ");
}

/** The customer behind a payment: the first request's booking details, else what the payment itself holds. Null when nothing is known. */
export function staffCustomer(requests: PaidRequest[], fallback: { phone?: string | null; email?: string | null }) {
  const info = requests.find((r) => r.staff)?.staff;
  const name = info?.customerName ?? null;
  const phone = info?.customerPhone ?? fallback.phone ?? null;
  const email = info?.customerEmail ?? fallback.email ?? null;
  return name || phone || email ? { name, phone, email } : null;
}

/** Discount codes and notes of the requests, for staff ("Nuolaida: 999"). */
export function staffExtras(requests: PaidRequest[]): { discountCodes: string[]; notes: string[] } {
  const codes = requests.flatMap((r) => (r.staff?.discountCode ? [r.staff.discountCode] : []));
  const notes = requests.flatMap((r) => (r.staff?.note ? [`${r.reference}: ${r.staff.note}`] : []));
  return { discountCodes: [...new Set(codes)], notes };
}

/** "2026-11-15", with the nights of a stay: "2026-11-15, 2 n.". */
export const requestDate = (r: PaidRequest) => (r.nights ? `${r.day}, ${r.nights} n.` : r.day);
