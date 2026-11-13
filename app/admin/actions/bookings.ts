"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { toBooking } from "@/lib/admin/mappers";
import type { Booking, BookingStatus } from "@/lib/admin/types";
import { notifyRequestOutcome } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { describeRequest, saunaSummary } from "@/lib/sms/notify";
import { refundRequest } from "@/lib/refund";
import { upsellTotal, type Upsell } from "@/lib/sauna-upsells";
import { dbError, done, fail, saunaIdSchema, staffClient, type ActionResult, type StaffContext } from "@/lib/admin/action-helpers";

/* ---------------- bookings ---------------- */

const bookingStatus = z.enum(["laukia", "patvirtinta", "ivykdyta", "atsaukta"]);

/**
 * The row's email only when it is the account's own confirmed address. A row's email is what the form
 * sent, and `user_id` alone does not prove it (a signed-in request can pass on a verified phone with any
 * email), so the address is checked against auth.users through a service-role function. Null otherwise,
 * or when the lookup fails: then only the SMS goes out.
 */
async function accountEmailFor(userId: string | null, rowEmail: string | null): Promise<string | null> {
  if (!userId || !rowEmail) return null;
  try {
    const { data, error } = await createAdminClient().rpc("account_notify_email", { p_user: userId });
    if (error) {
      // A missing migration or service key would otherwise silently stop every outcome email.
      console.error("account_notify_email failed, customer email skipped");
      return null;
    }
    if (!data) return null;
    return data.toLowerCase() === rowEmail.trim().toLowerCase() ? data : null;
  } catch {
    console.error("account_notify_email failed (no service key?), customer email skipped");
    return null;
  }
}

/** Tells a website customer their request was confirmed or cancelled; staff-entered bookings and other status changes send nothing. */
function notifyCustomer(
  source: string,
  contact: { customer_phone: string | null; customer_email: string | null; user_id: string | null },
  reference: string,
  status: BookingStatus,
  summary: string,
) {
  if (source !== "svetaine" || (status !== "patvirtinta" && status !== "atsaukta")) return;
  after(async () => {
    const email = await accountEmailFor(contact.user_id, contact.customer_email);
    await notifyRequestOutcome({ phone: contact.customer_phone, email }, reference, status, summary);
  });
}

export async function setBookingStatus(id: string, status: Booking["status"]): Promise<ActionResult> {
  const ctx = await staffClient("rezervacijos");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("reference, customer_phone, customer_email, user_id, source, kind, date, start_hour, hours")
    .maybeSingle();
  if (error) return dbError(error);
  if (data) {
    const summary =
      data.start_hour !== null && data.hours !== null
        ? saunaSummary({ date: data.date, startHour: data.start_hour, hours: data.hours })
        : describeRequest([data.kind === "pirtis" ? "Pirtis" : "Nakvyne", data.date]);
    notifyCustomer(data.source, data, data.reference, status, summary);
  }
  return done(null);
}

const newBookingInput = z
  .object({
    kind: z.enum(["pirtis", "namelis", "kemperis"]),
    /** Sauna only. */
    saunaId: z.string().regex(/^[a-z0-9-]+$/).max(60).optional(),
    date: z.iso.date(),
    startHour: z.number().int().min(0).max(23).optional(),
    hours: z.number().int().min(1).max(24).optional(),
    nights: z.number().int().min(1).max(60).optional(),
    guests: z.number().int().min(1).max(500),
    customer: z.object({ name: z.string().trim().min(2), phone: z.string().trim(), email: z.string().trim() }),
    /** Upsell id -> quantity; priced on the server from the current upsells. */
    extras: z.record(z.string(), z.number().int().min(0).max(100)),
    total: z.number().min(0).max(1_000_000),
    status: z.enum(["patvirtinta", "laukia"]),
    source: z.enum(["telefonu", "vietoje"]),
    note: z.string().trim().max(300),
  })
  .refine((v) => (v.kind === "pirtis" ? v.saunaId !== undefined && v.startHour !== undefined && v.hours !== undefined : v.nights !== undefined));

