"use server";

import { z } from "zod";
import { toSpace, toSpaceBooking } from "@/lib/admin/mappers";
import type { SpaceBooking } from "@/lib/admin/types";
import { anySpaceClash, spaceLabels, windowsOverlap, type ManagedSpace } from "@/lib/space-booking";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { slugify } from "@/lib/sauna";

/* ---------------- event spaces (ADR-0124, ADR-0129) ---------------- */

const spaceId = z.string().regex(/^[a-z0-9-]+$/).max(60);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Netinkamas laikas.");

const spaceBookingInput = z.object({
  date: z.iso.date(),
  endDate: z.iso.date(),
  startTime: time,
  endTime: time,
  spaces: z.array(spaceId).min(1).max(50),
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    surname: z.string().trim().max(80),
    phone: z.string().trim().regex(/^\+?[\d\s()-]{6,}$/),
    email: z.union([z.literal(""), z.email()]),
  }),
  guests: z.number().int().min(1).max(1000),
  price: z.number().min(0).max(1_000_000),
  status: z.enum(["patvirtinta", "laukia"]),
  note: z.string().trim().max(500),
});

export type NewSpaceBookingInput = z.infer<typeof spaceBookingInput>;

/** Hires several spaces at once; refused when any of them (or the whole park) is already taken in an overlapping window that day. */
export async function createSpaceBooking(input: NewSpaceBookingInput): Promise<ActionResult<{ booking: SpaceBooking }>> {
  const ctx = await staffClient("rezervacijos");
  if (!ctx.ok) return ctx.error;
  const parsed = spaceBookingInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  if (`${v.endDate} ${v.endTime}` <= `${v.date} ${v.startTime}`) return fail("Pabaiga turi būti vėlesnė už pradžią.", "invalid");
  const spaces = [...new Set(v.spaces)];

  const { data: spaceRows, error: spacesError } = await ctx.supabase.from("spaces").select("*");
  if (spacesError) return dbError(spacesError);
  const catalog = spaceRows.map(toSpace);
  const off = spaces.filter((id) => !catalog.some((c) => c.id === id && c.active));
  if (off.length) return fail(`Ši erdvė nebenuomojama: ${spaceLabels(off, catalog)}. Atnaujinkite puslapį.`, "invalid");

  const { data: nearby, error: readError } = await ctx.supabase.from("space_bookings").select("*").lte("date", v.endDate).gte("end_date", v.date).neq("status", "atsaukta");
  if (readError) return dbError(readError);
  const clash = nearby.map(toSpaceBooking).find((b) => windowsOverlap(v, b) && anySpaceClash(spaces, b.spaces, catalog));
  if (clash) return fail(`Šiuo laiku jau užimta: ${spaceLabels(clash.spaces, catalog)} (${clash.date}${clash.endDate !== clash.date ? `–${clash.endDate}` : ""} ${clash.startTime}–${clash.endTime}, ${clash.customer.name}).`, "conflict");

  const { data: row, error } = await ctx.supabase
    .from("space_bookings")
    .insert({
      date: v.date,
      end_date: v.endDate,
      start_time: v.startTime,
      end_time: v.endTime,
      spaces,
      customer_name: v.customer.name,
      customer_surname: v.customer.surname,
      customer_phone: v.customer.phone,
      customer_email: v.customer.email || null,
      guests: v.guests,
      price: v.price,
      status: v.status,
      note: v.note,
      created_by: ctx.userId,
    })
    .select("*")
    .single();
  if (error) return dbError(error);
  return done({ booking: toSpaceBooking(row) });
}

export async function setSpaceBookingStatus(id: string, status: SpaceBooking["status"]): Promise<ActionResult> {
  const ctx = await staffClient("rezervacijos");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: z.enum(["laukia", "patvirtinta", "ivykdyta", "atsaukta"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("space_bookings").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}

const spaceInput = z.object({
  /** null = a new space; its id is made from the label and never changes. */
  id: spaceId.nullable(),
  label: z.string().trim().min(2).max(80),
  blurb: z.string().trim().max(300),
  maxGuests: z.number().int().min(1).max(5000),
  priceWeekday: z.number().min(0).max(1_000_000).nullable(),
  priceWeekend: z.number().min(0).max(1_000_000).nullable(),
  wholePark: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(32000),
});

export type SpaceInput = z.infer<typeof spaceInput>;

/** Creates (`id` null) or updates an event space. Spaces are never deleted, only switched off, so old hires keep their name. */
export async function saveSpace(input: SpaceInput): Promise<ActionResult<{ space: ManagedSpace }>> {
  const ctx = await staffClient(["rezervacijos", "kainos"]);
  if (!ctx.ok) return ctx.error;
  const parsed = spaceInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const row = {
    label: v.label,
    blurb: v.blurb,
    max_guests: v.maxGuests,
    price_weekday: v.priceWeekday,
    price_weekend: v.priceWeekend,
    whole_park: v.wholePark,
    active: v.active,
    sort_order: v.sortOrder,
  };

  let id = v.id;
  if (id) {
    const { error } = await ctx.supabase.from("spaces").update(row).eq("id", id);
    if (error) return dbError(error);
  } else {
    const base = slugify(v.label) || "erdve";
    const { data: taken } = await ctx.supabase.from("spaces").select("id").like("id", `${base}%`);
    const used = new Set((taken ?? []).map((r) => r.id));
    id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    const { error } = await ctx.supabase.from("spaces").insert({ id, ...row });
    if (error) return dbError(error);
  }
  return done({ space: { id, label: v.label, blurb: v.blurb, maxGuests: v.maxGuests, priceWeekday: v.priceWeekday, priceWeekend: v.priceWeekend, wholePark: v.wholePark, active: v.active, sortOrder: v.sortOrder } });
}
