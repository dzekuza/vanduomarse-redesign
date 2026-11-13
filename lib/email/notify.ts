import "server-only";
import { contactFor, requestDate, requestHeading, requestTime, staffCustomer, staffExtras, type PaidRequest } from "@/lib/paid-request";
import { MAIN_CONTACT, STAFF_BOOKING_COPY, STAFF_INBOX, serviceOfReference, type NotifyService } from "@/lib/contacts";
import { formatEuro } from "@/lib/coupons";
import { bookingTopics, paymentTopics, type MessageTopic } from "@/lib/notification-topics";
import { staffEmailsFor } from "@/lib/staff-recipients";
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

/**
 * Stripe confirmed the payment. A paid reservation is confirmed by the database at once (no staff step), so with
 * `confirmed` the mail lists it; otherwise (a payment that needs a manual look) staff confirm it later.
 */
export const emailPaid = (to: string | null | undefined, references: string[], amount: number, requests: PaidRequest[] = [], confirmed = false) => {
  if (!to) return Promise.resolve(false);
  if (!confirmed || requests.length === 0) {
    return sendEmail({
      to,
      subject: `Apmokėjimas gautas (${references.join(", ")})`,
      ...body([
        "Sveiki,",
        `gavome jūsų apmokėjimą: ${formatEuro(amount)} už ${references.join(", ")}.`,
        confirmed ? "Rezervacija patvirtinta." : "Patikrinsime ir patvirtinsime netrukus, pranešime atskirai.",
        ...accountLink(),
      ]),
    });
  }
  const contact = contactFor(requests);
  return sendEmail({
    to,
    subject: `Jūsų mokėjimas gautas (${references.join(", ")})`,
    ...body([
      "Jūsų mokėjimas gautas. Jūsų rezervacija:",
      ...requests.map((r) => ({ strong: [requestHeading(r), `Data: ${requestDate(r)}`, ...(requestTime(r) ? [`Laikas: ${requestTime(r)}`] : [])].join("\n") })),
      `Turite klausimų? Skambinkite ${contact.phone} arba rašykite ${contact.email}`,
      ...accountLink(),
    ], false),
  });
};

/* ---------------- staff: the people in /admin/pranesimai, else the service inbox (STAFF_INBOX), else STAFF_NOTIFY_EMAIL ---------------- */

/**
 * Who gets a staff e-mail. Owners' list first (`/admin/pranesimai`, filtered by topic); only while nobody
 * there has an e-mail address does it fall back to the inboxes for these services (services without one use
 * STAFF_NOTIFY_EMAIL, comma-separated), plus STAFF_BOOKING_COPY (marketing) once for booking mails.
 */
async function staffTo(topics: MessageTopic[], services: NotifyService[], withBookingCopy: boolean): Promise<string[]> {
  const listed = await staffEmailsFor(topics);
  if (listed) return [...new Set(listed)];
  const fallback = emailList(process.env.STAFF_NOTIFY_EMAIL);
  const to = services.flatMap((s) => (STAFF_INBOX[s] ? [STAFF_INBOX[s]] : fallback));
  return [...new Set(withBookingCopy ? [...to, STAFF_BOOKING_COPY] : to)];
}

const servicesOf = (references: string[]) => references.map(serviceOfReference);
/** Without SITE_URL a relative "/admin" would not work in a mail client, so the line is left out. */
const adminLink = () => (siteUrl() ? [`Atidaryti: ${siteUrl()}/admin`] : []);

async function toStaff(
  topics: MessageTopic[],
  services: NotifyService[],
  subject: string,
  paragraphs: (string | { strong: string })[],
  withBookingCopy = true,
) {
  const to = await staffTo(topics, services, withBookingCopy);
  if (to.length === 0) return false;
  return sendEmail({ to, subject, ...body([...paragraphs, ...adminLink()], false) });
}

export const emailStaffNew = (service: NotifyService, reference: string | undefined, summary: string) =>
  toStaff(bookingTopics(service), [service], `Nauja užklausa${reference ? ` ${reference}` : ""}`, [{ strong: summary }]);

/** "2026-11-13 14:05" in Vilnius time. */
const vilniusNow = () =>
  new Intl.DateTimeFormat("lt-LT", { timeZone: "Europe/Vilnius", dateStyle: "short", timeStyle: "short" }).format(new Date());

/** The staff mail of a paid reservation: amount and time, who booked (name, phone, e-mail) and each request with date, time, people, price and any code. */
export const emailStaffPaid = (
  references: string[],
  amount: number,
  review: boolean,
  requests: PaidRequest[] = [],
  contact: { phone?: string | null; email?: string | null } = {},
) => {
  const customer = staffCustomer(requests, contact);
  const { discountCodes, notes } = staffExtras(requests);
  return toStaff(paymentTopics(servicesOf(references)), servicesOf(references), `${review ? "PATIKRINTI APMOKĖJIMĄ" : "Apmokėta ir patvirtinta"} ${references.join(", ")}`, [
    { strong: `${formatEuro(amount)} už ${references.join(", ")}` },
    ...(review ? ["Apmokėta pavėluotai arba kita suma: patikrinkite ir, jei reikia, grąžinkite per Stripe."] : []),
    `Apmokėjimo laikas: ${vilniusNow()}`,
    ...(customer
      ? [["Klientas:", customer.name, customer.phone ? `Tel.: ${customer.phone}` : null, customer.email ? `El. paštas: ${customer.email}` : null].filter(Boolean).join("\n")]
      : []),
    ...requests.map((r) =>
      [
        r.reference,
        requestHeading(r),
        `Data: ${requestDate(r)}`,
        ...(requestTime(r) ? [`Laikas: ${requestTime(r)}`] : []),
        ...(r.staff?.people ? [`Žmonių: ${r.staff.people}`] : []),
        ...(r.staff?.units && r.service !== "pirtis" ? [`Kiekis: ${r.staff.units}`] : []),
        ...(r.staff ? [`Kaina: ${formatEuro(r.staff.total)}`] : []),
      ].join("\n"),
    ),
    ...(discountCodes.length ? [`Nuolaidos kodas: ${discountCodes.join(", ")}`] : []),
    ...(notes.length ? [`Pastabos:\n${notes.join("\n")}`] : []),
  ]);
};

