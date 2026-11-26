"use server";

import { z } from "zod";
import { eventDurationMinutes } from "@/components/admin/events/event-schema";
import { applyStaffDiscountCode } from "@/lib/admin/discount-code";
import type { DiscountService } from "@/lib/discount-codes";
import { toTourTicket } from "@/lib/admin/mappers";
import type { ManagedEvent, PriceItem, TourTicket } from "@/lib/admin/types";
import { dbError, done, fail, removeFailedRequest, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { describeRequest } from "@/lib/sms/notify";
import { requestStaffPayment, staffPaymentProblem } from "@/lib/staff-payment";

/* ---------------- events ---------------- */

const eventInput = z.object({
  id: z.uuid(),
  title: z.string().trim().min(3).max(80),
  category: z.enum(["pirtis", "vakarai", "akademija", "sventes", "keturratis"]),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: eventDurationMinutes.optional(),
  place: z.string().trim().min(2).max(80),
  blurb: z.string().trim().max(240),
  price: z.number().min(0).nullable(),
  regularPrice: z.number().positive().optional(),
  capacity: z.number().int().min(0).nullable(),
  published: z.boolean(),
  calendarPrivate: z.boolean().optional(),
  programId: z.string().regex(/^[a-z0-9-]+$/).max(60).optional(),
  saunaMasterId: z.string().min(1).max(60).optional(),
})
  .refine((event) => !(event.published && event.calendarPrivate))
  // A sale needs a (lower) price to charge; the database checks the same (events_regular_price_above_price).
  .refine((event) => event.regularPrice === undefined || (event.price !== null && event.regularPrice > event.price));

/** Events are managed with `renginiai`; staff with only `keturraciai` manage the guided per-person tours (RLS limits them to category keturratis). */
const EVENT_STAFF = ["renginiai", "keturraciai"] as const;

export async function saveEvent(event: ManagedEvent): Promise<ActionResult> {
  const ctx = await staffClient(EVENT_STAFF);
  if (!ctx.ok) return ctx.error;
  const parsed = eventInput.safeParse(event);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const e = parsed.data;
  const { error } = await ctx.supabase.from("events").upsert({
    id: e.id,
    title: e.title,
    category: e.category,
    date: e.date,
    start_time: e.time,
    duration_minutes: e.durationMinutes ?? null,
    place: e.place,
    blurb: e.blurb,
    price: e.price,
    regular_price: e.regularPrice ?? null,
    capacity: e.capacity,
    published: e.published,
    ...(e.calendarPrivate === undefined ? {} : { calendar_private: e.calendarPrivate }),
    program_id: e.programId ?? null,
    // Only a sauna session has a master; any other category clears it.
    sauna_master_id: e.category === "pirtis" ? (e.saunaMasterId ?? null) : null,
  });
  return error ? dbError(error) : done(null);
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const ctx = await staffClient(EVENT_STAFF);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("events").delete().eq("id", id);
  if (error?.code === "23503") return fail("Renginiui jau parduota bilietų – jį galima tik paslėpti.", "in_use");
  return error ? dbError(error) : done(null);
}

export async function setEventPublished(id: string, published: boolean): Promise<ActionResult> {
  const ctx = await staffClient(EVENT_STAFF);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("events").update({ published }).eq("id", id);
  return error ? dbError(error) : done(null);
}

/**
 * Sets how many places of a limited event staff keep for themselves (family, friends) without a booking. They count as
 * taken on the site and in the capacity check. Refused above what is still free, or on an event without a limit.
 */
export async function setEventHeld(id: string, held: number): Promise<ActionResult> {
  const ctx = await staffClient(EVENT_STAFF);
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), held: z.number().int().min(0).max(10_000) }).safeParse({ id, held });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data: event, error: readError } = await ctx.supabase.from("events").select("capacity, sold").eq("id", id).maybeSingle();
  if (readError) return dbError(readError);
  if (!event) return fail("Renginys nerastas.", "invalid");
  if (event.capacity === null && held > 0) return fail("Renginiui vietų riba nenustatyta, todėl vietų užimti negalima.", "invalid");
  if (event.capacity !== null && held + event.sold > event.capacity) {
    return fail(`Laisvų vietų: ${Math.max(0, event.capacity - event.sold)}. Daugiau užimti negalima.`, "invalid");
  }
  const { error } = await ctx.supabase.from("events").update({ held }).eq("id", id);
  return error ? dbError(error) : done(null);
}

/* ---------------- prices ---------------- */

const priceInput = z.array(
  z.object({ id: z.string().regex(/^[a-z0-9-]+$/), value: z.number().min(0), max: z.number().min(0).optional() }).refine((p) => p.max === undefined || p.max >= p.value),
);

export async function updatePrices(items: PriceItem[]): Promise<ActionResult> {
  const ctx = await staffClient("kainos");
  if (!ctx.ok) return ctx.error;
  const parsed = priceInput.safeParse(items.map(({ id, value, max }) => ({ id, value, max })));
  if (!parsed.success) return fail("Netinkamos kainos.", "invalid");
  for (const p of parsed.data) {
    const { error } = await ctx.supabase.from("price_items").update({ value: p.value, max: p.max ?? null }).eq("id", p.id);
    if (error) return dbError(error);
  }
  return done(null);
}

/* ---------------- staff-entered tickets ---------------- */

