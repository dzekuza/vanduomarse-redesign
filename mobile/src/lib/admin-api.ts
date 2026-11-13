import { z } from "zod";
import { isPermissionId, type StaffAccess } from "@/lib/admin/permissions";
import {
  toBlock,
  toBooking,
  toCoupon,
  toCouponProduct,
  toInquiry,
  toManagedEvent,
  toPaymentInfo,
  toPurchase,
  toQuadRental,
  toQuadSettings,
  toQuadTourAccessory,
  toQuadTourRoute,
  toQuadType,
  toRidePlan,
  toRider,
  toRiderCard,
  toRiderComment,
  toRiderDocument,
  toRiderSession,
  toRiderWaiver,
  toSauna,
  toSaunaMaster,
  toSaunaProgram,
  toStaffMember,
  toStaffRole,
  toStayType,
  toTourTicket,
  toUpsell,
} from "@/lib/admin/mappers";
import type {
  AdminData,
  Booking,
  BookingStatus,
  InquiryStatus,
  Purchase,
  QuadRental,
  Rider,
  RiderComment,
  RiderSession,
} from "@/lib/admin/types";
import { RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import { upsellTotal, type Upsell } from "@/lib/sauna-upsells";
import { siteBaseUrl, supabase, supabaseUrl } from "./supabase";

export type ActionResult<T = null> = { data: T } | { error: { message: string; code?: string } };

export const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({
  error: { message, code },
});

export interface DbError {
  code?: string;
  hint?: string | null;
  message: string;
}

export function mapDbError(e: DbError): { error: { message: string; code?: string } } {
  if (e.code === "23P01") {
    const byHint: Record<string, string> = {
      sauna_blocked: "Šis pirties laikas uždarytas.",
      sauna_booked: "Šis pirties laikas jau užimtas.",
      stay_full: "Visi šio tipo nameliai tomis naktimis užimti.",
      event_full: "Renginyje nebėra vietų.",
      quad_full: "Tiek keturračių šiuo laiku nebėra.",
    };
    return fail(byHint[e.hint ?? ""] ?? "Šis laikas jau užimtas – pasirinkite kitą.", "conflict");
  }
  if (e.code === "23503") return fail("Įrašas susietas su kitais duomenimis, todėl jo pašalinti negalima.", "in_use");
  if (e.code === "23505") return fail("Toks pavadinimas ar el. paštas jau naudojamas.", "duplicate");
  if (e.code === "23514") {
    const byHint: Record<string, string> = {
      coupon_balance: "Suma viršija kupono likutį.",
      coupon_inactive: "Kuponas neaktyvus: neapmokėtas, panaudotas arba atšauktas.",
      coupon_expired: "Kuponas pasibaigęs.",
      coupon_not_pending: "Užsakymas jau apmokėtas arba atšauktas.",
    };
    return fail(byHint[e.hint ?? ""] ?? "Netinkamos reikšmės.", "invalid");
  }
  if (e.code === "42501") return fail("Neturite teisės šiam veiksmui.", "forbidden");
  return fail("Nepavyko išsaugoti. Bandykite dar kartą.", "db");
}

/**
 * Resolves the signed-in user and their `public.staff` + `public.staff_roles` record.
 */
export async function fetchCurrentStaff() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { user: null, staff: null, access: null } as const;

  const { data: staff } = await supabase
    .from("staff")
    .select("user_id, display_name, email, active, role_id, staff_roles(name, is_owner, permissions)")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!staff) return { user: auth.user, staff: null, access: null } as const;

  const role = staff.staff_roles;
  const access: StaffAccess = {
    userId: staff.user_id,
    name: staff.display_name,
    email: staff.email || auth.user.email || "",
    roleId: staff.role_id,
    roleName: role?.name ?? "",
    isOwner: role?.is_owner ?? false,
    permissions: (role?.permissions ?? []).filter(isPermissionId),
  };
  return { user: auth.user, staff, access } as const;
}

async function readQuadRentals() {
  const result = await supabase
    .from("quad_rentals")
    .select("*, quad_rental_items(quad_type_id, units)")
    .order("date")
    .order("start_hour");

  return result.error?.code === "PGRST200"
    ? supabase.from("quad_rentals").select("*").order("date").order("start_hour")
    : result;
}

