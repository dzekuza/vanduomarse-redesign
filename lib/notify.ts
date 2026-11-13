import "server-only";
import { serviceOfReference, type NotifyService } from "@/lib/contacts";
import { staffRequestLine, type PaidRequest } from "@/lib/paid-request";
import {
  emailOutcome,
  emailPaid,
  emailReceived,
  emailStaffCancelled,
  emailStaffDuplicate,
  emailStaffNew,
  emailStaffPaid,
} from "@/lib/email/notify";
import {
  notifyBookingReceived,
  notifyOutcome,
  notifyPaid,
  notifyReceived,
  notifyStaff,
  notifyStaffCancelled,
  notifyStaffDuplicate,
  notifyStaffPaid,
} from "@/lib/sms/notify";
import { sendStaffPush } from "@/lib/push/staff-push";
import { bookingTopics, type PushTopic } from "@/lib/notification-topics";
import { hrefOfServices, permissionsOfServices, recordStaffNotification } from "@/lib/staff-notifications";

/**
 * One call per event, every channel: SMS (Twilio, `lib/sms/notify.ts`), email (Resend,
 * `lib/email/notify.ts`) and mobile push (`lib/push/staff-push.ts`). Each channel skips
 * itself when it is not configured or the customer gave no phone / email. Never throws;
 * callers run these in `after()` or `allSettled`.
 */

export interface CustomerContact {
  phone?: string | null;
  email?: string | null;
}

/**
 * Waits for every channel of one event. Each channel logs its own refusals (HTTP status, timeout) and returns false; this
 * adds what no channel can see: a channel that rejected outright, and an event that reached nobody at all. Only the event
 * name is logged (no contact details), so the line is safe to ship to Sentry or the log drain.
 */
export async function settle(event: string, ...sends: Promise<boolean>[]): Promise<void> {
  const results = await Promise.allSettled(sends);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`Notify ${event}: channel ${i} threw`, r.reason);
  });
  // `next dev` skips most channels on purpose, so "nobody told" only means something in production.
  if (process.env.NODE_ENV !== "development" && !results.some((r) => r.status === "fulfilled" && r.value)) {
    console.error(`Notify ${event}: no channel delivered`);
  }
}

/**
 * A request was filed. `service` picks the staff inbox (pirtis/keturraciai → renginiai@, nakvyne → miegas@);
 * `booking` uses the sauna SMS wording (full details, reference first).
 */
export const notifyRequestFiled = (
  service: NotifyService,
  contact: CustomerContact,
  reference: string | undefined,
  summary: string,
  variant: "request" | "booking" = "request",
) => {
  // Push has the three broad topics only; SMS and e-mail also route by service (bookingTopics).
  const pushTopic: PushTopic = service === "kita" ? "uzklausos" : "rezervacijos";
  return settle("request-filed",
    contact.phone
      ? variant === "booking" && reference
        ? notifyBookingReceived(contact.phone, reference, summary)
        : notifyReceived(contact.phone, reference, summary)
      : Promise.resolve(false),
    emailReceived(contact.email, reference, summary),
    notifyStaff(bookingTopics(service), reference, summary),
    emailStaffNew(service, reference, summary),
    recordStaffNotification({
      kind: "uzklausa",
      permissions: permissionsOfServices([service]),
      title: reference ? `Nauja užklausa · ${reference}` : "Nauja užklausa",
      body: summary,
      reference,
      href: hrefOfServices([service]),
    }),
    sendStaffPush(pushTopic, {
      title: reference ? `Nauja užklausa · ${reference}` : "Nauja užklausa",
      body: summary,
      data: reference ? { reference } : undefined,
    }),
  );
};

export const notifyRequestOutcome = (
  contact: CustomerContact,
  reference: string,
  outcome: "patvirtinta" | "atsaukta",
  summary: string,
) => settle("request-outcome", notifyOutcome(contact.phone, reference, outcome, summary), emailOutcome(contact.email, reference, outcome, summary));

/**
 * The customer cancelled their own request on /paskyra: they get the usual "atšaukta" message, staff are told who
 * cancelled and what happened to the money (`refund`: "Grąžinta 40 €." or what staff still have to do).
 */
export const notifyCancelledByCustomer = (service: NotifyService, contact: CustomerContact, reference: string, summary: string, refund: string) =>
  settle("cancelled-by-customer",
    notifyOutcome(contact.phone, reference, "atsaukta", summary),
    emailOutcome(contact.email, reference, "atsaukta", summary),
    notifyStaffCancelled(bookingTopics(service), reference, summary, refund),
    emailStaffCancelled(service, reference, summary, refund),
    recordStaffNotification({
      kind: "atsaukta",
      permissions: permissionsOfServices([service]),
      title: `Klientas atšaukė ${reference}`,
      body: `${summary}. ${refund}`,
      reference,
      href: hrefOfServices([service]),
    }),
  );

export const notifyPaymentReceived = (
  contact: CustomerContact,
  references: string[],
  amount: number,
  review: boolean,
  requests: PaidRequest[] = [],
  confirmed = false,
) => {
  return settle("payment-received",
    notifyPaid(contact.phone, references, amount, requests, confirmed),
    emailPaid(contact.email, references, amount, requests, confirmed),
    notifyStaffPaid(references, amount, review, requests, contact),
    emailStaffPaid(references, amount, review, requests, contact),
    recordStaffNotification({
      kind: review ? "mokejimas_patikrinti" : "mokejimas",
      permissions: permissionsOfServices(references.map(serviceOfReference)),
      title: review ? `Patikrinti apmokėjimą · ${references.join(", ")}` : `Apmokėta rezervacija · ${references.join(", ")}`,
      body: [`${Number.isInteger(amount) ? amount : amount.toFixed(2)} €`, ...requests.map(staffRequestLine)].join("\n"),
      reference: references[0],
      href: hrefOfServices(references.map(serviceOfReference)),
    }),
    sendStaffPush("mokejimai", {
      title: review ? "Patikrinti apmokėjimą" : "Apmokėta rezervacija",
      // No name, phone or e-mail here: the push passes through a third-party provider and shows on lock screens.
      body: [`${references.join(", ")} · ${Number.isInteger(amount) ? amount : amount.toFixed(2)} €`, ...requests.map(staffRequestLine)].join("\n"),
      data: { references: references.join(",") },
    }),
  );
};

export const notifyDuplicatePayment = (references: string[], amount: number) =>
  settle("duplicate-payment",
    notifyStaffDuplicate(references, amount),
    emailStaffDuplicate(references, amount),
    recordStaffNotification({
      kind: "dvigubas",
      permissions: permissionsOfServices(references.map(serviceOfReference)),
      title: `Dvigubas mokėjimas · ${references.join(", ")}`,
      body: `${Number.isInteger(amount) ? amount : amount.toFixed(2)} €: grąžinkite papildomą mokėjimą per Stripe.`,
      reference: references[0],
      href: hrefOfServices(references.map(serviceOfReference)),
    }),
    sendStaffPush("mokejimai", {
      title: "DVIGUBAS MOKĖJIMAS",
      body: `${references.join(", ")} · ${Number.isInteger(amount) ? amount : amount.toFixed(2)} € (grąžinkite per Stripe)`,
      data: { references: references.join(",") },
    }),
  );
