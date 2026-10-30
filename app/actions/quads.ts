"use server";

import { after } from "next/server";
import type { ActionResult } from "@/app/admin/actions";
import { quadRentalSchema, tourTicketSchema, type QuadRentalInput, type TourTicketInput } from "@/lib/quad-schema";
import { UNVERIFIED, verifiedPhone } from "@/lib/phone-verification";
import { describeRequest, notifyReceived, notifyStaff } from "@/lib/sms/notify";
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
  quad_riders: "Per daug važiuotojų pasirinktam keturračių skaičiui.",
  quad_full: "Šiuo laiku tiek keturračių nebėra. Pasirinkite kitą laiką.",
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

/** SMS the visitor and the staff alert line once the request is stored; never delays or fails the request. */
function notify(phone: string, reference: string, summary: string) {
  after(async () => {
    await Promise.all([notifyReceived(phone, reference, summary), notifyStaff(reference, summary)]);
  });
}

export interface RequestReceipt {
  reference: string;
  total: number;
}

export async function createQuadRental(input: QuadRentalInput): Promise<ActionResult<RequestReceipt>> {
  const parsed = quadRentalSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;

  // A bot that filled the honeypot gets the same answer as a person, and nothing is stored.
  if (v.website) return { data: { reference: "KT-0000", total: 0 } };
  const phone = verifiedPhone(v.verificationToken, v.customerPhone);
  if (!phone) return UNVERIFIED;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_quad_rental", {
    p_type_id: v.quadTypeId,
    p_date: v.date,
    p_start_hour: v.startHour,
    p_hours: v.hours,
    p_units: v.units,
    p_riders: v.riders,
    p_name: v.customerName,
    p_email: v.customerEmail || undefined,
    p_phone: phone,
    p_note: v.note || undefined,
  });
  if (error) return dbFail(error);
  notify(phone, data[0].reference, describeRequest(["Keturraciai", v.date, `${String(v.startHour).padStart(2, "0")}:00`]));
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
  notify(phone, data[0].reference, describeRequest(["Zygis", `${v.people} asm.`]));
  return { data: { reference: data[0].reference, total: data[0].total } };
}