const eventTicketInput = z.object({
  eventId: z.uuid(),
  customer: z.object({ name: z.string().trim().min(2), phone: z.string().trim(), email: z.union([z.literal(""), z.email()]) }),
  people: z.number().int().min(1).max(500),
  status: z.enum(["patvirtinta", "laukia"]),
  source: z.enum(["telefonu", "vietoje"]),
  /** Paid at entry (method recorded), or not: then a payment link is e-mailed to the customer. */
  payment: z.object({ method: z.enum(["grynais", "kortele"]), paid: z.boolean() }),
  /** Staff override of the event's own price × people, e.g. a one-off rate. Empty uses the event's price. */
  price: z.number().min(0).max(1_000_000).optional(),
  /** Staff-entered discount code; re-checked and priced here, never trusted from the client (ADR-0036). */
  discountCode: z.string().trim().max(200), // raw input, before normalizeDiscountCode() strips punctuation/spaces; the real 3-30 bound is the DB's own code format
}).refine((v) => v.customer.phone !== "" || v.customer.email !== "");

export type NewEventTicketInput = z.infer<typeof eventTicketInput>;

/** The new ticket, and for an unpaid one whether the payment-link e-mail went out. */
export type CreatedTicket = { ticket: TourTicket; emailSent?: boolean; smsSent?: boolean; paymentUrl?: string };

/**
 * Adds tickets to an event or public sauna session for someone who phoned or walked in. The price is the event's ticket
 * price times the people unless staff set a one-off `price`, plus any discount code's cut; neither is ever trusted
 * from the browser as a final number — the code is re-checked and re-priced here (ADR-0036/0116). The database refuses
 * more people than places left (`event_full`, sold and held places count) and links the ticket to the customer by
 * contact. Staff-entered tickets
 * notify nobody, except that an unpaid one e-mails its payment link to the customer (ADR-0112). Quad tour departures are sold as rentals, not here.
 */
export async function createEventTicket(input: NewEventTicketInput): Promise<ActionResult<CreatedTicket>> {
  // Like the tickets table's policy: Renginiai for any event, Keturračiai only for guided quad tours (category keturratis).
  const ctx = await staffClient(EVENT_STAFF);
  if (!ctx.ok) return ctx.error;
  const parsed = eventTicketInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const { supabase } = ctx;
  const unpaid = !v.payment.paid;

  const { data: event, error: eventError } = await supabase.from("events").select("price, title, date, tour_route_id, calendar_private, category").eq("id", v.eventId).maybeSingle();
  if (eventError) return dbError(eventError);
  if (!event) return fail("Renginys nerastas.", "invalid");
  if (event.tour_route_id) return fail("Keturračių turai parduodami kaip nuoma.", "invalid");
  if (event.calendar_private) return fail("Privatus įrašas bilietų neturi.", "invalid");
  const base = v.price ?? (event.price ?? 0) * v.people;
  // Discount codes cover sauna sessions ("pirtis") and quad tours ("keturraciai"), the only categories a code's services list can name; vakarai/akademija/sventes tickets have no matching service.
  const discountService: DiscountService | null = event.category === "pirtis" ? "pirtis" : event.category === "keturratis" ? "keturraciai" : null;
  const discount = v.discountCode ? (discountService ? await applyStaffDiscountCode(v.discountCode, discountService, base) : { ok: false as const, message: "Šis kodas negalioja šiai paslaugai." }) : null;
  if (discount && !discount.ok) return fail(discount.message, "discount_code");
  const total = Math.max(0, base - (discount && discount.ok ? (discount.applied?.amount ?? 0) : 0));
  if (unpaid) {
    const problem = staffPaymentProblem(v.customer.email, total);
    if (problem) return fail(problem.message, problem.code);
  }

  const { data, error } = await supabase
    .from("event_tickets")
    .insert({
      // Assigned by the event_tickets_reference trigger.
      reference: undefined as unknown as string,
      event_id: v.eventId,
      customer_name: v.customer.name,
      customer_phone: v.customer.phone || null,
      customer_email: v.customer.email || null,
      people: v.people,
      total,
      status: v.status,
      source: v.source,
      payment_method: unpaid ? null : v.payment.method,
      paid_at: unpaid ? null : new Date().toISOString(),
      discount_code_id: discount && discount.ok ? (discount.applied?.id ?? null) : null,
      discount_code: discount && discount.ok ? (discount.applied?.code ?? null) : null,
      discount_amount: discount && discount.ok ? (discount.applied?.amount ?? 0) : 0,
    })
    .select("*, events!inner(title, date, start_time, category)")
    .single();
  if (error) return dbError(error);

  const ticket = toTourTicket(data);
  if (!unpaid) return done({ ticket });
  // Not paid at entry: open a payment and e-mail the link; without it the ticket would sit unpaid, so it is removed again.
  const summary = describeRequest([event.title, event.date, `${v.people} asm.`, `${total} EUR`]);
  const paymentRequest = await requestStaffPayment({ reference: data.reference, email: v.customer.email, phone: v.customer.phone, summary });
  if (!paymentRequest.ok) return removeFailedRequest(supabase, "event_tickets", data.id, data.reference, paymentRequest);
  ticket.payment = { id: paymentRequest.paymentId, status: "laukia", amount: paymentRequest.amount, refunded: 0, pointsDiscount: 0, needsReview: false };
  return done({ ticket, emailSent: paymentRequest.emailSent, smsSent: paymentRequest.smsSent, paymentUrl: paymentRequest.url });
}