export type NewBookingInput = z.infer<typeof newBookingInput>;

/**
 * Stay type for a phone booking (the form asks only for cabin or camper and the party size):
 * the cheapest-capacity active type of the kind that fits the party, else the largest one.
 */
async function stayTypeFor(supabase: Extract<StaffContext, { ok: true }>["supabase"], kind: NewBookingInput["kind"], guests: number): Promise<string | null> {
  if (kind === "pirtis") return null;
  const { data } = await supabase.from("stay_types").select("id, max_guests").eq("kind", kind).eq("active", true).order("max_guests");
  const fits = (data ?? []).find((t) => t.max_guests >= guests) ?? data?.at(-1);
  return fits?.id ?? null;
}

export async function createBooking(input: NewBookingInput): Promise<ActionResult<Booking>> {
  const ctx = await staffClient("rezervacijos");
  if (!ctx.ok) return ctx.error;
  const parsed = newBookingInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const sauna = v.kind === "pirtis";
  const { supabase } = ctx;

  const { data: row, error } = await supabase
    .from("bookings")
    .insert({
      // Assigned by the bookings_reference trigger.
      reference: undefined as unknown as string,
      kind: v.kind,
      sauna_id: sauna ? v.saunaId : null,
      customer_name: v.customer.name,
      customer_phone: v.customer.phone || null,
      customer_email: v.customer.email || null,
      date: v.date,
      start_hour: sauna ? v.startHour : null,
      hours: sauna ? v.hours : null,
      nights: sauna ? null : v.nights,
      stay_type_id: await stayTypeFor(supabase, v.kind, v.guests),
      guests: v.guests,
      total: v.total,
      status: v.status,
      source: v.source,
      note: v.note || null,
    })
    .select("id")
    .single();
  if (error) return dbError(error);

  if (sauna) {
    // Extras this sauna offers, priced from the current catalogue.
    const { data: links } = await supabase.from("sauna_upsell_links").select("sauna_upsells(*)").eq("sauna_id", v.saunaId ?? "");
    const upsells = (links ?? []).flatMap((l) => (l.sauna_upsells?.active ? [l.sauna_upsells] : []));
    const lines = upsells
      .map((u) => ({ u, qty: v.extras[u.id] ?? 0 }))
      .filter(({ qty }) => qty > 0)
      .map(({ u, qty }) => {
        const upsell: Upsell = { id: u.id, name: u.name, description: u.description, price: u.price, unit: u.unit, maxQty: u.max_qty, minHours: u.min_hours, active: u.active };
        return {
          booking_id: row.id,
          upsell_id: u.id,
          name: u.name,
          unit: u.unit,
          unit_price: u.price,
          quantity: u.unit === "vienetui" ? qty : 1,
          line_total: upsellTotal(upsell, qty, { partySize: v.guests, hours: v.hours ?? 0 }),
        };
      });
    if (lines.length) {
      const { error: extrasError } = await supabase.from("booking_extras").insert(lines);
      if (extrasError) {
        await supabase.from("bookings").delete().eq("id", row.id);
        return dbError(extrasError);
      }
    }
  }

  const { data: saved, error: readError } = await supabase
    .from("bookings")
    .select("*, booking_extras(name, unit, quantity)")
    .eq("id", row.id)
    .single();
  if (readError) return dbError(readError);
  return done(toBooking(saved));
}

/* ---------------- sauna blocks ---------------- */

