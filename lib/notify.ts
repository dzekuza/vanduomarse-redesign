import "server-only";
import type { NotifyService } from "@/lib/contacts";
import { staffRequestLine, type PaidRequest } from "@/lib/paid-request";
import {
  emailOutcome,
  emailPaid,
  emailReceived,
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
  notifyStaffDuplicate,
  notifyStaffPaid,
} from "@/lib/sms/notify";
import { sendStaffPush } from "@/lib/push/staff-push";
import { bookingTopics, type PushTopic } from "@/lib/notification-topics";

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

const settle = (...sends: Promise<boolean>[]) => Promise.allSettled(sends).then(() => undefined);

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
  return settle(
    contact.phone
      ? variant === "booking" && reference
        ? notifyBookingReceived(contact.phone, reference, summary)
        : notifyReceived(contact.phone, reference, summary)
      : Promise.resolve(false),
    emailReceived(contact.email, reference, summary),
    notifyStaff(bookingTopics(service), reference, summary),
    emailStaffNew(service, reference, summary),
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
) => settle(notifyOutcome(contact.phone, reference, outcome, summary), emailOutcome(contact.email, reference, outcome, summary));

export const notifyPaymentReceived = (
  contact: CustomerContact,
  references: string[],
  amount: number,
  review: boolean,
  requests: PaidRequest[] = [],
  confirmed = false,
) => {
  return settle(
    notifyPaid(contact.phone, references, amount, requests, confirmed),
    emailPaid(contact.email, references, amount, requests, confirmed),
    notifyStaffPaid(references, amount, review, requests, contact),
    emailStaffPaid(references, amount, review, requests, contact),
    sendStaffPush("mokejimai", {
      title: review ? "Patikrinti apmokėjimą" : "Apmokėta rezervacija",
      // No name, phone or e-mail here: the push passes through a third-party provider and shows on lock screens.
      body: [`${references.join(", ")} · ${Number.isInteger(amount) ? amount : amount.toFixed(2)} €`, ...requests.map(staffRequestLine)].join("\n"),
      data: { references: references.join(",") },
    }),
  );
};

export const notifyDuplicatePayment = (references: string[], amount: number) =>
  settle(
    notifyStaffDuplicate(references, amount),
    emailStaffDuplicate(references, amount),
    sendStaffPush("mokejimai", {
      title: "DVIGUBAS MOKĖJIMAS",
      body: `${references.join(", ")} · ${Number.isInteger(amount) ? amount : amount.toFixed(2)} € (grąžinkite per Stripe)`,
      data: { references: references.join(",") },
    }),
  );
