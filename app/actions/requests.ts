"use server";

import { after } from "next/server";
import type { ActionResult } from "@/app/admin/actions";
import {
  eventRegistrationSchema,
  eventTicketSchema,
  inquirySchema,
  saunaBookingSchema,
  stayBookingSchema,
  type EventRegistrationInput,
  type EventTicketInput,
  type InquiryInput,
  type SaunaBookingInput,
  type StayBookingInput,
} from "@/lib/request-schema";
import type { Json } from "@/lib/supabase/database.types";
import { UNVERIFIED, verifiedPhone } from "@/lib/phone-verification";
import { describeRequest, notifyBookingReceived, notifyReceived, notifyStaff, saunaSummary } from "@/lib/sms/notify";
import { todayKey, vilniusHour } from "@/lib/sauna";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Public booking, ticket and inquiry actions. They run as the anonymous role:
 * the database only lets anon file these through security definer functions
 * (price, limits and availability come from the rows), never touch the tables.
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

interface DbError {
  code?: string;
  hint?: string | null;
}

const BY_HINT: Record<string, string> = {
  sauna_unavailable: "Ši pirtis šiuo metu nerezervuojama. Atnaujinkite puslapį.",
  sauna_closed: "Pasirinktas laikas už darbo valandų.",
  sauna_party: "Netinkamas žmonių skaičius.",
  sauna_past: "Pasirinkta data jau praėjo arba yra per toli.",
  sauna_blocked: "Šis laikas pirtyje uždarytas. Pasirinkite kitą.",
  sauna_booked: "Šis laikas jau užimtas. Pasirinkite kitą.",
  extra_unavailable: "Pasirinkto priedo šiuo metu nėra. Atnaujinkite puslapį.",
  coupon_invalid: "Kuponas negalioja šiai paslaugai.",
  stay_unavailable: "Šio nakvynės tipo šiuo metu nėra. Atnaujinkite puslapį.",
  stay_guests: "Per daug svečių pasirinktam nakvynės tipui.",
  stay_nights: "Netinkamas naktų skaičius.",
  stay_past: "Pasirinkta data jau praėjo arba yra per toli.",
  stay_full: "Šioms naktims laisvų vietų nebeliko. Pasirinkite kitą datą.",
  event_unavailable: "Šis renginys nebeprieinamas. Atnaujinkite puslapį.",
  event_people: "Netinkamas žmonių skaičius.",
  event_full: "Renginyje nebeliko tiek vietų.",
  inquiry_guests: "Netinkamas svečių skaičius.",
  inquiry_input: "Per daug duomenų užklausoje.",
  contact_invalid: "Nurodykite teisingą el. paštą arba telefoną (bent 8 skaitmenys).",
  too_many_pending: "Jau turite kelias nepatvirtintas užklausas. Palaukite patvirtinimo arba skambinkite.",
  too_many_requests: "Šiuo metu priimame per daug užklausų. Bandykite vėliau arba skambinkite.",
  phone_unverified: UNVERIFIED.error.message,
};

function dbFail(e: DbError, taken?: string) {
  const message = BY_HINT[e.hint ?? ""];
  if (message) return fail(message, e.hint ?? undefined);
  // The sauna overlap exclusion constraint has no hint.
  if (e.code === "23P01" && taken) return fail(taken, "taken");
  return fail("Nepavyko pateikti užklausos. Bandykite dar kartą.", "db");
}

export interface BookingReceipt {
  reference: string;
  total: number;
  discount: number;
}

export interface TicketReceipt {
  reference: string;
  total: number;
}

const TAKEN = "Šis laikas jau užimtas. Pasirinkite kitą.";

/** SMS the visitor and the staff alert line once the request is stored; never delays or fails the booking. */
function notify(
  phone: string,
  reference: string | undefined,
  summary: string,
  toCustomer: (phone: string, reference: string | undefined, summary: string) => Promise<boolean> = notifyReceived,
) {
  after(async () => {
    await Promise.all([toCustomer(phone, reference, summary), notifyStaff(reference, summary)]);
  });
}

