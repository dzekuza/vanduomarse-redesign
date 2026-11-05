/** Park contact details, shared by the top bar, footer and "Kaip mus rasti". */

export interface Contact {
  name: string;
  email: string;
  phone: string;
  href?: string;
}

export const CONTACTS: Contact[] = [
  { name: "Vanduo Marse", email: "info@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Pirtis Marse", email: "pirtis@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Miegas Marse", email: "miegas@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Skoniai Marse", email: "restoranas@vanduomarse.lt", phone: "+370 630 01 390" },
  { name: "Marso Akademija", email: "info@vanduomarse.lt", phone: "+370 630 80 444" },
  { name: "Boardsports Shop", email: "hello@boardsports.lt", phone: "+370 695 55555", href: "https://boards.lt" },
];

/**
 * Staff inboxes for new-booking emails, per service. Services not listed here
 * (event registrations, calculator inquiries) go to STAFF_NOTIFY_EMAIL when set.
 */
export type NotifyService = "pirtis" | "keturraciai" | "nakvyne" | "kita";

export const STAFF_INBOX: Partial<Record<NotifyService, string>> = {
  pirtis: "renginiai@vanduomarse.lt",
  keturraciai: "renginiai@vanduomarse.lt",
  nakvyne: "miegas@vanduomarse.lt",
};

/** The service a reference belongs to: MM- stays, PM- sauna, KT-/KZ- quads, PR- tickets (paid ones are sauna programs). */
export function serviceOfReference(reference: string): NotifyService {
  if (reference.startsWith("MM-")) return "nakvyne";
  if (reference.startsWith("KT-") || reference.startsWith("KZ-")) return "keturraciai";
  if (reference.startsWith("PM-") || reference.startsWith("PR-")) return "pirtis";
  return "kita";
}

/** The park's main line, shown in the top bar. */
export const MAIN_CONTACT = CONTACTS[0];

export const MAPS_URL = "https://goo.gl/maps/dZJ74iwj3UiChd5FA";

/** "+370 630 80 444" → "tel:+37063080444". */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
