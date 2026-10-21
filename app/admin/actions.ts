"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ratesSchema } from "@/components/admin/sauna/rates-schema";
import { toBooking } from "@/lib/admin/mappers";
import type { Booking, ManagedEvent, PriceItem } from "@/lib/admin/types";
import type { SaunaRates } from "@/lib/sauna";
import { upsellTotal, type Upsell } from "@/lib/sauna-upsells";
import { createClient } from "@/lib/supabase/server";

/**
 * Staff mutations behind useAdmin(). Every action re-checks the session and
 * staff membership (RLS enforces the same), validates its input with Zod, and
 * revalidates the admin layout so the store resets to what the database holds.
 */

export type ActionResult<T = null> = { data: T } | { error: { message: string; code?: string } };

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

interface DbError {
  code?: string;
  hint?: string | null;
  message: string;
}

/** Postgres errors -> Lithuanian messages staff can act on. */
function dbError(e: DbError) {
  if (e.code === "23P01") {
    const byHint: Record<string, string> = {
      sauna_blocked: "Šis pirties laikas uždarytas.",
      sauna_booked: "Šis pirties laikas jau užimtas.",
      stay_full: "Visi šio tipo nameliai tomis naktimis užimti.",
      event_full: "Renginyje nebėra vietų.",
    };
    return fail(byHint[e.hint ?? ""] ?? "Šis laikas jau užimtas – pasirinkite kitą.", "conflict");
  }
  if (e.code === "23503") return fail("Įrašas susietas su kitais duomenimis, todėl jo pašalinti negalima.", "in_use");
  if (e.code === "23514") return fail("Netinkamos reikšmės.", "invalid");
  return fail("Nepavyko išsaugoti. Bandykite dar kartą.", "db");
}

type StaffContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: ReturnType<typeof fail> };

async function staffClient(): Promise<StaffContext> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: fail("Prisijunkite iš naujo.", "unauthorized") };
  const { data: staff } = await supabase.from("staff").select("user_id").eq("user_id", auth.user.id).maybeSingle();
  if (!staff) return { ok: false, error: fail("Neturite prieigos.", "forbidden") };
  return { ok: true, supabase, userId: auth.user.id };
}

function done<T>(data: T): { data: T } {
  revalidatePath("/admin", "layout");
  return { data };
}

/* ---------------- auth ---------------- */

const signInSchema = z.object({ email: z.email(), password: z.string().min(6) });

export async function signIn(input: z.infer<typeof signInSchema>): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return fail("Neteisingas el. paštas arba slaptažodis.", "invalid");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail("Neteisingas el. paštas arba slaptažodis.", "invalid_credentials");
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/prisijungti");
}

/* ---------------- bookings ---------------- */

const bookingStatus = z.enum(["laukia", "patvirtinta", "ivykdyta", "atsaukta"]);

export async function setBookingStatus(id: string, status: Booking["status"]): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("bookings").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}

const newBookingInput = z
  .object({
    kind: z.enum(["pirtis", "namelis", "kemperis"]),
    date: z.iso.date(),
    startHour: z.number().int().min(0).max(23).optional(),
    hours: z.number().int().min(1).max(24).optional(),
    nights: z.number().int().min(1).max(60).optional(),
    guests: z.number().int().min(1).max(500),
    customer: z.object({ name: z.string().trim().min(2), phone: z.string().trim(), email: z.string().trim() }),
    /** Upsell id -> quantity; priced on the server from the current upsells. */
    extras: z.record(z.string(), z.number().int().min(0).max(100)),
    total: z.number().min(0).max(1_000_000),
    status: z.enum(["patvirtinta", "laukia"]),
    source: z.enum(["telefonu", "vietoje"]),
    note: z.string().trim().max(300),
  })
  .refine((v) => (v.kind === "pirtis" ? v.startHour !== undefined && v.hours !== undefined : v.nights !== undefined));

