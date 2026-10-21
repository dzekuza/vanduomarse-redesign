import type { Tables } from "@/lib/supabase/database.types";
import type { SaunaRates } from "@/lib/sauna";
import type { Upsell } from "@/lib/sauna-upsells";
import type { Block, Booking, Inquiry, ManagedEvent, PriceItem } from "./types";

/**
 * Database rows (snake_case, nulls) -> app models (camelCase, optionals).
 * Pure functions, shared by the admin loader and the public data layer.
 */

type BookingRow = Tables<"bookings"> & { booking_extras: Pick<Tables<"booking_extras">, "name" | "unit" | "quantity">[] };
type InquiryRow = Tables<"inquiries"> & { inquiry_notes: Pick<Tables<"inquiry_notes">, "text" | "created_at">[] };

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
    guests: r.guests,
    extras: r.booking_extras.map((x) => (x.unit === "vienetui" ? `${x.name} × ${x.quantity}` : x.name)),
    total: r.total,
    status: r.status,
    createdAt: r.created_at,
    source: r.source,
    note: r.note ?? undefined,
  };
}

export function toBlock(r: Tables<"sauna_blocks">): Block {
  return { id: r.id, date: r.date, hour: r.hour, reason: r.reason };
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
  };
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
  };
}

export function toPriceItem(r: Tables<"price_items">): PriceItem {
  return { id: r.id, group: r.group, label: r.label, unit: r.unit, value: r.value, max: r.max ?? undefined };
}

export function toSaunaRates(r: Tables<"sauna_settings">): SaunaRates {
  return {
    smallGroupMax: r.small_group_max,
    smallGroupRate: r.small_group_rate,
    largeGroupRate: r.large_group_rate,
    maxParty: r.max_party,
    minHours: r.min_hours,
    maxHours: r.max_hours,
    packageHours: r.package_hours,
    packagePrice: r.package_price,
    openHour: r.open_hour,
    closeHour: r.close_hour,
  };
}

export function toUpsell(r: Tables<"sauna_upsells">): Upsell {
  return { id: r.id, name: r.name, description: r.description, price: r.price, unit: r.unit, maxQty: r.max_qty, active: r.active };
}
