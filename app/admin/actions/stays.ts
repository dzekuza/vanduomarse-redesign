"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { StayType } from "@/lib/cabin";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";

/* ---------------- stay types (cabins, camper pitches) ---------------- */

const stayTypeInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  kind: z.enum(["namelis", "kemperis"]),
  label: z.string().trim().min(1).max(60),
  note: z.string().trim().max(120),
  maxGuests: z.number().int().min(1).max(30),
  pricePerNight: z.number().min(0).max(10000),
  /** null = not limited (camper pitches). */
  units: z.number().int().min(1).max(500).nullable(),
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
  const { error } = await ctx.supabase.from("stay_types").upsert({
    id: t.id,
    kind: t.kind,
    label: t.label,
    note: t.note,
    max_guests: t.maxGuests,
    price_per_night: t.pricePerNight,
    units: t.units,
    active: t.active,
    sort_order: t.sortOrder,
  });
  revalidateStays();
  return error ? dbError(error) : done(null);
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