export type NewBookingInput = z.infer<typeof newBookingInput>;

/** Cabin size until the form asks for one: a couple gets a double, anyone more a quad. */
const stayTypeFor = (kind: NewBookingInput["kind"], guests: number) =>
  kind === "kemperis" ? "kemperis" : kind === "namelis" ? (guests <= 2 ? "namelis-2" : "namelis-4") : null;

export async function createBooking(input: NewBookingInput): Promise<ActionResult<Booking>> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = newBookingInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const sauna = v.kind === "pirtis";
  const { supabase } = ctx;

  const { data: row, error } = await supabase
    .from("bookings")
    .insert({
      // Assigned by the bookings_reference trigger.
      reference: undefined as unknown as string,
      kind: v.kind,
      customer_name: v.customer.name,
      customer_phone: v.customer.phone || null,
      customer_email: v.customer.email || null,
      date: v.date,
      start_hour: sauna ? v.startHour : null,
      hours: sauna ? v.hours : null,
      nights: sauna ? null : v.nights,
      stay_type_id: stayTypeFor(v.kind, v.guests),
      guests: v.guests,
      total: v.total,
      status: v.status,
      source: v.source,
      note: v.note || null,
    })
    .select("id")
    .single();
  if (error) return dbError(error);

  if (sauna) {
    const { data: upsells } = await supabase.from("sauna_upsells").select("*").eq("active", true);
    const lines = (upsells ?? [])
      .map((u) => ({ u, qty: v.extras[u.id] ?? 0 }))
      .filter(({ qty }) => qty > 0)
      .map(({ u, qty }) => {
        const upsell: Upsell = { id: u.id, name: u.name, description: u.description, price: u.price, unit: u.unit, maxQty: u.max_qty, active: u.active };
        return {
          booking_id: row.id,
          upsell_id: u.id,
          name: u.name,
          unit: u.unit,
          unit_price: u.price,
          quantity: u.unit === "vienetui" ? qty : 1,
          line_total: upsellTotal(upsell, qty, { partySize: v.guests, hours: v.hours ?? 0 }),
        };
      });
    if (lines.length) {
      const { error: extrasError } = await supabase.from("booking_extras").insert(lines);
      if (extrasError) {
        await supabase.from("bookings").delete().eq("id", row.id);
        return dbError(extrasError);
      }
    }
  }

  const { data: saved, error: readError } = await supabase
    .from("bookings")
    .select("*, booking_extras(name, unit, quantity)")
    .eq("id", row.id)
    .single();
  if (readError) return dbError(readError);
  return done(toBooking(saved));
}

/* ---------------- sauna blocks ---------------- */

export async function toggleBlock(date: string, hour: number, reason: string): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ date: z.iso.date(), hour: z.number().int().min(0).max(23), reason: z.string().trim().min(1).max(80) }).safeParse({ date, hour, reason });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { supabase, userId } = ctx;

  const { data: existing } = await supabase.from("sauna_blocks").select("id").eq("date", date).eq("hour", hour).maybeSingle();
  const { error } = existing
    ? await supabase.from("sauna_blocks").delete().eq("id", existing.id)
    : await supabase.from("sauna_blocks").insert({ date, hour, reason, created_by: userId });
  return error ? dbError(error) : done(null);
}

/* ---------------- inquiries ---------------- */

export async function setInquiryStatus(id: string, status: "nauja" | "susisiekta" | "pasiulymas" | "laimeta" | "prarasta"): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: z.enum(["nauja", "susisiekta", "pasiulymas", "laimeta", "prarasta"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("inquiries").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}

export async function addInquiryNote(id: string, text: string): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), text: z.string().trim().min(1).max(2000) }).safeParse({ id, text });
  if (!parsed.success) return fail("Pastaba tuščia arba per ilga.", "invalid");
  const { error } = await ctx.supabase.from("inquiry_notes").insert({ inquiry_id: id, text: parsed.data.text, author_id: ctx.userId });
  return error ? dbError(error) : done(null);
}

