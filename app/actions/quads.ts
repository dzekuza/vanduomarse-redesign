"use server";

import { after } from "next/server";
import type { ActionResult } from "@/app/admin/actions";
import { mixedQuadRentalSchema, quadRentalSchema, quadTourRentalSchema, tourTicketSchema, type MixedQuadRentalInput, type QuadRentalInput, type QuadTourRentalInput, type TourTicketInput } from "@/lib/quad-schema";
import { UNVERIFIED, verifiedPhone } from "@/lib/phone-verification";
import { confirmCashRequest, PHONE_REQUIRED } from "@/lib/cash-confirm";
import { requester } from "@/lib/request-identity";
import { hourLabel } from "@/lib/quads";
import { notifyRequestFiled, notifyRequestOutcome } from "@/lib/notify";
import { describeRequest } from "@/lib/sms/notify";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Public quad actions. They run as the anonymous role: the database only lets
 * anon file a rental request or a tour ticket through security definer
 * functions (price and limits come from the fleet rows), never touch the tables.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

interface DbError {
  code?: string;
  hint?: string | null;
}

const BY_HINT: Record<string, string> = {
  quad_unavailable: "Šio keturračio šiuo metu nenuomojame. Atnaujinkite puslapį.",
  quad_closed: "Pasirinktas laikas už darbo valandų.",
  quad_past: "Pasirinkta data jau praėjo arba yra per toli.",
  quad_units: "Netinkamas keturračių tipų arba vienetų skaičius.",
  quad_riders: "Per daug važiuotojų pasirinktam keturračių skaičiui.",
  quad_full: "Šiuo laiku tiek keturračių nebėra. Pasirinkite kitą laiką.",
  quad_tour_unavailable: "Šio turo šiuo metu nebeturime. Atnaujinkite puslapį.",
  quad_gear: "Netinkama papildoma įranga. Atnaujinkite puslapį.",
  discount_invalid: "Nuolaidos kodas negalioja šiai paslaugai arba datai.",
  discount_used_up: "Šis nuolaidos kodas jau išnaudotas.",
  tour_unavailable: "Šis žygis nebeprieinamas. Atnaujinkite puslapį.",
  tour_people: "Netinkamas žmonių skaičius.",
  event_full: "Žygyje nebeliko tiek vietų.",
  contact_invalid: "Nurodykite teisingą el. paštą arba telefoną (bent 8 skaitmenys).",
  phone_unverified: UNVERIFIED.error.message,
  too_many_pending: "Jau turite kelias nepatvirtintas užklausas. Palaukite patvirtinimo arba skambinkite.",
  too_many_requests: "Šiuo metu priimame per daug užklausų. Bandykite vėliau arba skambinkite.",
};

function dbFail(e: DbError) {
  const message = BY_HINT[e.hint ?? ""];
  if (message) return fail(message, e.hint ?? undefined);
  if (e.code === "23P01") return fail(BY_HINT.quad_full, "quad_full");
  return fail("Nepavyko pateikti užklausos. Bandykite dar kartą.", "db");
}

/** Text the visitor's verified phone, email only a signed-in account's confirmed address (null for anonymous requests), and always alert staff; never delays or fails the request. */
function notify(phone: string | null, email: string | null | undefined, reference: string, summary: string, confirmed = false) {
  // Confirmed on the spot (pay on site): staff still hear of it, the customer gets the confirmation instead of "received".
  if (confirmed) {
    after(() => Promise.all([notifyRequestFiled("keturraciai", { phone: null, email: null }, reference, summary), notifyRequestOutcome({ phone, email }, reference, "patvirtinta", summary)]));
    return;
  }
  after(() => notifyRequestFiled("keturraciai", { phone, email }, reference, summary));
}

/** "Pay on site" from a signed-in account: confirm the request just filed (see `confirmCashRequest`). */
const cashConfirmed = (v: { payOnSite?: boolean; viaAccount?: boolean }, supabase: Parameters<typeof confirmCashRequest>[0], reference: string) =>
  v.payOnSite && v.viaAccount ? confirmCashRequest(supabase, reference) : Promise.resolve(false);

export interface RequestReceipt {
  reference: string;
  total: number;
}

function rentalArgs(v: Omit<QuadRentalInput, "quadTypeId" | "units">, phone: string | null, email: string | undefined) {
  return {
    p_date: v.date,
    p_start_hour: v.startHour,
    p_hours: v.hours,
    p_riders: v.riders,
    p_name: v.customerName,
    p_email: email,
    p_phone: phone ?? undefined,
    p_note: v.note || undefined,
    p_discount_code: v.discountCode || undefined,
  };
}

