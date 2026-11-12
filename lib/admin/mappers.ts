import { isPermissionId } from "@/lib/admin/permissions";
import type { StayType } from "@/lib/cabin";
import type { CouponProduct } from "@/lib/coupons";
import { isDiscountService, type DiscountCode } from "@/lib/discount-codes";
import type { QuadSettings, QuadTourAccessory, QuadTourRoute, QuadType } from "@/lib/quads";
import type { Tables } from "@/lib/supabase/database.types";
import { saunaPhotoUrl, type PriceTable, type Sauna, type SaunaRates } from "@/lib/sauna";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { SaunaMaster } from "@/lib/sauna-masters";
import type { Upsell } from "@/lib/sauna-upsells";
import { isNotificationTopic } from "@/lib/notification-topics";
import type { Block, Booking, Coupon, Inquiry, ManagedEvent, PaymentInfo, PaymentStatus, PriceItem, Purchase, NotificationRecipient, QuadRental, Rider, RiderCard, RiderComment, RiderDocument, RiderSession, RiderWaiver, RidePlan, RidePlanCategory, StaffMember, StaffRole, TourTicket } from "./types";

/**
 * Database rows (snake_case, nulls) -> app models (camelCase, optionals).
 * Pure functions, shared by the admin loader and the public data layer.
 */

type BookingRow = Tables<"bookings"> & { booking_extras: Pick<Tables<"booking_extras">, "name" | "unit" | "quantity">[] };
type CouponRow = Tables<"coupons"> & { coupon_redemptions: Pick<Tables<"coupon_redemptions">, "id" | "amount" | "note" | "created_at">[] };
type TicketRow = Tables<"event_tickets"> & { events: Pick<Tables<"events">, "title" | "date" | "start_time"> };
type InquiryRow = Tables<"inquiries"> & { inquiry_notes: Pick<Tables<"inquiry_notes">, "text" | "created_at">[] };
type QuadRentalRow = Tables<"quad_rentals"> & { quad_rental_items?: Pick<Tables<"quad_rental_items">, "quad_type_id" | "units">[] };

const PAYMENT_STATUSES: readonly string[] = ["laukia", "apmoketa", "pasibaige", "nepavyko", "grazinta"];
const isPaymentStatus = (value: string): value is PaymentStatus => PAYMENT_STATUSES.includes(value);

export function toPaymentInfo(r: Tables<"payments">): PaymentInfo | null {
  if (!isPaymentStatus(r.status)) return null;
  return { id: r.id, status: r.status, amount: r.amount, refunded: r.refunded, paidAt: r.paid_at ?? undefined, needsReview: r.needs_review };
}

/** "19:00:00" -> "19:00" */
export const toHHMM = (time: string) => time.slice(0, 5);

export function toBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    reference: r.reference,
    kind: r.kind,
    customer: { name: r.customer_name, email: r.customer_email ?? "", phone: r.customer_phone ?? "" },
    date: r.date,
    startHour: r.start_hour ?? undefined,
    hours: r.hours ?? undefined,
    nights: r.nights ?? undefined,
    stayTypeId: r.stay_type_id ?? undefined,
    stayUnits: r.kind === "pirtis" ? undefined : (r.stay_units ?? 1),
    saunaId: r.sauna_id ?? undefined,
    guests: r.guests,
    extras: r.booking_extras.map((x) => (x.unit === "vienetui" ? `${x.name} × ${x.quantity}` : x.name)),
    total: r.total,
    status: r.status,
    createdAt: r.created_at,
    source: r.source,
    note: r.note ?? undefined,
    riderId: r.rider_id ?? undefined,
  };
}

export function toBlock(r: Tables<"sauna_blocks">): Block {
  return { id: r.id, saunaId: r.sauna_id, date: r.date, hour: r.hour, reason: r.reason };
}

export function toInquiry(r: InquiryRow): Inquiry {
  return {
    id: r.id,
    createdAt: r.created_at,
    customer: { name: r.customer_name, email: r.customer_email ?? "", phone: r.customer_phone ?? "" },
    source: r.source,
    eventType: r.event_type,
    date: r.date ?? "",
    guests: r.guests,
    space: r.space,
    estimate: r.estimate_min !== null && r.estimate_max !== null ? { min: r.estimate_min, max: r.estimate_max } : null,
    message: r.message,
    status: r.status,
    notes: r.inquiry_notes
      .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
      .map((n) => ({ at: n.created_at, text: n.text })),
    ...inquiryStays(r.calculator_input),
    saunas: inquirySaunas(r.calculator_input),
    acceptedAt: r.accepted_at ?? undefined,
  };
}