/* ---------------- events ---------------- */

const eventInput = z.object({
  id: z.uuid(),
  title: z.string().trim().min(3).max(80),
  category: z.enum(["pirtis", "vakarai", "akademija", "sventes"]),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().positive().optional(),
  place: z.string().trim().min(2).max(80),
  blurb: z.string().trim().max(240),
  price: z.number().min(0).nullable(),
  capacity: z.number().int().min(0).nullable(),
  published: z.boolean(),
});

export async function saveEvent(event: ManagedEvent): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = eventInput.safeParse(event);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const e = parsed.data;
  const { error } = await ctx.supabase.from("events").upsert({
    id: e.id,
    title: e.title,
    category: e.category,
    date: e.date,
    start_time: e.time,
    duration_minutes: e.durationMinutes ?? null,
    place: e.place,
    blurb: e.blurb,
    price: e.price,
    capacity: e.capacity,
    published: e.published,
  });
  return error ? dbError(error) : done(null);
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("events").delete().eq("id", id);
  if (error?.code === "23503") return fail("Renginiui jau parduota bilietų – jį galima tik paslėpti.", "in_use");
  return error ? dbError(error) : done(null);
}

export async function setEventPublished(id: string, published: boolean): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("events").update({ published }).eq("id", id);
  return error ? dbError(error) : done(null);
}

/* ---------------- prices ---------------- */

const priceInput = z.array(
  z.object({ id: z.string().regex(/^[a-z0-9-]+$/), value: z.number().min(0), max: z.number().min(0).optional() }).refine((p) => p.max === undefined || p.max >= p.value),
);

export async function updatePrices(items: PriceItem[]): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = priceInput.safeParse(items.map(({ id, value, max }) => ({ id, value, max })));
  if (!parsed.success) return fail("Netinkamos kainos.", "invalid");
  for (const p of parsed.data) {
    const { error } = await ctx.supabase.from("price_items").update({ value: p.value, max: p.max ?? null }).eq("id", p.id);
    if (error) return dbError(error);
  }
  return done(null);
}

/* ---------------- sauna settings & upsells ---------------- */

export async function updateSaunaRates(rates: SaunaRates): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = ratesSchema.safeParse(rates);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const r = parsed.data;
  const { error } = await ctx.supabase
    .from("sauna_settings")
    .update({
      small_group_max: r.smallGroupMax,
      small_group_rate: r.smallGroupRate,
      large_group_rate: r.largeGroupRate,
      max_party: r.maxParty,
      min_hours: r.minHours,
      max_hours: r.maxHours,
      package_hours: r.packageHours,
      package_price: r.packagePrice,
      open_hour: r.openHour,
      close_hour: r.closeHour,
    })
    .eq("id", true);
  revalidatePath("/pirtis");
  return error ? dbError(error) : done(null);
}

const upsellInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200),
  price: z.number().min(0),
  unit: z.enum(["rezervacijai", "asmeniui", "vienetui", "valandai"]),
  maxQty: z.number().int().positive().nullable(),
  active: z.boolean(),
});

export async function saveUpsell(upsell: Upsell): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const parsed = upsellInput.safeParse(upsell);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const u = parsed.data;
  const { error } = await ctx.supabase
    .from("sauna_upsells")
    .upsert({ id: u.id, name: u.name, description: u.description, price: u.price, unit: u.unit, max_qty: u.maxQty, active: u.active });
  revalidatePath("/pirtis");
  return error ? dbError(error) : done(null);
}

export async function deleteUpsell(id: string): Promise<ActionResult> {
  const ctx = await staffClient();
  if (!ctx.ok) return ctx.error;
  const { error } = await ctx.supabase.from("sauna_upsells").delete().eq("id", id);
  revalidatePath("/pirtis");
  return error ? dbError(error) : done(null);
}