export async function createQuadRental(input: QuadRentalInput): Promise<ActionResult<RequestReceipt>> {
  const parsed = quadRentalSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;

  // A bot that filled the honeypot gets the same answer as a person, and nothing is stored.
  if (v.website) return { data: { reference: "KT-0000", total: 0 } };
  const who = await requester(v);
  if (!who) return UNVERIFIED;
  const { supabase, phone, email, notifyEmail } = who;
  if (v.payOnSite && v.viaAccount && !phone) return PHONE_REQUIRED;

  const { data, error } = await supabase.rpc("create_quad_rental", {
    ...rentalArgs(v, phone, email),
    p_type_id: v.quadTypeId,
    p_units: v.units,
  });
  if (error) return dbFail(error);
  const confirmed = await cashConfirmed(v, supabase, data[0].reference);
  if (!v.awaitingPayment) notify(phone, notifyEmail, data[0].reference, describeRequest(["Keturraciai", v.date, hourLabel(v.startHour)]), confirmed);
  return { data: { reference: data[0].reference, total: data[0].total } };
}

export async function createMixedQuadRental(input: MixedQuadRentalInput): Promise<ActionResult<RequestReceipt>> {
  const parsed = mixedQuadRentalSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  if (v.website) return { data: { reference: "KT-0000", total: 0 } };
  const who = await requester(v);
  if (!who) return UNVERIFIED;
  const { supabase, phone, email, notifyEmail } = who;
  if (v.payOnSite && v.viaAccount && !phone) return PHONE_REQUIRED;

  const { data, error } = await supabase.rpc("create_mixed_quad_rental", {
    ...rentalArgs(v, phone, email),
    p_allocations: v.allocations.map((a) => ({ quad_type_id: a.quadTypeId, units: a.units })),
  });
  if (error) return dbFail(error);
  const units = v.allocations.reduce((sum, a) => sum + a.units, 0);
  const confirmed = await cashConfirmed(v, supabase, data[0].reference);
  if (!v.awaitingPayment) notify(phone, notifyEmail, data[0].reference, describeRequest(["Keturraciai", v.date, hourLabel(v.startHour), `${units} vnt.`]), confirmed);
  return { data: { reference: data[0].reference, total: data[0].total } };
}

export async function createQuadTourRental(input: QuadTourRentalInput): Promise<ActionResult<RequestReceipt>> {
  const parsed = quadTourRentalSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  if (v.website) return { data: { reference: "KT-0000", total: 0 } };
  const who = await requester(v);
  if (!who) return UNVERIFIED;
  const { supabase, phone, email, notifyEmail } = who;
  if (v.payOnSite && v.viaAccount && !phone) return PHONE_REQUIRED;

  // The database prices the tour from its route and gear rows and takes the quads from the fleet for the whole route.
  const { data, error } = await supabase.rpc("create_quad_tour_rental", {
    p_route_id: v.routeId,
    p_date: v.date,
    p_start_hour: v.startHour,
    p_units: v.units,
    p_accessories: v.accessories.map((g) => ({ id: g.id, units: g.units })),
    p_name: v.customerName,
    p_email: email,
    p_phone: phone ?? undefined,
    p_note: v.note || undefined,
    p_discount_code: v.discountCode || undefined,
  });
  if (error) return dbFail(error);
  const confirmed = await cashConfirmed(v, supabase, data[0].reference);
  if (!v.awaitingPayment) notify(phone, notifyEmail, data[0].reference, describeRequest(["Keturraciai", v.date, hourLabel(v.startHour), `${v.units} vnt.`]), confirmed);
  return { data: { reference: data[0].reference, total: data[0].total } };
}

export async function createTourTicket(input: TourTicketInput): Promise<ActionResult<RequestReceipt>> {
  const parsed = tourTicketSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  if (v.website) return { data: { reference: "KZ-0000", total: 0 } };
  const phone = verifiedPhone(v.verificationToken, v.customerPhone);
  if (!phone) return UNVERIFIED;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_tour_ticket", {
    p_event_id: v.eventId,
    p_people: v.people,
    p_name: v.customerName,
    p_email: v.customerEmail || undefined,
    p_phone: phone,
  });
  if (error) return dbFail(error);
  notify(phone, null, data[0].reference, describeRequest(["Zygis", `${v.people} asm.`]));
  return { data: { reference: data[0].reference, total: data[0].total } };
}
