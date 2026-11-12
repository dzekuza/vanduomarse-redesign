/** Park contact details, shared by the top bar, footer and "Kaip mus rasti". */

export interface Contact {
  name: string;
  email: string;
  phone: string;
}

/** The park's main line, shown in the top bar. */
export const MAIN_CONTACT: Contact = { name: "Vanduo Marse", email: "info@vanduomarse.lt", phone: "+370 630 80 444" };
/** The events inbox: sauna and quad bookings are handled there (also the staff inbox, see `STAFF_INBOX`). */
export const EVENTS_EMAIL = "renginiai@vanduomarse.lt";
/** The sauna's contact: customers write to the events inbox, not to a separate pirtis@ address. */
export const SAUNA_CONTACT: Contact = { name: "Pirtis Marse", email: EVENTS_EMAIL, phone: "+370 630 80 444" };

const RESTAURANT_CONTACT: Contact = { name: "Skoniai Marse", email: "restoranas@vanduomarse.lt", phone: "+370 630 01 390" };
export const ACADEMY_CONTACT: Contact = { name: "Marso Akademija", email: MAIN_CONTACT.email, phone: MAIN_CONTACT.phone };

export const CONTACTS: Contact[] = [
  MAIN_CONTACT,
  SAUNA_CONTACT,
  RESTAURANT_CONTACT,
  ACADEMY_CONTACT,
];

/** The footer's contact list, in display order. */
export const FOOTER_CONTACTS: Contact[] = [
  { name: "Vanduo Marse ir renginiai", email: EVENTS_EMAIL, phone: "+370 640 57 504" },
  { name: "Marso Akademija", email: EVENTS_EMAIL, phone: "+370 640 57 504" },
  { name: "Pirtis Marse", email: EVENTS_EMAIL, phone: "+370 640 57 504" },
  { name: "Partneriai", email: "info@vanduomarse.lt", phone: "+370 672 21 235" },
  { name: "Skoniai Marse", email: "restoranas@vanduomarse.lt", phone: "+370 630 01 390" },
];

/**
 * Staff inboxes for new-booking emails, per service. Services not listed here
 * (event registrations, calculator inquiries) go to STAFF_NOTIFY_EMAIL when set.
 */
export type NotifyService = "pirtis" | "keturraciai" | "nakvyne" | "kita";

export const STAFF_INBOX: Partial<Record<NotifyService, string>> = {
  pirtis: EVENTS_EMAIL,
  keturraciai: EVENTS_EMAIL,
  nakvyne: "miegas@vanduomarse.lt",
};

/** Gets a copy of every staff booking email (new request and paid), whatever the service. */
export const STAFF_BOOKING_COPY = "marketingas@vanduomarse.lt";

/** The service a reference belongs to: MM- stays, PM- sauna, KT-/KZ- quads, PR- tickets (paid ones are sauna programs). */
export function serviceOfReference(reference: string): NotifyService {
  if (reference.startsWith("MM-")) return "nakvyne";
  if (reference.startsWith("KT-") || reference.startsWith("KZ-")) return "keturraciai";
  if (reference.startsWith("PM-") || reference.startsWith("PR-")) return "pirtis";
  return "kita";
}

/** Customer enquiries from the home hero and the reservation summary. */
export const RESERVATION_PHONE = "+370 640 57504";

export const INSTAGRAM_URL = "https://www.instagram.com/vanduo_marse/";

export const MAPS_URL = "https://goo.gl/maps/dZJ74iwj3UiChd5FA";

/** "+370 630 80 444" → "tel:+37063080444". */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