export async function createSaunaBooking(input: SaunaBookingInput): Promise<ActionResult<BookingReceipt>> {
  const parsed = saunaBookingSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  // A bot that filled the honeypot gets the same answer as a person, and nothing is stored.
  if (v.website) return { data: { reference: "PM-0000", total: 0, discount: 0 } };
  // The page may have been open for hours: a start that has passed since is refused here too.
  const today = todayKey();
  if (v.date < today || (v.date === today && v.startHour <= vilniusHour())) {
    return fail("Šis laikas jau praėjo. Pasirinkite kitą.", "taken");
  }
  const phone = verifiedPhone(v.verificationToken, v.customerPhone);
  if (!phone) return UNVERIFIED;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_sauna_booking", {
    p_sauna_id: v.saunaId,
    p_date: v.date,
    p_start_hour: v.startHour,
    p_hours: v.hours,
    p_party: v.party,
    p_extras: v.extras,
    p_name: v.customerName,
    p_email: v.customerEmail || undefined,
    p_phone: phone,
    p_coupon: v.coupon || undefined,
  });
  if (error) return dbFail(error, TAKEN);
  notify(
    phone,
    data[0].reference,
    saunaSummary({ date: v.date, startHour: v.startHour, hours: v.hours, party: v.party, total: data[0].total }),
    notifyBookingReceived,
  );
  return { data: { reference: data[0].reference, total: data[0].total, discount: data[0].discount } };
}

export async function createStayBooking(input: StayBookingInput): Promise<ActionResult<BookingReceipt>> {
  const parsed = stayBookingSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  if (v.website) return { data: { reference: "MM-0000", total: 0, discount: 0 } };
  const phone = verifiedPhone(v.verificationToken, v.customerPhone);
  if (!phone) return UNVERIFIED;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_stay_booking", {
    p_stay_type_id: v.stayTypeId,
    p_date: v.date,
    p_nights: v.nights,
    p_guests: v.guests,
    p_name: v.customerName,
    p_email: v.customerEmail || undefined,
    p_phone: phone,
    p_coupon: v.coupon || undefined,
  });
  if (error) return dbFail(error, BY_HINT.stay_full);
  notify(phone, data[0].reference, describeRequest(["Nakvyne", v.date, `${v.nights} n.`]));
  return { data: { reference: data[0].reference, total: data[0].total, discount: data[0].discount } };
}

export async function createEventTicket(input: EventTicketInput): Promise<ActionResult<TicketReceipt>> {
  const parsed = eventTicketSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  if (v.website) return { data: { reference: "PR-0000", total: 0 } };
  const phone = verifiedPhone(v.verificationToken, v.customerPhone);
  if (!phone) return UNVERIFIED;

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("create_event_ticket", {
    p_event_id: v.eventId,
    p_people: v.people,
    p_name: v.customerName,
    p_email: v.customerEmail || undefined,
    p_phone: phone,
  });
  if (error) return dbFail(error, BY_HINT.event_full);
  notify(phone, data[0].reference, describeRequest(["Bilietai", `${v.people} asm.`]));
  return { data: { reference: data[0].reference, total: data[0].total } };
}

export async function registerForEvent(input: EventRegistrationInput): Promise<ActionResult<null>> {
  const parsed = eventRegistrationSchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  if (v.website) return { data: null };
  const phone = verifiedPhone(v.verificationToken, v.customerPhone);
  if (!phone) return UNVERIFIED;

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("register_for_event", {
    p_event_id: v.eventId,
    p_people: v.people,
    p_name: v.customerName,
    p_email: v.customerEmail || undefined,
    p_phone: phone,
    p_message: v.message || undefined,
  });
  if (error) return dbFail(error);
  notify(phone, undefined, describeRequest(["Registracija", `${v.people} asm.`]));
  return { data: null };
}

export async function createInquiry(input: InquiryInput): Promise<ActionResult<null>> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite užklausos duomenis.", "invalid");
  const v = parsed.data;
  if (v.website) return { data: null };

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("create_inquiry", {
    p_event_type: v.eventType,
    p_date: v.date || null,
    p_guests: v.guests,
    p_space: v.space,
    p_estimate_min: v.estimateMin,
    p_estimate_max: v.estimateMax,
    p_input: v.calculatorInput as Json,
    p_message: v.message,
    p_name: v.customerName,
    p_email: v.customerEmail || undefined,
    p_phone: v.customerPhone || undefined,
  });
  if (error) return dbFail(error);
  notify(v.customerPhone, undefined, describeRequest(["Skaiciuokle", `${v.guests} sv.`]));
  return { data: null };
}