export async function toggleBlock(saunaId: string, date: string, hour: number, reason: string): Promise<ActionResult> {
  const ctx = await staffClient("uzimtumas");
  if (!ctx.ok) return ctx.error;
  const parsed = z
    .object({ saunaId: saunaIdSchema, date: z.iso.date(), hour: z.number().int().min(0).max(23), reason: z.string().trim().min(1).max(80) })
    .safeParse({ saunaId, date, hour, reason });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { supabase, userId } = ctx;

  const { data: existing } = await supabase.from("sauna_blocks").select("id").eq("sauna_id", saunaId).eq("date", date).eq("hour", hour).maybeSingle();
  const { error } = existing
    ? await supabase.from("sauna_blocks").delete().eq("id", existing.id)
    : await supabase.from("sauna_blocks").insert({ sauna_id: saunaId, date, hour, reason, created_by: userId });
  return error ? dbError(error) : done(null);
}

/* ---------------- inquiries ---------------- */

export async function setInquiryStatus(id: string, status: "nauja" | "susisiekta" | "pasiulymas"): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: z.enum(["nauja", "susisiekta", "pasiulymas"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("inquiries").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}

const revalidateStayHolds = () => {
  revalidatePath("/admin", "layout");
  for (const path of ["/rezervacija", "/nakvyne", "/embed/miegas"]) revalidatePath(path);
};

/**
 * Accept a calculator inquiry: books its cabins (confirmed stay bookings on the event date, linked to the
 * inquiry) so /rezervacija no longer offers them. All or nothing; needs `uzklausos` and `rezervacijos`.
 */
export async function acceptInquiry(id: string): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.rpc("accept_inquiry_stays", { p_inquiry_id: id });
  if (error) {
    const byHint: Record<string, string> = {
      inquiry_accepted: "Užklausa jau priimta.",
      inquiry_no_date: "Užklausoje nėra datos – namelių užimti negalima.",
      no_stays: "Užklausoje nėra ko užimti: pasirinkite namelius arba pirtį su pradžios laiku.",
      stay_type_missing: "Užklausos namelio tipo nebėra – užimkite rankiniu būdu.",
      sauna_missing: "Užklausos pirties nebėra – užimkite rankiniu būdu.",
      program_missing: "Užklausos pirties programos nebėra arba ji išjungta.",
      sauna_hours: "Pirties seansas netelpa į pirties darbo valandas.",
    };
    return error.hint && byHint[error.hint] ? fail(byHint[error.hint], "invalid") : dbError(error);
  }
  revalidateStayHolds();
  return done(null);
}

/** Undo `acceptInquiry`: cancels the cabin bookings it created, so the cabins are free again. */
export async function releaseInquiry(id: string): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.rpc("release_inquiry_stays", { p_inquiry_id: id });
  if (error) return dbError(error);
  revalidateStayHolds();
  return done(null);
}

export async function addInquiryNote(id: string, text: string): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), text: z.string().trim().min(1).max(2000) }).safeParse({ id, text });
  if (!parsed.success) return fail("Pastaba tuščia arba per ilga.", "invalid");
  const { error } = await ctx.supabase.from("inquiry_notes").insert({ inquiry_id: id, text: parsed.data.text, author_id: ctx.userId });
  return error ? dbError(error) : done(null);
}

/* ---------------- rentals, tickets, cancel / remove ---------------- */

export async function setRentalStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase
    .from("quad_rentals")
    .update({ status })
    .eq("id", id)
    .select("reference, customer_phone, customer_email, user_id, source, date, start_hour")
    .maybeSingle();
  if (error) return dbError(error);
  if (data) {
    notifyCustomer(data.source, data, data.reference, status, describeRequest(["Keturraciai", data.date, `${String(data.start_hour).padStart(2, "0")}:00`]));
  }
  return done(null);
}

export async function setTourTicketStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  const ctx = await staffClient(["keturraciai", "renginiai"]);
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase
    .from("event_tickets")
    .update({ status })
    .eq("id", id)
    .select("reference, customer_phone, customer_email, user_id, source, people")
    .maybeSingle();
  if (error) return dbError(error);
  if (data) notifyCustomer(data.source, data, data.reference, status, describeRequest(["Bilietai", `${data.people} asm.`]));
  return done(null);
}

export type CancelledRequest = { refunded: number; refundError?: string };