function pickExtras(extras: unknown): Record<string, number> {
  if (typeof extras !== "object" || extras === null || Array.isArray(extras)) return {};
  return Object.fromEntries(Object.entries(extras).flatMap(([id, qty]) => (Number.isInteger(qty) && Number(qty) > 0 ? [[id, Number(qty)] as const] : [])));
}

/** The saunas in a calculator quote (`saunas`: sauna id -> hours, start hour or null). */
function inquirySaunas(input: Tables<"inquiries">["calculator_input"]): Inquiry["saunas"] {
  const record = typeof input === "object" && input !== null && !Array.isArray(input) ? input : {};
  const picked = record.saunas;
  if (typeof picked !== "object" || picked === null || Array.isArray(picked)) return [];
  return Object.entries(picked).flatMap(([saunaId, pick]) => {
    if (typeof pick !== "object" || pick === null || Array.isArray(pick)) return [];
    const hours = Number(pick.hours);
    const start = pick.startHour;
    return Number.isInteger(hours) && hours > 0
      ? [{ saunaId, hours, startHour: typeof start === "number" && Number.isInteger(start) ? start : null, programId: typeof pick.programId === "string" && pick.programId ? pick.programId : null, extras: pickExtras(pick.extras) }]
      : [];
  });
}

/** The cabins in a calculator quote: `cabinUnits` (stay type id -> count; the first calculator keyed by size, "2" / "4") and `cabinNights`. */
function inquiryStays(input: Tables<"inquiries">["calculator_input"]): Pick<Inquiry, "stays" | "stayNights"> {
  const record = typeof input === "object" && input !== null && !Array.isArray(input) ? input : {};
  const units = record.cabinUnits;
  const nights = Number(record.cabinNights);
  const stays = typeof units === "object" && units !== null && !Array.isArray(units)
    ? Object.entries(units).flatMap(([key, count]) => {
        const n = Number(count);
        return Number.isInteger(n) && n > 0 ? [{ typeId: /^\d+$/.test(key) ? `namelis-${key}` : key, units: n }] : [];
      })
    : [];
  return { stays, stayNights: Number.isInteger(nights) && nights >= 1 ? nights : 1 };
}

export function toManagedEvent(r: Tables<"events">): ManagedEvent {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    date: r.date,
    time: toHHMM(r.start_time),
    durationMinutes: r.duration_minutes ?? undefined,
    place: r.place,
    blurb: r.blurb,
    price: r.price,
    capacity: r.capacity,
    sold: r.sold,
    published: r.published,
    calendarPrivate: r.calendar_private ?? false,
    programId: r.program_id ?? undefined,
    tourRouteId: r.tour_route_id ?? undefined,
  };
}

export function toPriceItem(r: Tables<"price_items">): PriceItem {
  return { id: r.id, group: r.group, label: r.label, unit: r.unit, value: r.value, max: r.max ?? undefined };
}

type RatesRow = Pick<
  Tables<"saunas">,
  | "weekday_prices" | "weekend_prices" | "included_guests" | "extra_guest_fee" | "turnaround_hours"
  | "max_party" | "min_hours" | "max_hours" | "open_hour" | "close_hour"
>;

/** `{ "2": 160 }` from the database -> `{ 2: 160 }`; anything that is not a price is dropped. */
function toPriceTable(value: Tables<"saunas">["weekday_prices"]): PriceTable {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const table: PriceTable = {};
  for (const [hours, price] of Object.entries(value)) if (typeof price === "number") table[Number(hours)] = price;
  return table;
}

export function toSaunaRates(r: RatesRow): SaunaRates {
  return {
    weekdayPrices: toPriceTable(r.weekday_prices),
    weekendPrices: toPriceTable(r.weekend_prices),
    includedGuests: r.included_guests,
    extraGuestFee: r.extra_guest_fee,
    turnaroundHours: r.turnaround_hours,
    maxParty: r.max_party,
    minHours: r.min_hours,
    maxHours: r.max_hours,
    openHour: r.open_hour,
    closeHour: r.close_hour,
  };
}

/** Model -> `saunas` rate columns. The shortest and longest length are derived from the tables. */
export function fromSaunaRates(r: SaunaRates): RatesRow {
  const lengths = [...Object.keys(r.weekdayPrices), ...Object.keys(r.weekendPrices)].map(Number);
  return {
    weekday_prices: r.weekdayPrices,
    weekend_prices: r.weekendPrices,
    included_guests: r.includedGuests,
    extra_guest_fee: r.extraGuestFee,
    turnaround_hours: r.turnaroundHours,
    max_party: r.maxParty,
    min_hours: Math.min(...lengths),
    max_hours: Math.max(...lengths),
    open_hour: r.openHour,
    close_hour: r.closeHour,
  };
}

