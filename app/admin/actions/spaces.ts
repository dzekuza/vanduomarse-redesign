"use server";

import { z } from "zod";
import { toSpaceBooking } from "@/lib/admin/mappers";
import type { SpaceBooking } from "@/lib/admin/types";
import { SPACES, type SpaceId } from "@/lib/event-pricing";
import { anySpaceClash, spaceLabels, windowsOverlap } from "@/lib/space-booking";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";

/* ---------------- event spaces ---------------- */

const spaceId = z.enum(SPACES.map((s) => s.id) as [SpaceId, ...SpaceId[]]);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Netinkamas laikas.");

const spaceBookingInput = z.object({
  date: z.iso.date(),
  endDate: z.iso.date(),
  startTime: time,
  endTime: time,
  spaces: z.array(spaceId).min(1).max(SPACES.length),
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

  const { data: nearby, error: readError } = await ctx.supabase.from("space_bookings").select("*").lte("date", v.endDate).gte("end_date", v.date).neq("status", "atsaukta");
  if (readError) return dbError(readError);
  const clash = nearby.map(toSpaceBooking).find((b) => windowsOverlap(v, b) && anySpaceClash(spaces, b.spaces));
  if (clash) return fail(`Šiuo laiku jau užimta: ${spaceLabels(clash.spaces)} (${clash.date}${clash.endDate !== clash.date ? `–${clash.endDate}` : ""} ${clash.startTime}–${clash.endTime}, ${clash.customer.name}).`, "conflict");

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