async function readRiderSessions(me: StaffAccess) {
  if (!me.isOwner && !me.permissions.includes("instruktorius")) return [];
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("rider_sessions")
    .select("*")
    .gte("started_at", since)
    .order("started_at", { ascending: false });
  if (error || !data) return [];
  return data.map(toRiderSession);
}

/**
 * Loads the operational admin dataset for the mobile app.
 */
export async function fetchMobileAdminData(me: StaffAccess): Promise<AdminData> {
  const [
    bookings,
    blocks,
    inquiries,
    events,
    saunas,
    upsells,
    programs,
    coupons,
    couponProducts,
    stayTypes,
    quadTypes,
    quadSettings,
    quadRentals,
    tourTickets,
    eventTickets,
    roles,
    staff,
    payments,
    ridePlans,
    riders,
    riderCards,
    riderSessions,
    purchases,
    riderComments,
    riderDocuments,
    riderWaivers,
    quadTourRoutes,
    quadTourAccessories,
    saunaMasters,
  ] = await Promise.all([
    supabase.from("bookings").select("*, booking_extras(name, unit, quantity)").order("date").order("start_hour"),
    supabase.from("sauna_blocks").select("*").order("date").order("hour"),
    supabase.from("inquiries").select("*, inquiry_notes(text, created_at)").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("date").order("start_time"),
    supabase.from("saunas").select("*, sauna_upsell_links(upsell_id)").order("sort_order").order("created_at"),
    supabase.from("sauna_upsells").select("*").order("sort_order"),
    supabase.from("sauna_programs").select("*").order("sort_order"),
    supabase.from("coupons").select("*, coupon_redemptions(id, amount, note, created_at)").order("created_at", { ascending: false }),
    supabase.from("coupon_products").select("*").order("sort_order"),
    supabase.from("stay_types").select("*").order("sort_order"),
    supabase.from("quad_types").select("*").order("sort_order"),
    supabase.from("quad_settings").select("*").single(),
    readQuadRentals(),
    supabase
      .from("event_tickets")
      .select("*, events!inner(title, date, start_time, category)")
      .eq("events.category", "keturratis")
      .order("created_at", { ascending: false }),
    supabase
      .from("event_tickets")
      .select("*, events!inner(title, date, start_time, category)")
      .neq("events.category", "keturratis")
      .order("created_at", { ascending: false }),
    supabase.from("staff_roles").select("*").order("is_owner", { ascending: false }).order("name"),
    supabase.from("staff").select("*").order("created_at"),
    supabase.from("payments").select("*"),
    supabase.from("ride_plans").select("*").order("sort_order"),
    supabase.from("riders").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("rider_cards").select("*"),
    readRiderSessions(me),
    supabase.from("purchases").select("*").order("sold_at", { ascending: false }).limit(500),
    supabase.from("rider_comments").select("*").order("created_at", { ascending: false }),
    supabase.from("rider_documents").select("*").order("uploaded_at", { ascending: false }),
    supabase.from("rider_waivers").select("*").order("signed_at", { ascending: false }),
    supabase.from("quad_tour_routes").select("*").order("sort_order").order("id"),
    supabase.from("quad_tour_accessories").select("*").order("sort_order").order("id"),
    supabase.from("sauna_masters").select("*").order("sort_order").order("created_at"),
  ]);

  const paymentById = new Map(
    (payments.data ?? []).flatMap((row) => {
      const info = toPaymentInfo(row);
      return info ? ([[row.id, info]] as const) : [];
    }),
  );
  const paymentOf = (id: string | null | undefined) => (id ? paymentById.get(id) : undefined);

  return {
    bookings: (bookings.data ?? []).map((r) => ({ ...toBooking(r), payment: paymentOf(r.payment_id) })),
    blocks: (blocks.data ?? []).map(toBlock),
    inquiries: (inquiries.data ?? []).map(toInquiry),
    events: (events.data ?? []).map(toManagedEvent),
    prices: [],
    saunas: (saunas.data ?? []).map((r) => toSauna(r, r.sauna_upsell_links, supabaseUrl)),
    upsells: (upsells.data ?? []).map(toUpsell),
    saunaMasters: (saunaMasters.data ?? []).map(toSaunaMaster),
    programs: (programs.data ?? []).map(toSaunaProgram),
    coupons: (coupons.data ?? []).map(toCoupon),
    couponProducts: (couponProducts.data ?? []).map(toCouponProduct),
    discountCodes: [],
    stayTypes: (stayTypes.data ?? []).map(toStayType),
    quadTypes: (quadTypes.data ?? []).map(toQuadType),
    quadSettings: quadSettings.data
      ? toQuadSettings(quadSettings.data)
      : { openHour: 10, closeHour: 20, maxHours: 3, deposit: 0, minAge: 18, rules: "", tourCancellationNote: "" },
    quadTourRoutes: (quadTourRoutes.data ?? []).map(toQuadTourRoute),
    quadTourAccessories: (quadTourAccessories.data ?? []).map(toQuadTourAccessory),
    quadRentals: (quadRentals.data ?? []).map((r) => ({ ...toQuadRental(r), payment: paymentOf(r.payment_id) })),
    tourTickets: (tourTickets.data ?? []).map((r) => ({ ...toTourTicket(r), payment: paymentOf(r.payment_id) })),
    eventTickets: (eventTickets.data ?? []).map((r) => ({ ...toTourTicket(r), payment: paymentOf(r.payment_id) })),
    me,
    roles: (roles.data ?? []).map(toStaffRole),
    staff: me.isOwner ? (staff.data ?? []).map(toStaffMember) : [],
    notificationRecipients: [],
    notifications: [],
    notificationsReadAt: null,
    siteSettings: null,
    pageContent: {},
    riderAccountIds: [],
    ridePlans: (ridePlans.data ?? []).map(toRidePlan),
    riders: (riders.data ?? []).map(toRider),
    riderCards: (riderCards.data ?? []).map(toRiderCard),
    riderSessions,
    purchases: (purchases.data ?? []).map(toPurchase),
    riderComments: (riderComments.data ?? []).map(toRiderComment),
    riderDocuments: (riderDocuments.data ?? []).map(toRiderDocument),
    riderWaivers: (riderWaivers.data ?? []).map(toRiderWaiver),
  };
}

