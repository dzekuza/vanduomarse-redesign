"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { seasonsProblem, type StayType } from "@/lib/cabin";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";

/* ---------------- stay types (cabins, camper pitches) ---------------- */

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const seasonInput = z.object({
  id: z.uuid(),
  startsOn: date,
  endsOn: date,
  pricePerNight: z.number().min(0).max(10000),
  pricePerNight2: z.number().min(0).max(10000),
  pricePerNight3: z.number().min(0).max(10000),
}).refine((s) => s.endsOn >= s.startsOn);

const stayTypeInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  kind: z.enum(["namelis", "kemperis"]),
  label: z.string().trim().min(1).max(60),
  note: z.string().trim().max(120),
  maxGuests: z.number().int().min(1).max(30),
  pricePerNight: z.number().min(0).max(10000),
  pricePerNight2: z.number().min(0).max(10000),
  pricePerNight3: z.number().min(0).max(10000),
  seasons: z.array(seasonInput).max(24),
  /** null = not limited (camper pitches). */
  units: z.number().int().min(1).max(500).nullable(),
  /** Exclusive "bookable until" date for the website; null = no limit. */
  bookableUntil: date.nullable(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});

const revalidateStays = () => {
  for (const path of ["/rezervacija", "/nakvyne", "/embed/miegas", "/sventes"]) revalidatePath(path);
};

/** Owner-only (RLS `owner stay types *`): prices, stock and guest limits drive every public booking. */
export async function saveStayType(type: StayType): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const parsed = stayTypeInput.safeParse(type);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const t = parsed.data;
  // Cabins are always counted; only camper pitches may be unlimited.
  if (t.kind === "namelis" && t.units === null) return fail("Namelių skaičius privalomas.", "invalid");
  const problem = seasonsProblem(t.seasons);
  if (problem) return fail(problem, "invalid");
  // One database call: the type and its seasons are saved together or not at all.
  const { error } = await ctx.supabase.rpc("save_stay_type", {
    p_type: {
      id: t.id,
      kind: t.kind,
      label: t.label,
      note: t.note,
      max_guests: t.maxGuests,
      price_per_night: t.pricePerNight,
      price_per_night_2: t.pricePerNight2,
      price_per_night_3: t.pricePerNight3,
      units: t.units,
      active: t.active,
      sort_order: t.sortOrder,
      bookable_until: t.bookableUntil,
    },
    p_seasons: t.seasons.map((x) => ({
      id: x.id,
      starts_on: x.startsOn,
      ends_on: x.endsOn,
      price_per_night: x.pricePerNight,
      price_per_night_2: x.pricePerNight2,
      price_per_night_3: x.pricePerNight3,
    })),
  });
  // Until migration 20261126110000 is applied the database still refuses any overlap, nested seasons included (ADR-0128).
  if (error?.code === "23P01") {
    return fail("Sezonas kito sezono viduje dar neišsaugomas: duomenų bazė kol kas leidžia tik nepersidengiančius sezonus. Kol tai bus įjungta, padalinkite ilgąjį sezoną į dalis prieš ir po trumpojo.", "season_overlap");
  }
  if (error?.code === "23505") return fail("Du sezonai turi tas pačias datas.", "invalid");
  if (error) return dbError(error);
  revalidateStays();
  return done(null);
}

export async function deleteStayType(id: string): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("stay_types").delete().eq("id", id);
  if (error?.code === "23503") return fail("Šio tipo jau buvo rezervacijų – jį galima tik išjungti.", "in_use");
  revalidateStays();
  return error ? dbError(error) : done(null);
}