/** `links` are the sauna's rows of `sauna_upsell_links`; photo paths become public URLs of `supabaseUrl`. */
export function toSauna(r: Tables<"saunas">, links: Pick<Tables<"sauna_upsell_links">, "upsell_id">[], supabaseUrl: string): Sauna {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    features: r.features,
    photos: r.photos.map((path) => ({ path, url: saunaPhotoUrl(supabaseUrl, path) })),
    rates: toSaunaRates(r),
    upsellIds: links.map((l) => l.upsell_id),
    active: r.active,
    comingSoon: r.coming_soon,
    sortOrder: r.sort_order,
  };
}

export function toUpsell(r: Tables<"sauna_upsells">): Upsell {
  return { id: r.id, name: r.name, description: r.description, price: r.price, unit: r.unit, maxQty: r.max_qty, minHours: r.min_hours, active: r.active };
}

export function toSaunaMaster(r: Tables<"sauna_masters">): SaunaMaster {
  return { id: r.id, name: r.name, description: r.description, price: r.price, minHours: r.min_hours, active: r.active, sortOrder: r.sort_order };
}

export function toSaunaProgram(r: Tables<"sauna_programs">): SaunaProgram {
  return {
    id: r.id,
    name: r.name,
    label: r.label,
    description: r.description,
    kind: r.kind as SaunaProgram["kind"],
    pricing: r.pricing as SaunaProgram["pricing"],
    price: r.price,
    childPrice: r.child_price,
    durationMinutes: r.duration_minutes,
    capacity: r.capacity,
    saunaId: r.sauna_id,
    active: r.active,
    sortOrder: r.sort_order,
  };
}

export function toCouponProduct(r: Tables<"coupon_products">): CouponProduct {
  return { id: r.id, kind: r.kind, service: r.service, name: r.name, description: r.description, value: r.value, active: r.active };
}

/** `usage` null = the usage query failed (shown as unknown, never as zero). */
export function toDiscountCode(r: Tables<"discount_codes">, usage: { uses: number; discount_total: number } | null | undefined): DiscountCode {
  return {
    id: r.id,
    code: r.code,
    kind: r.kind,
    value: Number(r.value),
    services: r.services.filter(isDiscountService),
    validFrom: r.valid_from,
    validUntil: r.valid_until,
    maxUses: r.max_uses,
    active: r.active,
    note: r.note ?? "",
    createdAt: r.created_at,
    uses: usage === null ? null : (usage?.uses ?? 0),
    discountTotal: usage === null ? null : Number(usage?.discount_total ?? 0),
  };
}

export function toCoupon(r: CouponRow): Coupon {
  return {
    id: r.id,
    reference: r.reference,
    code: r.code ?? undefined,
    productName: r.product_name,
    kind: r.kind,
    service: r.service,
    faceValue: r.face_value,
    balance: r.balance,
    status: r.status,
    buyer: { name: r.buyer_name, email: r.buyer_email },
    recipientName: r.recipient_name,
    recipientEmail: r.recipient_email,
    message: r.message,
    createdAt: r.created_at,
    paidAt: r.paid_at ?? undefined,
    expiresAt: r.expires_at ?? undefined,
    redemptions: r.coupon_redemptions
      .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
      .map((x) => ({ id: x.id, amount: x.amount, note: x.note, at: x.created_at })),
    riderId: r.rider_id ?? undefined,
  };
}

export function toRidePlan(r: Tables<"ride_plans">): RidePlan {
  return { id: r.id, name: r.name, description: r.description, price: r.price, category: r.category as RidePlanCategory, active: r.active, sortOrder: r.sort_order };
}

export function toRider(r: Tables<"riders">): Rider {
  return {
    id: r.id,
    name: r.name,
    surname: r.surname,
    phone: r.phone,
    phone2: r.phone2,
    email: r.email,
    birthdate: r.birthdate,
    avatarPath: r.avatar_path,
    planId: r.plan_id,
    createdAt: r.created_at,
    selfRegistered: r.self_registered,
  };
}

export function toRiderCard(r: Tables<"rider_cards">): RiderCard {
  return { cardNumber: r.card_number, riderId: r.rider_id, boundAt: r.bound_at };
}

export function toRiderSession(r: Tables<"rider_sessions">): RiderSession {
  return { id: r.id, riderId: r.rider_id, cardNumber: r.card_number, startedAt: r.started_at, endedAt: r.ended_at };
}