/**
 * Calls the Next.js `/api/admin/mobile-action` endpoint with the current Bearer token
 * so customer SMS/email notifications fire when confirming/cancelling web bookings
 * or activating coupons. If the Next.js server is unreachable (e.g. offline/direct DB),
 * falls back to direct Supabase updates for booking/rental/ticket statuses.
 */
async function callServerAction<T = null>(payload: Record<string, unknown>): Promise<ActionResult<T> | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return fail("Prisijunkite iš naujo.", "unauthorized");

    const res = await fetch(`${siteBaseUrl}/api/admin/mobile-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as ActionResult<T>;
    return json;
  } catch {
    return null;
  }
}

export async function setBookingStatusMobile(id: string, status: BookingStatus): Promise<ActionResult> {
  const remote = await callServerAction({ action: "setBookingStatus", id, status });
  if (remote) return remote;
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  return error ? mapDbError(error) : { data: null };
}

export async function setRentalStatusMobile(id: string, status: BookingStatus): Promise<ActionResult> {
  const remote = await callServerAction({ action: "setRentalStatus", id, status });
  if (remote) return remote;
  const { error } = await supabase.from("quad_rentals").update({ status }).eq("id", id);
  return error ? mapDbError(error) : { data: null };
}

export async function setTourTicketStatusMobile(id: string, status: BookingStatus): Promise<ActionResult> {
  const remote = await callServerAction({ action: "setTourTicketStatus", id, status });
  if (remote) return remote;
  const { error } = await supabase.from("event_tickets").update({ status }).eq("id", id);
  return error ? mapDbError(error) : { data: null };
}

export async function cancelRequestMobile(
  kind: "booking" | "rental" | "ticket",
  id: string,
  refund: boolean,
): Promise<ActionResult<{ refunded: number; refundError?: string }>> {
  const remote = await callServerAction<{ refunded: number; refundError?: string }>({
    action: "cancelRequest",
    kind,
    id,
    refund,
  });
  if (remote) return remote;

  if (refund) {
    return fail("Nepavyko pasiekti serverio grąžinimui per Stripe. Patikrinkite ryšį.", "network");
  }
  const res =
    kind === "booking"
      ? await setBookingStatusMobile(id, "atsaukta")
      : kind === "rental"
        ? await setRentalStatusMobile(id, "atsaukta")
        : await setTourTicketStatusMobile(id, "atsaukta");
  return "error" in res ? res : { data: { refunded: 0 } };
}

export async function toggleBlockMobile(
  saunaId: string,
  date: string,
  hour: number,
  userId: string,
  reason = "Uždaryta",
): Promise<ActionResult> {
  const { data: existing } = await supabase
    .from("sauna_blocks")
    .select("id")
    .eq("sauna_id", saunaId)
    .eq("date", date)
    .eq("hour", hour)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("sauna_blocks").delete().eq("id", existing.id)
    : await supabase.from("sauna_blocks").insert({ sauna_id: saunaId, date, hour, reason, created_by: userId });

  return error ? mapDbError(error) : { data: null };
}

export interface NewBookingMobileInput {
  kind: "pirtis" | "namelis" | "kemperis";
  saunaId?: string;
  date: string;
  startHour?: number;
  hours?: number;
  nights?: number;
  guests: number;
  customer: { name: string; phone: string; email: string };
  extras: Record<string, number>;
  total: number;
  status: "patvirtinta" | "laukia";
  source: "telefonu" | "vietoje";
  note: string;
}

export async function createBookingMobile(input: NewBookingMobileInput): Promise<ActionResult<Booking>> {
  const sauna = input.kind === "pirtis";
  let stayTypeId: string | null = null;

  if (!sauna) {
    const { data } = await supabase
      .from("stay_types")
      .select("id, max_guests")
      .eq("kind", input.kind)
      .eq("active", true)
      .order("max_guests");
    const fits = (data ?? []).find((t) => t.max_guests >= input.guests) ?? data?.at(-1);
    stayTypeId = fits?.id ?? null;
  }

  const { data: row, error } = await supabase
    .from("bookings")
    .insert({
      reference: undefined as unknown as string,
      kind: input.kind,
      sauna_id: sauna ? (input.saunaId ?? null) : null,
      customer_name: input.customer.name.trim(),
      customer_phone: input.customer.phone.trim() || null,
      customer_email: input.customer.email.trim() || null,
      date: input.date,
      start_hour: sauna ? (input.startHour ?? null) : null,
      hours: sauna ? (input.hours ?? null) : null,
      nights: sauna ? null : (input.nights ?? 1),
      stay_type_id: stayTypeId,
      guests: input.guests,
      total: input.total,
      status: input.status,
      source: input.source,
      note: input.note.trim() || null,
    })
    .select("id")
    .single();

  if (error) return mapDbError(error);

  if (sauna && input.saunaId) {
    const { data: links } = await supabase
      .from("sauna_upsell_links")
      .select("sauna_upsells(*)")
      .eq("sauna_id", input.saunaId);
    const upsells = (links ?? []).flatMap((l) => (l.sauna_upsells?.active ? [l.sauna_upsells] : []));
    const lines = upsells
      .map((u) => ({ u, qty: input.extras[u.id] ?? 0 }))
      .filter(({ qty }) => qty > 0)
      .map(({ u, qty }) => {
        const upsell: Upsell = {
          id: u.id,
          name: u.name,
          description: u.description,
          price: u.price,
          unit: u.unit,
          maxQty: u.max_qty,
          minHours: u.min_hours,
          active: u.active,
        };
        return {
          booking_id: row.id,
          upsell_id: u.id,
          name: u.name,
          unit: u.unit,
          unit_price: u.price,
          quantity: u.unit === "vienetui" ? qty : 1,
          line_total: upsellTotal(upsell, qty, { partySize: input.guests, hours: input.hours ?? 0 }),
        };
      });

    if (lines.length) {
      const { error: extrasError } = await supabase.from("booking_extras").insert(lines);
      if (extrasError) {
        await supabase.from("bookings").delete().eq("id", row.id);
        return mapDbError(extrasError);
      }
    }
  }

  const { data: saved, error: readError } = await supabase
    .from("bookings")
    .select("*, booking_extras(name, unit, quantity)")
    .eq("id", row.id)
    .single();

  if (readError || !saved) return mapDbError(readError ?? { message: "Read failed" });
  return { data: toBooking(saved) };
}

export async function setInquiryStatusMobile(id: string, status: InquiryStatus): Promise<ActionResult> {
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  return error ? mapDbError(error) : { data: null };
}

export async function addInquiryNoteMobile(id: string, text: string, userId: string): Promise<ActionResult> {
  const trimmed = text.trim();
  if (!trimmed) return fail("Pastaba tuščia.", "invalid");
  const { error } = await supabase.from("inquiry_notes").insert({ inquiry_id: id, text: trimmed, author_id: userId });
  return error ? mapDbError(error) : { data: null };
}

export async function acceptInquiryMobile(id: string): Promise<ActionResult> {
  const { error } = await supabase.rpc("accept_inquiry_stays", { p_inquiry_id: id });
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
    return error.hint && byHint[error.hint] ? fail(byHint[error.hint], "invalid") : mapDbError(error);
  }
  return { data: null };
}

export async function releaseInquiryMobile(id: string): Promise<ActionResult> {
  const { error } = await supabase.rpc("release_inquiry_stays", { p_inquiry_id: id });
  return error ? mapDbError(error) : { data: null };
}

export async function activateCouponMobile(
  id: string,
): Promise<ActionResult<{ code: string; expiresAt: string; emailSent: boolean }>> {
  const remote = await callServerAction<{ code: string; expiresAt: string; emailSent: boolean }>({
    action: "activateCoupon",
    id,
  });
  if (remote) return remote;

  const { data, error } = await supabase.rpc("activate_coupon", { p_id: id });
  if (error) return mapDbError(error);
  const issued = data[0];
  return { data: { code: issued.code, expiresAt: issued.expires_at, emailSent: false } };
}

export async function redeemCouponMobile(
  id: string,
  amount: number,
  note: string,
  userId: string,
): Promise<ActionResult> {
  const rounded = Math.round(amount * 100) / 100;
  if (!(rounded > 0)) return fail("Netinkama suma.", "invalid");
  const { error } = await supabase.from("coupon_redemptions").insert({
    coupon_id: id,
    amount: rounded,
    note: note.trim(),
    redeemed_by: userId,
  });
  return error ? mapDbError(error) : { data: null };
}

export async function cancelCouponMobile(id: string): Promise<ActionResult> {
  const { error } = await supabase
    .from("coupons")
    .update({ status: "atsauktas" })
    .eq("id", id)
    .in("status", ["laukia_apmokejimo", "aktyvus"]);
  return error ? mapDbError(error) : { data: null };
}

const cardNumberSchema = z.string().regex(/^[0-9]{6,32}$/);

export interface RiderSessionScanResult {
  rider: Rider;
  session: RiderSession;
  action: "checked_in" | "checked_out";
}

export async function scanRiderSessionMobile(
  scannedCardNumber: string,
): Promise<ActionResult<RiderSessionScanResult>> {
  const parsed = cardNumberSchema.safeParse(scannedCardNumber);
  if (!parsed.success) return fail("Netinkama apyrankė.", "invalid");
  const card = parsed.data;

  const { data: binding } = await supabase
    .from("rider_cards")
    .select("rider_id")
    .eq("card_number", card)
    .maybeSingle();

  if (!binding) return fail("Apyrankė nepriskirta jokiam naudotojui.", "not_found");

  const { data: riderRow } = await supabase.from("riders").select("*").eq("id", binding.rider_id).maybeSingle();
  if (!riderRow) return fail("Naudotojas nerastas.", "not_found");
  const rider = toRider(riderRow);

  const { data: open } = await supabase
    .from("rider_sessions")
    .select("*")
    .eq("rider_id", rider.id)
    .is("ended_at", null)
    .maybeSingle();

  if (open) {
    const { data, error } = await supabase
      .from("rider_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", open.id)
      .select("*")
      .single();
    if (error) return mapDbError(error);
    return { data: { rider, session: toRiderSession(data), action: "checked_out" } };
  }

  const { data, error } = await supabase
    .from("rider_sessions")
    .insert({ rider_id: rider.id, card_number: card })
    .select("*")
    .single();
  if (error) return mapDbError(error);
  return { data: { rider, session: toRiderSession(data), action: "checked_in" } };
}

export async function bindRiderCardMobile(
  scannedCardNumber: string,
  riderId: string,
): Promise<ActionResult<{ replaced: Rider | null }>> {
  const parsed = cardNumberSchema.safeParse(scannedCardNumber);
  if (!parsed.success) return fail("Netinkama apyrankė (6–32 skaitmenys).", "invalid");
  const card = parsed.data;

  const { data: existing } = await supabase
    .from("rider_cards")
    .select("rider_id")
    .eq("card_number", card)
    .maybeSingle();

  let replaced: Rider | null = null;
  if (existing && existing.rider_id !== riderId) {
    const { data: prevRider } = await supabase.from("riders").select("*").eq("id", existing.rider_id).maybeSingle();
    replaced = prevRider ? toRider(prevRider) : null;
  }

  const { error: deleteError } = await supabase
    .from("rider_cards")
    .delete()
    .or(`card_number.eq.${card},rider_id.eq.${riderId}`);
  if (deleteError) return mapDbError(deleteError);

  const { error } = await supabase.from("rider_cards").insert({ card_number: card, rider_id: riderId });
  return error ? mapDbError(error) : { data: { replaced } };
}

async function recordPurchaseMobile(riderId: string, planId: string, userId: string): Promise<Purchase | null> {
  const { data: plan } = await supabase
    .from("ride_plans")
    .select("name, category, price")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return null;
  const { data, error } = await supabase
    .from("purchases")
    .insert({
      rider_id: riderId,
      plan_id: planId,
      plan_name: plan.name,
      plan_category: plan.category,
      price: plan.price,
      sold_by: userId,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return toPurchase(data);
}

export async function createRiderMobile(
  input: { name: string; surname: string; planId: string },
  userId: string,
): Promise<ActionResult<{ rider: Rider; purchase: Purchase | null }>> {
  const name = input.name.trim();
  const surname = input.surname.trim();
  if (!name || !surname || !input.planId) return fail("Užpildykite vardą, pavardę ir planą.", "invalid");

  const { data, error } = await supabase
    .from("riders")
    .insert({ name, surname, plan_id: input.planId })
    .select("*")
    .single();
  if (error) return mapDbError(error);
  const rider = toRider(data);
  const purchase = await recordPurchaseMobile(rider.id, input.planId, userId);
  return { data: { rider, purchase } };
}

export async function updateRiderPlanMobile(
  riderId: string,
  planId: string,
  userId: string,
): Promise<ActionResult<{ purchase: Purchase | null }>> {
  const { error } = await supabase.from("riders").update({ plan_id: planId }).eq("id", riderId);
  if (error) return mapDbError(error);
  const purchase = await recordPurchaseMobile(riderId, planId, userId);
  return { data: { purchase } };
}

export async function addRiderCommentMobile(
  riderId: string,
  text: string,
  userId: string,
  staffName: string,
): Promise<ActionResult<RiderComment>> {
  const trimmed = text.trim();
  if (!trimmed) return fail("Komentaras tuščias.", "invalid");
  const { data, error } = await supabase
    .from("rider_comments")
    .insert({
      rider_id: riderId,
      text: trimmed,
      author_id: userId,
      author_name: staffName || "Darbuotojas",
    })
    .select("*")
    .single();
  if (error) return mapDbError(error);
  return { data: toRiderComment(data) };
}

export async function searchRidersMobile(query: string, limit = 40): Promise<Rider[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q}%`;
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .or(`name.ilike.${pattern},surname.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(toRider);
}

export async function getRiderByCardMobile(cardNumber: string): Promise<Rider | null> {
  const { data: card } = await supabase
    .from("rider_cards")
    .select("rider_id")
    .eq("card_number", cardNumber)
    .maybeSingle();
  if (!card) return null;
  const { data: row } = await supabase.from("riders").select("*").eq("id", card.rider_id).maybeSingle();
  return row ? toRider(row) : null;
}

export async function getSignedStorageUrl(
  bucket: "rider-photos" | "rider-documents" | "rider-waivers",
  path: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export { RIDE_PLAN_CATEGORIES, QuadRental };
