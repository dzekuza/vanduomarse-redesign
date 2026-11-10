import "server-only";
import type { NotifyService } from "@/lib/contacts";
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

/**
 * One call per event, every channel: SMS (Twilio, `lib/sms/notify.ts`) and email (Resend,
 * `lib/email/notify.ts`). Each channel skips itself when it is not configured or the customer
 * gave no phone / email. Never throws; callers run these in `after()` or `allSettled`.
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
) =>
  settle(
    contact.phone
      ? variant === "booking" && reference
        ? notifyBookingReceived(contact.phone, reference, summary)
        : notifyReceived(contact.phone, reference, summary)
      : Promise.resolve(false),
    emailReceived(contact.email, reference, summary),
    notifyStaff(service === "kita" ? "uzklausos" : "rezervacijos", reference, summary),
    emailStaffNew(service, reference, summary),
  );

export const notifyRequestOutcome = (
  contact: CustomerContact,
  reference: string,
  outcome: "patvirtinta" | "atsaukta",
  summary: string,
) => settle(notifyOutcome(contact.phone, reference, outcome, summary), emailOutcome(contact.email, reference, outcome, summary));

export const notifyPaymentReceived = (contact: CustomerContact, references: string[], amount: number, review: boolean) =>
  settle(
    notifyPaid(contact.phone, references, amount),
    emailPaid(contact.email, references, amount),
    notifyStaffPaid(references, amount, review),
    emailStaffPaid(references, amount, review),
  );

export const notifyDuplicatePayment = (references: string[], amount: number) =>
  settle(notifyStaffDuplicate(references, amount), emailStaffDuplicate(references, amount));