/**
 * Cancels a booking, quad rental or event ticket and, when asked, refunds what it paid through Stripe (ADR-0081).
 * The cancellation always happens first and keeps its own permission check; a failed refund does not undo it, it comes
 * back as `refundError` so staff can refund in Stripe by hand.
 */
export async function cancelRequest(kind: "booking" | "rental" | "ticket", id: string, refund: boolean): Promise<ActionResult<CancelledRequest>> {
  const parsed = z.object({ kind: z.enum(["booking", "rental", "ticket"]), id: z.uuid(), refund: z.boolean() }).safeParse({ kind, id, refund });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");

  // With a refund, check the staff member may refund BEFORE cancelling, so a refusal does not leave a half-done cancel.
  const ctx = refund ? await staffClient(kind === "booking" ? "rezervacijos" : kind === "rental" ? "keturraciai" : ["keturraciai", "renginiai"]) : null;
  if (ctx && !ctx.ok) return ctx.error;

  const result = kind === "booking" ? await setBookingStatus(id, "atsaukta") : kind === "rental" ? await setRentalStatus(id, "atsaukta") : await setTourTicketStatus(id, "atsaukta");
  if ("error" in result) return result;
  if (!ctx) return done({ refunded: 0 });

  // A status update that matches no row (row level security narrower than the check above) reports success: never refund
  // a request that is not actually cancelled.
  const check =
    kind === "booking"
      ? await ctx.supabase.from("bookings").select("status").eq("id", id).maybeSingle()
      : kind === "rental"
        ? await ctx.supabase.from("quad_rentals").select("status").eq("id", id).maybeSingle()
        : await ctx.supabase.from("event_tickets").select("status").eq("id", id).maybeSingle();
  if (check.data?.status !== "atsaukta") return fail("Užklausos atšaukti nepavyko, todėl pinigai negrąžinti.", "not_cancelled");

  const outcome = await refundRequest(kind, id, ctx.userId);
  return done(outcome.ok ? { refunded: outcome.amount } : { refunded: 0, refundError: outcome.message });
}

/**
 * Removes a CANCELLED booking, quad rental or event ticket from the lists. Only a cancelled request can go, and one that was
 * paid online only once its refund is recorded (or the whole payment was refunded in Stripe): deleting a paid request whose
 * money is still with us would hide that it needs refunding. The payment and refund records stay (they are not removed with it).
 */
export async function deleteRequest(kind: "booking" | "rental" | "ticket", id: string): Promise<ActionResult> {
  const parsed = z.object({ kind: z.enum(["booking", "rental", "ticket"]), id: z.uuid() }).safeParse({ kind, id });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const ctx = await staffClient(kind === "booking" ? "rezervacijos" : kind === "rental" ? "keturraciai" : ["keturraciai", "renginiai"]);
  if (!ctx.ok) return ctx.error;

  const table = kind === "booking" ? "bookings" : kind === "rental" ? "quad_rentals" : "event_tickets";
  const { data: row, error } = await ctx.supabase.from(table).select("status, payment_id, payments(status)").eq("id", id).maybeSingle();
  if (error) return dbError(error);
  if (!row) return fail("Užklausa nerasta.", "invalid");
  if (row.status !== "atsaukta") return fail("Pašalinti galima tik atšauktą užklausą.", "not_cancelled");

  if (row.payment_id && row.payments?.status === "apmoketa") {
    const { data: refund } = await createAdminClient().from("request_refunds").select("status").eq("kind", kind).eq("request_id", id).maybeSingle();
    if (refund?.status !== "done") return fail("Užklausa apmokėta internetu ir pinigai negrąžinti. Pirmiausia grąžinkite pinigus Stripe paskyroje.", "not_refunded");
  }

  const { data: removed, error: deleteError } = await ctx.supabase.from(table).delete().eq("id", id).eq("status", "atsaukta").select("id");
  if (deleteError) return dbError(deleteError);
  if (!removed?.length) return fail("Užklausos pašalinti nepavyko.", "failed");
  return done(null);
}
