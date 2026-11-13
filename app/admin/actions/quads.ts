"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toQuadRental } from "@/lib/admin/mappers";
import type { QuadRental } from "@/lib/admin/types";
import type { QuadSettings, QuadTourAccessory, QuadTourRoute, QuadType } from "@/lib/quads";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";

/* ---------------- quads ---------------- */

const quadTypeInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(200),
  seats: z.number().int().min(1).max(2),
  units: z.number().int().min(0).max(100),
  pricePerHour: z.number().min(0).max(1000),
  active: z.boolean(),
});

export async function saveQuadType(type: QuadType): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = quadTypeInput.safeParse(type);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const t = parsed.data;
  const { error } = await ctx.supabase
    .from("quad_types")
    .upsert({ id: t.id, name: t.name, description: t.description, seats: t.seats, units: t.units, price_per_hour: t.pricePerHour, active: t.active });
  revalidatePath("/embed/keturraciai");
  revalidatePath("/rezervacija");
  return error ? dbError(error) : done(null);
}

export async function deleteQuadType(id: string): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("quad_types").delete().eq("id", id);
  if (error?.code === "23503") return fail("Šio tipo jau buvo nuomų – jį galima tik išjungti.", "in_use");
  revalidatePath("/embed/keturraciai");
  revalidatePath("/rezervacija");
  return error ? dbError(error) : done(null);
}

/* Tour products (ADR-0053): Mini / Midi / Maxi and their gear. Prices are EUR incl. PVM; bookings re-read them in the database. */

const tourRouteInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  name: z.string().trim().min(1).max(60),
  kilometres: z.number().int().min(1).max(500),
  hours: z.number().int().min(1).max(8),
  durationLabel: z.string().trim().max(30),
  price: z.number().min(0).max(10_000),
  minUnits: z.number().int().min(1).max(20),
  description: z.string().trim().max(200),
  longDescription: z.string().trim().max(1200),
  /** A path under /public (or empty). */
  photo: z.string().trim().max(200).regex(/^(\/[A-Za-z0-9._/-]*)?$/),
  badge: z.string().trim().max(20).nullable(),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});

const tourAccessoryInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(200),
  price: z.number().min(0).max(10_000),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});

function revalidateTours() {
  revalidatePath("/keturraciu-nuoma");
  revalidatePath("/keturraciai");
  revalidatePath("/rezervacija");
}

export async function saveQuadTourRoute(route: QuadTourRoute): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = tourRouteInput.safeParse(route);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const r = parsed.data;
  const { error } = await ctx.supabase.from("quad_tour_routes").upsert({
    id: r.id, name: r.name, kilometres: r.kilometres, hours: r.hours, duration_label: r.durationLabel, price: r.price,
    min_units: r.minUnits, description: r.description, long_description: r.longDescription, photo: r.photo,
    badge: r.badge || null, active: r.active, sort_order: r.sortOrder,
  });
  revalidateTours();
  return error ? dbError(error) : done(null);
}

export async function deleteQuadTourRoute(id: string): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("quad_tour_routes").delete().eq("id", id);
  if (error?.code === "23503") return fail("Šio turo jau buvo rezervacijų – jį galima tik išjungti.", "in_use");
  revalidateTours();
  return error ? dbError(error) : done(null);
}

export async function saveQuadTourAccessory(accessory: QuadTourAccessory): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = tourAccessoryInput.safeParse(accessory);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const a = parsed.data;
  const { error } = await ctx.supabase.from("quad_tour_accessories").upsert({
    id: a.id, name: a.name, description: a.description, price: a.price, active: a.active, sort_order: a.sortOrder,
  });
  revalidateTours();
  return error ? dbError(error) : done(null);
}

export async function deleteQuadTourAccessory(id: string): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("quad_tour_accessories").delete().eq("id", id);
  revalidateTours();
  return error ? dbError(error) : done(null);
}

const quadSettingsInput = z
  .object({
    openHour: z.number().int().min(0).max(23),
    closeHour: z.number().int().min(1).max(24),
    maxHours: z.number().int().min(1).max(8),
    deposit: z.number().min(0).max(10_000),
    minAge: z.number().int().min(10).max(99),
    rules: z.string().trim().max(800),
    tourCancellationNote: z.string().trim().max(200),
  })
  .refine((s) => s.closeHour > s.openHour);

export async function updateQuadSettings(settings: QuadSettings): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = quadSettingsInput.safeParse(settings);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const s = parsed.data;
  const { error } = await ctx.supabase
    .from("quad_settings")
    .update({ open_hour: s.openHour, close_hour: s.closeHour, max_hours: s.maxHours, deposit: s.deposit, min_age: s.minAge, rules: s.rules, tour_cancellation_note: s.tourCancellationNote })
    .eq("id", true);
  revalidatePath("/embed/keturraciai");
  revalidatePath("/rezervacija");
  return error ? dbError(error) : done(null);
}

