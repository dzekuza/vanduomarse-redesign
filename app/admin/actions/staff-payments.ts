"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbError, done, fail, staffClient, type ActionResult, type StaffContext } from "@/lib/admin/action-helpers";
import { emailPaymentRequest } from "@/lib/email/notify";
import { describeRequest, saunaSummary } from "@/lib/sms/notify";
import { openStaffPayment, retireStaffPayment } from "@/lib/staff-payment";

/**
 * Payment of requests staff entered (phone / on site), after they were created (ADR-0113): send the Stripe payment link
 * again, copy it, or record the request as paid at entry. Website requests are paid by the customer and never touched here.
 */

const kindSchema = z.enum(["booking", "rental", "ticket"]);
type Kind = z.infer<typeof kindSchema>;

/** Same pages as cancelling or deleting that kind of request. */
const NEED = { booking: "rezervacijos", rental: "keturraciai", ticket: ["keturraciai", "renginiai"] } as const;

interface Loaded {
  reference: string;
  status: string;
  source: string;
  paidAt: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  email: string;
  summary: string;
}

async function load(supabase: Extract<StaffContext, { ok: true }>["supabase"], kind: Kind, id: string): Promise<Loaded | null | "error"> {
  if (kind === "booking") {
    const { data, error } = await supabase
      .from("bookings")
      .select("reference, status, source, paid_at, payment_id, customer_email, total, kind, date, start_hour, hours, nights, guests, payments(status)")
      .eq("id", id)
      .maybeSingle();
    if (error) return "error";
    if (!data) return null;
    const summary =
      data.start_hour !== null && data.hours !== null
        ? saunaSummary({ date: data.date, startHour: data.start_hour, hours: data.hours, party: data.guests, total: data.total })
        : describeRequest([data.kind === "kemperis" ? "Kemperio aikštelė" : "Namelis", data.date, data.nights ? `${data.nights} n.` : null, `${data.total} EUR`]);
    return { reference: data.reference, status: data.status, source: data.source, paidAt: data.paid_at, paymentId: data.payment_id, paymentStatus: data.payments?.status ?? null, email: data.customer_email ?? "", summary };
  }
  if (kind === "rental") {
    const { data, error } = await supabase
      .from("quad_rentals")
      .select("reference, status, source, paid_at, payment_id, customer_email, total, date, start_hour, payments(status)")
      .eq("id", id)
      .maybeSingle();
    if (error) return "error";
    if (!data) return null;
    const summary = describeRequest(["Keturračiai", data.date, `${String(data.start_hour).padStart(2, "0")}:00`, `${data.total} EUR`]);
    return { reference: data.reference, status: data.status, source: data.source, paidAt: data.paid_at, paymentId: data.payment_id, paymentStatus: data.payments?.status ?? null, email: data.customer_email ?? "", summary };
  }
  const { data, error } = await supabase
    .from("event_tickets")
    .select("reference, status, source, paid_at, payment_id, customer_email, total, people, events(title, date), payments(status)")
    .eq("id", id)
    .maybeSingle();
  if (error) return "error";
  if (!data) return null;
  const summary = describeRequest([data.events?.title, data.events?.date, `${data.people} asm.`, `${data.total} EUR`]);
  return { reference: data.reference, status: data.status, source: data.source, paidAt: data.paid_at, paymentId: data.payment_id, paymentStatus: data.payments?.status ?? null, email: data.customer_email ?? "", summary };
}

/** Why a request cannot take a payment now, or null. */
function unpayable(r: Loaded): string | null {
  if (r.source === "svetaine") return "Svetainės užklausą apmoka pats klientas.";
  if (r.status === "atsaukta") return "Atšauktos rezervacijos apmokėti negalima.";
  if (r.paidAt || r.paymentStatus === "apmoketa" || r.paymentStatus === "grazinta") return "Rezervacija jau apmokėta.";
  return null;
}

export type PaymentLink = { url: string; emailSent?: boolean };

/**
 * The payment link of a staff-entered request that is not paid: "email" sends it to the customer's address (again), "copy"
 * only returns it for the staff to pass on. The link is the request's open payment (a new one when the earlier expired).
 */
export async function getPaymentLink(kind: Kind, id: string, mode: "email" | "copy"): Promise<ActionResult<PaymentLink>> {
  const parsed = z.object({ kind: kindSchema, id: z.uuid(), mode: z.enum(["email", "copy"]) }).safeParse({ kind, id, mode });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const ctx = await staffClient(NEED[kind]);
  if (!ctx.ok) return ctx.error;

  const request = await load(ctx.supabase, kind, id);
  if (request === "error") return fail("Nepavyko nuskaityti rezervacijos.", "db");
  if (!request) return fail("Rezervacija nerasta.", "invalid");
  const blocked = unpayable(request);
  if (blocked) return fail(blocked, "invalid");
  if (mode === "email" && !request.email.trim()) return fail("Rezervacijoje nėra kliento el. pašto. Nukopijuokite nuorodą arba pridėkite el. paštą.", "email_required");

  const link = await openStaffPayment(request.reference, request.email);
  if (!link.ok) return fail(link.message, link.code);
  revalidatePath("/admin", "layout");
  if (mode === "copy") return done({ url: link.url });
  const emailSent = await emailPaymentRequest(request.email, request.reference, request.summary, link.amount, link.url);
  return done({ url: link.url, emailSent });
}

/**
 * Records a staff-entered request as paid at entry (cash or card). Its unpaid payment link is switched off first (a
 * customer can no longer pay it); a request waiting for confirmation is confirmed, like an online payment does.
 */
export async function markRequestPaid(kind: Kind, id: string, method: "grynais" | "kortele"): Promise<ActionResult> {
  const parsed = z.object({ kind: kindSchema, id: z.uuid(), method: z.enum(["grynais", "kortele"]) }).safeParse({ kind, id, method });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const ctx = await staffClient(NEED[kind]);
  if (!ctx.ok) return ctx.error;

  const request = await load(ctx.supabase, kind, id);
  if (request === "error") return fail("Nepavyko nuskaityti rezervacijos.", "db");
  if (!request) return fail("Rezervacija nerasta.", "invalid");
  const blocked = unpayable(request);
  if (blocked) return fail(blocked, "invalid");

  if (request.paymentId) {
    const retired = await retireStaffPayment(request.paymentId);
    if (!retired.ok) return fail(retired.message, "payment");
  }

  const patch = { paid_at: new Date().toISOString(), payment_method: method, status: request.status === "laukia" ? ("patvirtinta" as const) : undefined };
  const { data, error } =
    kind === "booking"
      ? await ctx.supabase.from("bookings").update(patch).eq("id", id).select("id")
      : kind === "rental"
        ? await ctx.supabase.from("quad_rentals").update(patch).eq("id", id).select("id")
        : await ctx.supabase.from("event_tickets").update(patch).eq("id", id).select("id");
  if (error) return dbError(error);
  if (!data?.length) return fail("Nepavyko pažymėti kaip sumokėta.", "failed");
  revalidatePath("/admin", "layout");
  return done(null);
}
