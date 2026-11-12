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

/** "2026-11-15", with the nights of a stay: "2026-11-15, 2 n.". */
export const requestDate = (r: PaidRequest) => (r.nights ? `${r.day}, ${r.nights} n.` : r.day);
