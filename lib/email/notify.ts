import "server-only";
import { MAIN_CONTACT, STAFF_BOOKING_COPY, STAFF_INBOX, serviceOfReference, type NotifyService } from "@/lib/contacts";
import { formatEuro } from "@/lib/coupons";
import { emailList, escapeHtml, sendEmail } from "./resend";

/**
 * Customer and staff notification emails, sent next to the SMS in `lib/notify.ts`.
 * Plain text plus a minimal HTML copy; the request summary is the same line the SMS uses.
 */

const siteUrl = () => (process.env.SITE_URL ?? "").replace(/\/$/, "");

const footer = [`Klausimai? ${MAIN_CONTACT.email}, ${MAIN_CONTACT.phone}`, "Vanduo Marse"];

/** Builds the text and HTML bodies from paragraphs; `strong` paragraphs are bold in HTML. */
function body(paragraphs: (string | { strong: string })[], withFooter = true) {
  const all = withFooter ? [...paragraphs, footer.join("\n")] : paragraphs;
  const text = all.map((p) => (typeof p === "string" ? p : p.strong)).join("\n\n");
  const html = all
    .map((p) =>
      typeof p === "string"
        ? `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
        : `<p><strong>${escapeHtml(p.strong)}</strong></p>`,
    )
    .join("\n");
  return { text, html };
}

const accountLink = () => (siteUrl() ? [`Savo rezervacijas matote paskyroje: ${siteUrl()}/paskyra`] : []);

/* ---------------- customer ---------------- */

/** Right after a visitor submits; the slot is not confirmed yet. */
export const emailReceived = (to: string | null | undefined, reference: string | undefined, summary: string) =>
  to
    ? sendEmail({
        to,
        subject: reference ? `Gavome jūsų užklausą ${reference}` : "Gavome jūsų užklausą",
        ...body([
          "Sveiki,",
          `gavome jūsų užklausą${reference ? ` ${reference}` : ""}.`,
          { strong: summary },
          "Ji dar nepatvirtinta: patvirtinsime netrukus ir pranešime atskirai.",
          ...accountLink(),
        ]),
      })
    : Promise.resolve(false);

/** Staff confirmed or cancelled a website request. */
export const emailOutcome = (
  to: string | null | undefined,
  reference: string,
  outcome: "patvirtinta" | "atsaukta",
  summary: string,
) =>
  to
    ? sendEmail({
        to,
        subject: outcome === "patvirtinta" ? `Rezervacija ${reference} patvirtinta` : `Rezervacija ${reference} atšaukta`,
        ...body(
          outcome === "patvirtinta"
            ? ["Sveiki,", `jūsų rezervacija ${reference} patvirtinta.`, { strong: summary }, "Iki pasimatymo Vanduo Marse!", ...accountLink()]
            : ["Sveiki,", `jūsų rezervacija ${reference} atšaukta.`, { strong: summary }, "Jei tai klaida arba norite kito laiko, susisiekite su mumis."],
        ),
      })
    : Promise.resolve(false);

/** Stripe confirmed the payment; staff still confirm each request. */
export const emailPaid = (to: string | null | undefined, references: string[], amount: number) =>
  to
    ? sendEmail({
        to,
        subject: `Apmokėjimas gautas (${references.join(", ")})`,
        ...body([
          "Sveiki,",
          `gavome jūsų apmokėjimą: ${formatEuro(amount)} už ${references.join(", ")}.`,
          "Užklausas patvirtinsime netrukus ir pranešime atskirai.",
          ...accountLink(),
        ]),
      })
    : Promise.resolve(false);

/* ---------------- staff: the service's inbox (STAFF_INBOX), else STAFF_NOTIFY_EMAIL ---------------- */

/**
 * Inboxes for these services; services without one fall back to STAFF_NOTIFY_EMAIL (comma-separated).
 * Booking emails also go to STAFF_BOOKING_COPY (marketing), once.
 */
function staffTo(services: NotifyService[], withBookingCopy: boolean): string[] {
  const fallback = emailList(process.env.STAFF_NOTIFY_EMAIL);
  const to = services.flatMap((s) => (STAFF_INBOX[s] ? [STAFF_INBOX[s]] : fallback));
  return [...new Set(withBookingCopy ? [...to, STAFF_BOOKING_COPY] : to)];
}

const servicesOf = (references: string[]) => references.map(serviceOfReference);
/** Without SITE_URL a relative "/admin" would not work in a mail client, so the line is left out. */
const adminLink = () => (siteUrl() ? [`Atidaryti: ${siteUrl()}/admin`] : []);

function toStaff(
  services: NotifyService[],
  subject: string,
  paragraphs: (string | { strong: string })[],
  withBookingCopy = true,
) {
  const to = staffTo(services, withBookingCopy);
  if (to.length === 0) return Promise.resolve(false);
  return sendEmail({ to, subject, ...body([...paragraphs, ...adminLink()], false) });
}

export const emailStaffNew = (service: NotifyService, reference: string | undefined, summary: string) =>
  toStaff([service], `Nauja užklausa${reference ? ` ${reference}` : ""}`, [{ strong: summary }]);

export const emailStaffPaid = (references: string[], amount: number, review: boolean) =>
  toStaff(servicesOf(references), `${review ? "PATIKRINTI APMOKĖJIMĄ" : "Nauja apmokėta užklausa"} ${references.join(", ")}`, [
    { strong: `${formatEuro(amount)} už ${references.join(", ")}` },
    ...(review ? ["Apmokėta pavėluotai arba kita suma: patikrinkite ir, jei reikia, grąžinkite per Stripe."] : []),
  ]);

export const emailStaffDuplicate = (references: string[], amount: number) =>
  toStaff(servicesOf(references), `DVIGUBAS MOKĖJIMAS ${references.join(", ")}`, [
    { strong: `Antras mokėjimas ${formatEuro(amount)} už jau apmokėtą rezervaciją ${references.join(", ")}.` },
    "Grąžinkite papildomą mokėjimą per Stripe.",
  ], false); // a refund task for the service's staff, not a booking

/* ---------------- gift coupon orders (/kuponai) ---------------- */

export interface CouponPaidNotice {
  reference: string;
  amount: number;
  productName: string;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
}

/** Coupon staff alerts: STAFF_NOTIFY_EMAIL (else info@) plus the marketing copy. */
const couponStaffTo = () => {
  const configured = emailList(process.env.STAFF_NOTIFY_EMAIL);
  return [...new Set([...(configured.length ? configured : [MAIN_CONTACT.email]), STAFF_BOOKING_COPY])];
};

/** A coupon was paid online and issued (or, with `problem`, needs a look). */
export const emailStaffCouponPaid = (o: CouponPaidNotice & { problem?: string }) =>
  sendEmail({
    to: couponStaffTo(),
    subject: o.problem ? `PATIKRINTI KUPONO MOKĖJIMĄ ${o.reference}` : `Apmokėtas kuponas ${o.reference}`,
    ...body(
      [
        { strong: `${o.productName}, ${formatEuro(o.amount)}` },
        `Pirkėjas: ${o.buyerName}, ${o.buyerEmail}`,
        ...(o.recipientName || o.recipientEmail ? [`Gavėjas: ${[o.recipientName, o.recipientEmail].filter(Boolean).join(", ")}`] : []),
        o.problem ?? "Apmokėta per Stripe, kodas išduotas ir išsiųstas automatiškai.",
        ...(siteUrl() ? [`Atidaryti: ${siteUrl()}/admin/kuponai`] : []),
      ],
      false,
    ),
  });

/** A paid coupon was fully refunded in Stripe, so it was cancelled. */
export const emailStaffCouponCancelled = (reference: string) =>
  sendEmail({
    to: couponStaffTo(),
    subject: `Kuponas ${reference} atšauktas (grąžinti pinigai)`,
    ...body([{ strong: `Kuponas ${reference} atšauktas, nes mokėjimas grąžintas per Stripe.` }, ...(siteUrl() ? [`Atidaryti: ${siteUrl()}/admin/kuponai`] : [])], false),
  });
