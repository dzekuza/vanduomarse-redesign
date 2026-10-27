"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ratesSchema } from "@/components/admin/sauna/rates-schema";
import { toBooking, toQuadRental } from "@/lib/admin/mappers";
import type { Booking, BookingStatus, ManagedEvent, PriceItem, QuadRental } from "@/lib/admin/types";
import type { CouponProduct } from "@/lib/coupons";
import type { QuadSettings, QuadType } from "@/lib/quads";
import { sendCouponEmail } from "@/lib/email/send-coupon";
import type { SaunaRates } from "@/lib/sauna";
import { upsellTotal, type Upsell } from "@/lib/sauna-upsells";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { createClient } from "@/lib/supabase/server";

export type { ActionResult };

/**
 * Staff mutations behind useAdmin(). Every action re-checks the session and
 * staff membership (RLS enforces the same), validates its input with Zod, and
 * revalidates the admin layout so the store resets to what the database holds.
 */

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

/** Any signed-in, active staff member changes their own password. */
export async function changeOwnPassword(password: string): Promise<ActionResult> {
  const ctx = await staffClient("any");
  if (!ctx.ok) return ctx.error;
  const parsed = z.string().min(8).max(72).safeParse(password);
  if (!parsed.success) return fail("Slaptažodį turi sudaryti 8-72 simboliai.", "invalid");
  const { error } = await ctx.supabase.auth.updateUser({ password: parsed.data });
  return error ? fail("Nepavyko pakeisti slaptažodžio. Bandykite dar kartą.", "auth") : { data: null };
}

/* ---------------- bookings ---------------- */

const bookingStatus = z.enum(["laukia", "patvirtinta", "ivykdyta", "atsaukta"]);

export async function setBookingStatus(id: string, status: Booking["status"]): Promise<ActionResult> {
  const ctx = await staffClient("rezervacijos");
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
  const ctx = await staffClient("rezervacijos");
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
  const ctx = await staffClient("uzimtumas");
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
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: z.enum(["nauja", "susisiekta", "pasiulymas", "laimeta", "prarasta"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("inquiries").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}

export async function addInquiryNote(id: string, text: string): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
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
  category: z.enum(["pirtis", "vakarai", "akademija", "sventes", "keturratis"]),
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
  const ctx = await staffClient("renginiai");
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
  const ctx = await staffClient("renginiai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("events").delete().eq("id", id);
  if (error?.code === "23503") return fail("Renginiui jau parduota bilietų – jį galima tik paslėpti.", "in_use");
  return error ? dbError(error) : done(null);
}

export async function setEventPublished(id: string, published: boolean): Promise<ActionResult> {
  const ctx = await staffClient("renginiai");
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
  const ctx = await staffClient("kainos");
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
  const ctx = await staffClient("pirtis");
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
  const ctx = await staffClient("pirtis");
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
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const { error } = await ctx.supabase.from("sauna_upsells").delete().eq("id", id);
  revalidatePath("/pirtis");
  return error ? dbError(error) : done(null);
}

/* ---------------- coupons ---------------- */

const couponProductInput = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/).max(60),
    kind: z.enum(["verte", "paslauga"]),
    service: z.enum(["visi", "kabelis", "pirtis", "miegas"]),
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(200),
    value: z.number().positive().max(10_000),
    active: z.boolean(),
  })
  .refine((p) => (p.kind === "verte") === (p.service === "visi"));

export async function saveCouponProduct(product: CouponProduct): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  const parsed = couponProductInput.safeParse(product);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const p = parsed.data;
  const { error } = await ctx.supabase
    .from("coupon_products")
    .upsert({ id: p.id, kind: p.kind, service: p.service, name: p.name, description: p.description, value: p.value, active: p.active });
  revalidatePath("/kuponai");
  return error ? dbError(error) : done(null);
}

export async function deleteCouponProduct(id: string): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("coupon_products").delete().eq("id", id);
  if (error?.code === "23503") return fail("Šio kupono jau yra užsakymų – jį galima tik išjungti.", "in_use");
  revalidatePath("/kuponai");
  return error ? dbError(error) : done(null);
}

export interface ActivatedCoupon {
  code: string;
  /** yyyy-mm-dd */
  expiresAt: string;
  /** False when no email service is configured or Resend refused the message. */
  emailSent: boolean;
}

/** Staff confirm payment: the database issues the code and expiry, then the buyer is emailed. */
export async function activateCoupon(id: string): Promise<ActionResult<ActivatedCoupon>> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { supabase } = ctx;

  const { data, error } = await supabase.rpc("activate_coupon", { p_id: id });
  if (error) return dbError(error);
  const issued = data[0];

  const { data: c } = await supabase.from("coupons").select("*").eq("id", id).single();
  const emailSent = c
    ? await sendCouponEmail({
        to: c.buyer_email,
        buyerName: c.buyer_name,
        recipientName: c.recipient_name,
        message: c.message,
        code: issued.code,
        productName: c.product_name,
        faceValue: c.face_value,
        service: c.service,
        expiresAt: issued.expires_at,
      })
    : false;
  return done({ code: issued.code, expiresAt: issued.expires_at, emailSent });
}

export async function resendCouponEmail(id: string): Promise<ActionResult<{ emailSent: boolean }>> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data: c, error } = await ctx.supabase.from("coupons").select("*").eq("id", id).single();
  if (error) return dbError(error);
  if (c.status !== "aktyvus" || !c.code || !c.expires_at) return fail("Kodas išsiunčiamas tik aktyviam kuponui.", "invalid");
  const emailSent = await sendCouponEmail({
    to: c.buyer_email,
    buyerName: c.buyer_name,
    recipientName: c.recipient_name,
    message: c.message,
    code: c.code,
    productName: c.product_name,
    faceValue: c.face_value,
    service: c.service,
    expiresAt: c.expires_at,
  });
  return { data: { emailSent } };
}

const redeemInput = z.object({ id: z.uuid(), amount: z.number().positive().max(10_000), note: z.string().trim().max(200) });

/** Spends `amount` from an active coupon; the database enforces balance, status and expiry. */
export async function redeemCoupon(id: string, amount: number, note: string): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  const parsed = redeemInput.safeParse({ id, amount: Math.round(amount * 100) / 100, note });
  if (!parsed.success) return fail("Netinkama suma.", "invalid");
  const v = parsed.data;
  const { error } = await ctx.supabase.from("coupon_redemptions").insert({ coupon_id: v.id, amount: v.amount, note: v.note, redeemed_by: ctx.userId });
  return error ? dbError(error) : done(null);
}

export async function cancelCoupon(id: string): Promise<ActionResult> {
  const ctx = await staffClient("kuponai");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("coupons").update({ status: "atsauktas" }).eq("id", id).in("status", ["laukia_apmokejimo", "aktyvus"]);
  return error ? dbError(error) : done(null);
}

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
  revalidatePath("/keturraciai");
  return error ? dbError(error) : done(null);
}

export async function deleteQuadType(id: string): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("quad_types").delete().eq("id", id);
  if (error?.code === "23503") return fail("Šio tipo jau buvo nuomų – jį galima tik išjungti.", "in_use");
  revalidatePath("/keturraciai");
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
    .update({ open_hour: s.openHour, close_hour: s.closeHour, max_hours: s.maxHours, deposit: s.deposit, min_age: s.minAge, rules: s.rules })
    .eq("id", true);
  revalidatePath("/keturraciai");
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

export async function setRentalStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("quad_rentals").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}

export async function setTourTicketStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  const ctx = await staffClient(["keturraciai", "renginiai"]);
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("event_tickets").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}
