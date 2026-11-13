"use server";

import { after } from "next/server";
import { z } from "zod";
import type { ActionResult } from "@/app/admin/actions";
import { MAIN_CONTACT, type NotifyService } from "@/lib/contacts";
import { getCustomer } from "@/lib/customer";
import { notifyCancelledByCustomer } from "@/lib/notify";
import { refundRequest, type RefundKind } from "@/lib/refund";
import { cancelPolicy, CANCEL_REFUND_HOURS } from "@/lib/request-cancel";
import { describeRequest, saunaSummary } from "@/lib/sms/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * "Atšaukti rezervaciją" on /paskyra (ADR-0087). The customer cancels one of their own requests; if it was paid online and
 * starts at least CANCEL_REFUND_HOURS from now, what it paid is refunded through Stripe at once (the same refund code staff
 * use, ADR-0081). Under that, a paid request is cancelled by calling us. The request is read with the customer's own session
 * (row level security returns only their rows) and the rule is `cancelPolicy`, the same one the button was drawn from, applied
 * again here: nothing the browser sends decides it.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

const SIGN_IN = "Prisijunkite, kad galėtumėte atšaukti rezervaciją.";
const CALL_US = `Atšaukti internetu galima likus bent ${CANCEL_REFUND_HOURS} val. iki pradžios. Skambinkite ${MAIN_CONTACT.phone}.`;

const input = z.object({ kind: z.enum(["booking", "rental", "ticket"]), id: z.uuid() });

export type CancelledByCustomer = { refunded: number; refundFailed: boolean };

/** What the action needs of a request, whichever table it lives in. */
interface Found {
  reference: string;
  status: "laukia" | "patvirtinta" | "ivykdyta" | "atsaukta";
  date: string;
  startHour: number;
  total: number;
  payment: "laukia" | "apmoketa" | "pasibaige" | "nepavyko" | "grazinta" | null;
  service: NotifyService;
  summary: string;
}

const PAYMENTS = ["laukia", "apmoketa", "pasibaige", "nepavyko", "grazinta"] as const;
const paymentOf = (row: { status: string } | null): Found["payment"] => PAYMENTS.find((p) => p === row?.status) ?? null;

async function findOwn(kind: RefundKind, id: string): Promise<Found | null> {
  const supabase = await createClient();
  if (kind === "booking") {
    const { data: b } = await supabase.from("bookings").select("reference, kind, date, start_hour, hours, total, status, payments(status)").eq("id", id).maybeSingle();
    if (!b) return null;
    const sauna = b.kind === "pirtis";
    return {
      reference: b.reference,
      status: b.status,
      date: b.date,
      startHour: sauna ? (b.start_hour ?? 0) : 0,
      total: b.total,
      payment: paymentOf(b.payments),
      service: sauna ? "pirtis" : "nakvyne",
      summary: sauna && b.start_hour !== null && b.hours !== null ? saunaSummary({ date: b.date, startHour: b.start_hour, hours: b.hours }) : describeRequest(["Nakvyne", b.date]),
    };
  }
  if (kind === "rental") {
    const { data: r } = await supabase.from("quad_rentals").select("reference, date, start_hour, total, status, payments(status)").eq("id", id).maybeSingle();
    if (!r) return null;
    return {
      reference: r.reference,
      status: r.status,
      date: r.date,
      startHour: r.start_hour,
      total: r.total,
      payment: paymentOf(r.payments),
      service: "keturraciai",
      summary: describeRequest(["Keturraciai", r.date, `${String(r.start_hour).padStart(2, "0")}:00`]),
    };
  }
  const { data: t } = await supabase.from("event_tickets").select("reference, people, total, status, payments(status), events(date, start_time)").eq("id", id).maybeSingle();
  if (!t) return null;
  return {
    reference: t.reference,
    status: t.status,
    date: t.events?.date ?? "",
    startHour: Number(t.events?.start_time.slice(0, 2) ?? 0),
    total: t.total,
    payment: paymentOf(t.payments),
    service: "keturraciai",
    summary: describeRequest(["Bilietai", `${t.people} asm.`]),
  };
}

const TABLE = { booking: "bookings", rental: "quad_rentals", ticket: "event_tickets" } as const;

export async function cancelMyRequest(raw: unknown): Promise<ActionResult<CancelledByCustomer>> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return fail("Neteisinga nuoroda.", "invalid");
  const { kind, id } = parsed.data;
  const customer = await getCustomer();
  if (!customer) return fail(SIGN_IN, "unauthorized");

  const request = await findOwn(kind, id);
  if (!request) return fail("Rezervacija nerasta.", "invalid");
  const { state, refund } = cancelPolicy({ status: request.status, payment: request.payment, date: request.date, startHour: request.startHour, total: request.total });
  if (state === "late") return fail(CALL_US, "too_late");
  if (state === "no") return fail("Šios rezervacijos atšaukti nebegalima. Atnaujinkite puslapį.", "closed");

  // Cancel: only this customer's own row, and only while it is still open (a double click or a staff change in between matches nothing).
  const { data: updated, error } = await createAdminClient()
    .from(TABLE[kind])
    .update({ status: "atsaukta" })
    .eq("id", id)
    .eq("user_id", customer.id)
    .in("status", ["laukia", "patvirtinta"])
    .select("id");
  if (error) {
    console.error("Customer cancel failed", request.reference, error.message);
    return fail("Nepavyko atšaukti. Bandykite dar kartą arba skambinkite.", "failed");
  }
  if (!updated?.length) return fail("Šios rezervacijos atšaukti nebegalima. Atnaujinkite puslapį.", "closed");

  // Refund what it paid; a failed refund never undoes the cancellation, staff are told to refund in Stripe.
  let refunded = 0;
  let refundFailed = false;
  if (refund > 0) {
    const outcome = await refundRequest(kind, id, customer.id);
    if (outcome.ok) refunded = outcome.amount;
    else refundFailed = true;
  }

  const money = refund === 0 ? "Apmoketa nebuvo." : refundFailed ? "GRAZINIMAS NEPAVYKO: grazinkite pinigus per Stripe." : `Grazinta ${refunded} EUR.`;
  after(() => notifyCancelledByCustomer(request.service, { phone: customer.phone, email: customer.email }, request.reference, request.summary, money));
  return { data: { refunded, refundFailed } };
}