export const emailStaffDuplicate = (references: string[], amount: number) =>
  toStaff(paymentTopics(servicesOf(references)), servicesOf(references), `DVIGUBAS MOKĖJIMAS ${references.join(", ")}`, [
    { strong: `Antras mokėjimas ${formatEuro(amount)} už jau apmokėtą rezervaciją ${references.join(", ")}.` },
    "Grąžinkite papildomą mokėjimą per Stripe.",
  ], false); // a refund task for the service's staff, not a booking
/** The customer cancelled their own request (`refund` says what happened to the money). Booking mail rules apply: the service's people, else its inbox. */
export const emailStaffCancelled = (service: NotifyService, reference: string, summary: string, refund: string) =>
  toStaff(bookingTopics(service), [service], `Klientas atšaukė ${reference}`, [{ strong: summary }, refund]);


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

/** Coupon and plan staff alerts are payments: the people on `mokejimai` in /admin/pranesimai, else STAFF_NOTIFY_EMAIL (else info@) plus the marketing copy. */
const couponStaffTo = async () => {
  const listed = await staffEmailsFor(["mokejimai"]);
  if (listed) return [...new Set(listed)];
  const configured = emailList(process.env.STAFF_NOTIFY_EMAIL);
  return [...new Set([...(configured.length ? configured : [MAIN_CONTACT.email]), STAFF_BOOKING_COPY])];
};

/** A coupon was paid online and issued (or, with `problem`, needs a look). */
export const emailStaffCouponPaid = async (o: CouponPaidNotice & { problem?: string }) =>
  sendEmail({
    to: await couponStaffTo(),
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
export const emailStaffCouponCancelled = async (reference: string) =>
  sendEmail({
    to: await couponStaffTo(),
    subject: `Kuponas ${reference} atšauktas (grąžinti pinigai)`,
    ...body([{ strong: `Kuponas ${reference} atšauktas, nes mokėjimas grąžintas per Stripe.` }, ...(siteUrl() ? [`Atidaryti: ${siteUrl()}/admin/kuponai`] : [])], false),
  });

/* ---------------- bracelet plan orders (WAKE season passes, /registracija) ---------------- */

export interface PlanPaidNotice {
  reference: string;
  planName: string;
  amount: number;
  riderName: string;
  riderEmail: string;
}

/** The buyer's receipt: the plan is on their profile and staff bind the bracelet at the park. Returns true when sent. */
export const emailPlanPaidCustomer = (o: { to: string; riderName: string; planName: string; amount: number; reference: string }) =>
  sendEmail({
    to: o.to,
    subject: `Apmokėta: ${o.planName} (${o.reference})`,
    ...body([
      `Sveiki, ${o.riderName}!`,
      { strong: `${o.planName}, ${formatEuro(o.amount)}: apmokėta. Dėkojame!` },
      "Planas priskirtas jūsų profiliui. Atvykę į parką, kasoje pasakykite savo vardą: darbuotojas priskirs jums apyrankę.",
    ]),
  });

/** A plan was paid online and attached (or, with `problem`, needs a look). */
export const emailStaffPlanPaid = async (o: PlanPaidNotice & { problem?: string }) =>
  sendEmail({
    to: await couponStaffTo(),
    subject: o.problem ? `PATIKRINTI PLANO MOKĖJIMĄ ${o.reference}` : `Apmokėtas planas ${o.reference}`,
    ...body(
      [
        { strong: `${o.planName}, ${formatEuro(o.amount)}` },
        `Pirkėjas: ${o.riderName}, ${o.riderEmail}`,
        o.problem ?? "Apmokėta per Stripe, planas priskirtas. Reikia tik priskirti apyrankę parke.",
        ...(siteUrl() ? [`Atidaryti: ${siteUrl()}/admin/apyrankes`] : []),
      ],
      false,
    ),
  });

/** A paid plan order was fully refunded in Stripe, so the order was cancelled (the rider's plan needs a manual change). */
export const emailStaffPlanCancelled = async (reference: string) =>
  sendEmail({
    to: await couponStaffTo(),
    subject: `Plano užsakymas ${reference} atšauktas (grąžinti pinigai)`,
    ...body([{ strong: `Užsakymas ${reference} atšauktas, nes mokėjimas grąžintas per Stripe.` }, "Pakeiskite kliento planą skiltyje Apyrankės, jei jis dar galioja.", ...(siteUrl() ? [`Atidaryti: ${siteUrl()}/admin/apyrankes`] : [])], false),
  });