const staffRentalInput = z.object({
  quadTypeId: z.string().regex(/^[a-z0-9-]+$/).max(60),
  date: z.iso.date(),
  startHour: z.number().int().min(0).max(23),
  hours: z.number().int().min(1).max(8),
  units: z.number().int().min(1).max(20),
  riders: z.number().int().min(1).max(40),
  customer: z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().max(30), email: z.string().trim().max(120) }),
  status: z.enum(["laukia", "patvirtinta"]),
  source: z.enum(["telefonu", "vietoje"]),
  note: z.string().trim().max(300),
});

export type StaffRentalInput = z.infer<typeof staffRentalInput>;

/** A rental taken by phone or on site. Price comes from the fleet row; the database guards capacity. */
export async function createRental(input: StaffRentalInput): Promise<ActionResult<QuadRental>> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = staffRentalInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  if (!v.customer.phone && !v.customer.email) return fail("Nurodykite telefoną arba el. paštą.", "invalid");

  const { data: type } = await ctx.supabase.from("quad_types").select("price_per_hour, seats").eq("id", v.quadTypeId).maybeSingle();
  if (!type) return fail("Nežinomas keturračio tipas.", "invalid");
  if (v.riders > v.units * type.seats) return fail("Per daug važiuotojų pasirinktiems keturračiams.", "invalid");

  const { data: row, error } = await ctx.supabase
    .from("quad_rentals")
    .insert({
      // Assigned by the quad_rentals_reference trigger.
      reference: undefined as unknown as string,
      quad_type_id: v.quadTypeId,
      date: v.date,
      start_hour: v.startHour,
      hours: v.hours,
      units: v.units,
      riders: v.riders,
      customer_name: v.customer.name,
      customer_phone: v.customer.phone || null,
      customer_email: v.customer.email || null,
      total: v.hours * v.units * type.price_per_hour,
      status: v.status,
      source: v.source,
      note: v.note || null,
    })
    .select("*")
    .single();
  if (error) return dbError(error);
  return done(toQuadRental(row));
}

const staffTourInput = z.object({
  routeId: z.string().regex(/^[a-z0-9-]+$/).max(60),
  date: z.iso.date(),
  startHour: z.number().int().min(0).max(23),
  units: z.number().int().min(1).max(20),
  gear: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/).max(60), units: z.number().int().min(1).max(40) })).max(10),
  customer: z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().max(30), email: z.union([z.literal(""), z.email().max(120)]) }),
  status: z.enum(["laukia", "patvirtinta"]),
  source: z.enum(["telefonu", "vietoje"]),
  note: z.string().trim().max(300),
});

export type StaffTourInput = z.infer<typeof staffTourInput>;

const TOUR_ERRORS: Record<string, string> = {
  quad_tour_unavailable: "Šio turo nebėra arba jis išjungtas.",
  quad_units: "Šiam turui reikia daugiau keturračių (žr. mažiausią skaičių).",
  quad_gear: "Netinkama turo įranga: iki 2 vienetų vienam keturračiui.",
  quad_closed: "Turas netelpa į darbo valandas.",
  quad_past: "Praėjusios dienos ar laiko užsakyti negalima.",
  quad_full: "Tiek keturračių šiuo laiku nebėra.",
};

/**
 * A guided tour (Mini / Midi / Maxi) taken by phone or on site. It goes through the same database function as the
 * website (`create_quad_tour_rental`), so the route price, gear, minimum quads, opening hours and the shared fleet are
 * checked and priced there, never from the browser; the rental is then marked as staff-entered (status and channel).
 */
export async function createQuadTour(input: StaffTourInput): Promise<ActionResult<QuadRental>> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = staffTourInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  if (!v.customer.phone && !v.customer.email) return fail("Nurodykite telefoną arba el. paštą.", "invalid");

  const { data: created, error } = await ctx.supabase.rpc("create_quad_tour_rental", {
    p_route_id: v.routeId,
    p_date: v.date,
    p_start_hour: v.startHour,
    p_units: v.units,
    p_accessories: v.gear,
    p_name: v.customer.name,
    p_email: v.customer.email || undefined,
    p_phone: v.customer.phone || undefined,
    p_note: v.note || undefined,
  });
  if (error) return error.hint && TOUR_ERRORS[error.hint] ? fail(TOUR_ERRORS[error.hint], "invalid") : dbError(error);
  const id = created?.[0]?.id;
  if (!id) return fail("Nepavyko sukurti turo.", "db");

  // The function files a website request (pending); a staff-entered tour is confirmed and marked by its channel.
  const { data: row, error: updateError } = await ctx.supabase
    .from("quad_rentals")
    .update({ status: v.status, source: v.source })
    .eq("id", id)
    .select("*, quad_rental_items(quad_type_id, units)")
    .single();
  if (updateError) return dbError(updateError);
  return done(toQuadRental(row));
}