export function toPurchase(r: Tables<"purchases">): Purchase {
  return { id: r.id, riderId: r.rider_id, planId: r.plan_id, planName: r.plan_name, planCategory: r.plan_category as RidePlanCategory, price: r.price, soldAt: r.sold_at };
}

export function toRiderComment(r: Tables<"rider_comments">): RiderComment {
  return { id: r.id, riderId: r.rider_id, text: r.text, authorName: r.author_name, createdAt: r.created_at };
}

export function toRiderDocument(r: Tables<"rider_documents">): RiderDocument {
  return { id: r.id, riderId: r.rider_id, filePath: r.file_path, fileName: r.file_name, uploadedAt: r.uploaded_at };
}

export function toRiderWaiver(r: Tables<"rider_waivers">): RiderWaiver {
  return { id: r.id, riderId: r.rider_id, termsVersion: r.terms_version, signaturePath: r.signature_path, signedAt: r.signed_at };
}

export function toQuadType(r: Tables<"quad_types">): QuadType {
  return { id: r.id, name: r.name, description: r.description, seats: r.seats, units: r.units, pricePerHour: r.price_per_hour, active: r.active };
}

export function toStayType(r: Tables<"stay_types">): StayType {
  return {
    id: r.id,
    kind: r.kind === "kemperis" ? "kemperis" : "namelis",
    label: r.label,
    note: r.note,
    maxGuests: r.max_guests,
    pricePerNight: Number(r.price_per_night),
    units: r.units,
    active: r.active,
    sortOrder: r.sort_order,
  };
}

export function toQuadSettings(r: Tables<"quad_settings">): QuadSettings {
  return { openHour: r.open_hour, closeHour: r.close_hour, maxHours: r.max_hours, deposit: r.deposit, minAge: r.min_age, rules: r.rules, tourCancellationNote: r.tour_cancellation_note };
}

export function toQuadTourRoute(r: Tables<"quad_tour_routes">): QuadTourRoute {
  return {
    id: r.id,
    name: r.name,
    kilometres: r.kilometres,
    hours: r.hours,
    durationLabel: r.duration_label,
    price: r.price,
    minUnits: r.min_units,
    description: r.description,
    longDescription: r.long_description,
    photo: r.photo,
    badge: r.badge,
    active: r.active,
    sortOrder: r.sort_order,
  };
}

export function toQuadTourAccessory(r: Tables<"quad_tour_accessories">): QuadTourAccessory {
  return { id: r.id, name: r.name, description: r.description, price: r.price, active: r.active, sortOrder: r.sort_order };
}

export function toQuadRental(r: QuadRentalRow): QuadRental {
  const items = r.quad_type_id
    ? [{ quadTypeId: r.quad_type_id, units: r.units }]
    : (r.quad_rental_items ?? [])
        .toSorted((a, b) => a.quad_type_id.localeCompare(b.quad_type_id))
        .map((item) => ({ quadTypeId: item.quad_type_id, units: item.units }));

  return {
    id: r.id,
    reference: r.reference,
    items,
    date: r.date,
    startHour: r.start_hour,
    hours: r.hours,
    units: r.units,
    riders: r.riders,
    customer: { name: r.customer_name, email: r.customer_email ?? "", phone: r.customer_phone ?? "" },
    total: r.total,
    status: r.status,
    source: r.source,
    note: r.note ?? undefined,
    createdAt: r.created_at,
    riderId: r.rider_id ?? undefined,
    tourRouteId: r.tour_route_id ?? undefined,
    tourEventId: r.tour_event_id ?? undefined,
  };
}

export function toTourTicket(r: TicketRow): TourTicket {
  return {
    id: r.id,
    reference: r.reference,
    eventId: r.event_id,
    eventTitle: r.events.title,
    eventDate: r.events.date,
    eventTime: toHHMM(r.events.start_time),
    people: r.people,
    customer: { name: r.customer_name, email: r.customer_email ?? "", phone: r.customer_phone ?? "" },
    total: r.total,
    status: r.status,
    createdAt: r.created_at,
    riderId: r.rider_id ?? undefined,
  };
}

export function toStaffRole(r: Tables<"staff_roles">): StaffRole {
  return { id: r.id, name: r.name, description: r.description, isOwner: r.is_owner, permissions: r.permissions.filter(isPermissionId) };
}

export function toStaffMember(r: Tables<"staff">): StaffMember {
  return { userId: r.user_id, name: r.display_name, email: r.email, roleId: r.role_id, active: r.active, createdAt: r.created_at };
}

export function toNotificationRecipient(r: Tables<"notification_recipients">): NotificationRecipient {
  return { id: r.id, name: r.name, phone: r.phone, topics: r.topics.filter(isNotificationTopic), active: r.active };
}
