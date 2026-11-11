"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eventDurationMinutes } from "@/components/admin/events/event-schema";
import { ratesFromValues } from "@/components/admin/sauna/rates-schema";
import { saunaSchema, type SaunaValues } from "@/components/admin/sauna/sauna-schema";
import { fromSaunaRates, toBooking, toPurchase, toQuadRental, toRider, toRiderComment, toRiderDocument, toRiderSession, toRidePlan } from "@/lib/admin/mappers";
import type { Booking, BookingStatus, ManagedEvent, PriceItem, Purchase, QuadRental, Rider, RiderComment, RiderDocument, RiderSession, RidePlan } from "@/lib/admin/types";
import type { CouponProduct } from "@/lib/coupons";
import type { StayType } from "@/lib/cabin";
import type { QuadSettings, QuadTourAccessory, QuadTourRoute, QuadType } from "@/lib/quads";
import { RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import { sendCouponEmail } from "@/lib/email/send-coupon";
import { notifyRequestOutcome } from "@/lib/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { describeRequest, saunaSummary } from "@/lib/sms/notify";
import { MAX_SAUNA_PHOTOS, SAUNA_PHOTO_BUCKET, slugify } from "@/lib/sauna";
import type { SaunaProgram } from "@/lib/sauna-programs";
import { upsellTotal, type Upsell } from "@/lib/sauna-upsells";
import { dbError, done, fail, staffClient, type ActionResult, type StaffContext } from "@/lib/admin/action-helpers";
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

/**
 * The row's email only when it is the account's own confirmed address. A row's email is what the form
 * sent, and `user_id` alone does not prove it (a signed-in request can pass on a verified phone with any
 * email), so the address is checked against auth.users through a service-role function. Null otherwise,
 * or when the lookup fails: then only the SMS goes out.
 */
async function accountEmailFor(userId: string | null, rowEmail: string | null): Promise<string | null> {
  if (!userId || !rowEmail) return null;
  try {
    const { data, error } = await createAdminClient().rpc("account_notify_email", { p_user: userId });
    if (error) {
      // A missing migration or service key would otherwise silently stop every outcome email.
      console.error("account_notify_email failed, customer email skipped");
      return null;
    }
    if (!data) return null;
    return data.toLowerCase() === rowEmail.trim().toLowerCase() ? data : null;
  } catch {
    console.error("account_notify_email failed (no service key?), customer email skipped");
    return null;
  }
}

/** Tells a website customer their request was confirmed or cancelled; staff-entered bookings and other status changes send nothing. */
function notifyCustomer(
  source: string,
  contact: { customer_phone: string | null; customer_email: string | null; user_id: string | null },
  reference: string,
  status: BookingStatus,
  summary: string,
) {
  if (source !== "svetaine" || (status !== "patvirtinta" && status !== "atsaukta")) return;
  after(async () => {
    const email = await accountEmailFor(contact.user_id, contact.customer_email);
    await notifyRequestOutcome({ phone: contact.customer_phone, email }, reference, status, summary);
  });
}

export async function setBookingStatus(id: string, status: Booking["status"]): Promise<ActionResult> {
  const ctx = await staffClient("rezervacijos");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("reference, customer_phone, customer_email, user_id, source, kind, date, start_hour, hours")
    .maybeSingle();
  if (error) return dbError(error);
  if (data) {
    const summary =
      data.start_hour !== null && data.hours !== null
        ? saunaSummary({ date: data.date, startHour: data.start_hour, hours: data.hours })
        : describeRequest([data.kind === "pirtis" ? "Pirtis" : "Nakvyne", data.date]);
    notifyCustomer(data.source, data, data.reference, status, summary);
  }
  return done(null);
}

const newBookingInput = z
  .object({
    kind: z.enum(["pirtis", "namelis", "kemperis"]),
    /** Sauna only. */
    saunaId: z.string().regex(/^[a-z0-9-]+$/).max(60).optional(),
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
  .refine((v) => (v.kind === "pirtis" ? v.saunaId !== undefined && v.startHour !== undefined && v.hours !== undefined : v.nights !== undefined));

export type NewBookingInput = z.infer<typeof newBookingInput>;

/**
 * Stay type for a phone booking (the form asks only for cabin or camper and the party size):
 * the cheapest-capacity active type of the kind that fits the party, else the largest one.
 */
async function stayTypeFor(supabase: Extract<StaffContext, { ok: true }>["supabase"], kind: NewBookingInput["kind"], guests: number): Promise<string | null> {
  if (kind === "pirtis") return null;
  const { data } = await supabase.from("stay_types").select("id, max_guests").eq("kind", kind).eq("active", true).order("max_guests");
  const fits = (data ?? []).find((t) => t.max_guests >= guests) ?? data?.at(-1);
  return fits?.id ?? null;
}

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
      sauna_id: sauna ? v.saunaId : null,
      customer_name: v.customer.name,
      customer_phone: v.customer.phone || null,
      customer_email: v.customer.email || null,
      date: v.date,
      start_hour: sauna ? v.startHour : null,
      hours: sauna ? v.hours : null,
      nights: sauna ? null : v.nights,
      stay_type_id: await stayTypeFor(supabase, v.kind, v.guests),
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
    // Extras this sauna offers, priced from the current catalogue.
    const { data: links } = await supabase.from("sauna_upsell_links").select("sauna_upsells(*)").eq("sauna_id", v.saunaId ?? "");
    const upsells = (links ?? []).flatMap((l) => (l.sauna_upsells?.active ? [l.sauna_upsells] : []));
    const lines = upsells
      .map((u) => ({ u, qty: v.extras[u.id] ?? 0 }))
      .filter(({ qty }) => qty > 0)
      .map(({ u, qty }) => {
        const upsell: Upsell = { id: u.id, name: u.name, description: u.description, price: u.price, unit: u.unit, maxQty: u.max_qty, minHours: u.min_hours, active: u.active };
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

export async function toggleBlock(saunaId: string, date: string, hour: number, reason: string): Promise<ActionResult> {
  const ctx = await staffClient("uzimtumas");
  if (!ctx.ok) return ctx.error;
  const parsed = z
    .object({ saunaId: saunaIdSchema, date: z.iso.date(), hour: z.number().int().min(0).max(23), reason: z.string().trim().min(1).max(80) })
    .safeParse({ saunaId, date, hour, reason });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { supabase, userId } = ctx;

  const { data: existing } = await supabase.from("sauna_blocks").select("id").eq("sauna_id", saunaId).eq("date", date).eq("hour", hour).maybeSingle();
  const { error } = existing
    ? await supabase.from("sauna_blocks").delete().eq("id", existing.id)
    : await supabase.from("sauna_blocks").insert({ sauna_id: saunaId, date, hour, reason, created_by: userId });
  return error ? dbError(error) : done(null);
}

/* ---------------- inquiries ---------------- */

export async function setInquiryStatus(id: string, status: "nauja" | "susisiekta" | "pasiulymas"): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: z.enum(["nauja", "susisiekta", "pasiulymas"]) }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("inquiries").update({ status }).eq("id", id);
  return error ? dbError(error) : done(null);
}

const revalidateStayHolds = () => {
  revalidatePath("/admin", "layout");
  for (const path of ["/rezervacija", "/nakvyne", "/embed/miegas"]) revalidatePath(path);
};

/**
 * Accept a calculator inquiry: books its cabins (confirmed stay bookings on the event date, linked to the
 * inquiry) so /rezervacija no longer offers them. All or nothing; needs `uzklausos` and `rezervacijos`.
 */
export async function acceptInquiry(id: string): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.rpc("accept_inquiry_stays", { p_inquiry_id: id });
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
    return error.hint && byHint[error.hint] ? fail(byHint[error.hint], "invalid") : dbError(error);
  }
  revalidateStayHolds();
  return done(null);
}

/** Undo `acceptInquiry`: cancels the cabin bookings it created, so the cabins are free again. */
export async function releaseInquiry(id: string): Promise<ActionResult> {
  const ctx = await staffClient("uzklausos");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.rpc("release_inquiry_stays", { p_inquiry_id: id });
  if (error) return dbError(error);
  revalidateStayHolds();
  return done(null);
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
  durationMinutes: eventDurationMinutes.optional(),
  place: z.string().trim().min(2).max(80),
  blurb: z.string().trim().max(240),
  price: z.number().min(0).nullable(),
  capacity: z.number().int().min(0).nullable(),
  published: z.boolean(),
  programId: z.string().regex(/^[a-z0-9-]+$/).max(60).optional(),
  tourRouteId: z.string().regex(/^[a-z0-9-]+$/).max(60).optional(),
});

/** Events are managed with `renginiai`; staff with only `keturraciai` manage the quad tour departures (RLS limits them to category keturratis). */
const EVENT_STAFF = ["renginiai", "keturraciai"] as const;

export async function saveEvent(event: ManagedEvent): Promise<ActionResult> {
  const ctx = await staffClient(EVENT_STAFF);
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
    program_id: e.programId ?? null,
    tour_route_id: e.category === "keturratis" ? (e.tourRouteId ?? null) : null,
  });
  return error ? dbError(error) : done(null);
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const ctx = await staffClient(EVENT_STAFF);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("events").delete().eq("id", id);
  if (error?.code === "23503") return fail("Renginiui jau parduota bilietų – jį galima tik paslėpti.", "in_use");
  return error ? dbError(error) : done(null);
}

export async function setEventPublished(id: string, published: boolean): Promise<ActionResult> {
  const ctx = await staffClient(EVENT_STAFF);
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

/* ---------------- saunas & upsells ---------------- */

const saunaRevalidate = () => {
  revalidatePath("/embed/pirtis");
  revalidatePath("/rezervacija");
};

/** Create (`id` null) or update a sauna and the extras it offers; returns its id. */
export async function saveSauna(id: string | null, input: SaunaValues): Promise<ActionResult<{ id: string }>> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const parsed = saunaSchema.safeParse(input);
  if (!parsed.success || (id !== null && !saunaIdSchema.safeParse(id).success)) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const { supabase } = ctx;
  const row = { name: v.name, description: v.description, features: v.features.map((f) => f.value), active: v.active, ...fromSaunaRates(ratesFromValues(v.rates)) };

  let saunaId = id;
  if (saunaId) {
    const { data, error } = await supabase.from("saunas").update(row).eq("id", saunaId).select("id").maybeSingle();
    if (error) return dbError(error);
    if (!data) return fail("Pirtis nerasta.", "not_found");
  } else {
    const { data: existing, error: readError } = await supabase.from("saunas").select("id, sort_order");
    if (readError) return dbError(readError);
    // "nauja" is the create route (/admin/pirtis/nauja).
    const taken = new Set(["nauja", ...existing.map((s) => s.id)]);
    const base = slugify(v.name) || "pirtis";
    saunaId = base;
    for (let n = 2; taken.has(saunaId); n++) saunaId = `${base}-${n}`;
    const sortOrder = Math.max(-1, ...existing.map((s) => s.sort_order)) + 1;
    const { error } = await supabase.from("saunas").insert({ id: saunaId, ...row, sort_order: sortOrder });
    if (error) return dbError(error);
  }

  const drop = supabase.from("sauna_upsell_links").delete().eq("sauna_id", saunaId);
  const { error: dropError } = v.upsellIds.length ? await drop.not("upsell_id", "in", `(${v.upsellIds.join(",")})`) : await drop;
  if (dropError) return dbError(dropError);
  if (v.upsellIds.length) {
    const { error } = await supabase
      .from("sauna_upsell_links")
      .upsert(v.upsellIds.map((upsellId) => ({ sauna_id: saunaId, upsell_id: upsellId })), { ignoreDuplicates: true });
    if (error) return dbError(error);
  }
  saunaRevalidate();
  return done({ id: saunaId });
}

const saunaIdSchema = z.string().regex(/^[a-z0-9-]+$/).max(60);

export async function setSaunaActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  if (!saunaIdSchema.safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("saunas").update({ active }).eq("id", id);
  saunaRevalidate();
  return error ? dbError(error) : done(null);
}

/** Display order: `ids` from first to last. */
export async function reorderSaunas(ids: string[]): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  if (!z.array(saunaIdSchema).max(50).safeParse(ids).success) return fail("Netinkamos reikšmės.", "invalid");
  for (const [i, id] of ids.entries()) {
    const { error } = await ctx.supabase.from("saunas").update({ sort_order: i }).eq("id", id);
    if (error) return dbError(error);
  }
  saunaRevalidate();
  return done(null);
}

/** Only saunas without bookings; closed hours, extra links and photos go with it. */
export async function deleteSauna(id: string): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  if (!saunaIdSchema.safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase.from("saunas").delete().eq("id", id).select("photos").maybeSingle();
  if (error?.code === "23503") return fail("Pirtis turi rezervacijų – ją galima tik paslėpti.", "in_use");
  if (error) return dbError(error);
  if (data?.photos.length) await ctx.supabase.storage.from(SAUNA_PHOTO_BUCKET).remove(data.photos);
  saunaRevalidate();
  return done(null);
}

const PHOTO_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };

/** Uploads one photo (form field `file`) and adds it after the sauna's other photos. */
export async function uploadSaunaPhoto(saunaId: string, form: FormData): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const file = form.get("file");
  if (!saunaIdSchema.safeParse(saunaId).success || !(file instanceof File)) return fail("Netinkamos reikšmės.", "invalid");
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return fail("Tinka JPG, PNG, WebP arba AVIF nuotraukos.", "invalid");
  if (file.size > 5 * 1024 * 1024) return fail("Nuotrauka per didelė (daugiausia 5 MB).", "invalid");
  const { supabase } = ctx;

  const { data: sauna } = await supabase.from("saunas").select("photos").eq("id", saunaId).maybeSingle();
  if (!sauna) return fail("Pirtis nerasta.", "not_found");
  if (sauna.photos.length >= MAX_SAUNA_PHOTOS) return fail(`Daugiausia ${MAX_SAUNA_PHOTOS} nuotraukų.`, "invalid");

  const path = `${saunaId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(SAUNA_PHOTO_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (uploadError) return fail("Nepavyko įkelti nuotraukos. Bandykite dar kartą.", "storage");
  const { error } = await supabase.from("saunas").update({ photos: [...sauna.photos, path] }).eq("id", saunaId);
  if (error) {
    await supabase.storage.from(SAUNA_PHOTO_BUCKET).remove([path]);
    return dbError(error);
  }
  saunaRevalidate();
  return done(null);
}

export async function removeSaunaPhoto(saunaId: string, path: string): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  if (!saunaIdSchema.safeParse(saunaId).success) return fail("Netinkamos reikšmės.", "invalid");
  const { supabase } = ctx;
  const { data: sauna } = await supabase.from("saunas").select("photos").eq("id", saunaId).maybeSingle();
  if (!sauna?.photos.includes(path)) return fail("Nuotrauka nerasta.", "not_found");
  const { error } = await supabase.from("saunas").update({ photos: sauna.photos.filter((p) => p !== path) }).eq("id", saunaId);
  if (error) return dbError(error);
  await supabase.storage.from(SAUNA_PHOTO_BUCKET).remove([path]);
  saunaRevalidate();
  return done(null);
}

/** New photo order; must be the same photos the sauna already has. */
export async function reorderSaunaPhotos(saunaId: string, paths: string[]): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  if (!saunaIdSchema.safeParse(saunaId).success) return fail("Netinkamos reikšmės.", "invalid");
  const { supabase } = ctx;
  const { data: sauna } = await supabase.from("saunas").select("photos").eq("id", saunaId).maybeSingle();
  if (!sauna || sauna.photos.length !== paths.length || !paths.every((p) => sauna.photos.includes(p))) {
    return fail("Nuotraukos pasikeitė. Atnaujinkite puslapį.", "stale");
  }
  const { error } = await supabase.from("saunas").update({ photos: paths }).eq("id", saunaId);
  saunaRevalidate();
  return error ? dbError(error) : done(null);
}

const upsellInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200),
  price: z.number().min(0),
  unit: z.enum(["rezervacijai", "asmeniui", "vienetui", "valandai"]),
  maxQty: z.number().int().positive().nullable(),
  minHours: z.number().int().min(1).max(12).nullable(),
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
    .upsert({ id: u.id, name: u.name, description: u.description, price: u.price, unit: u.unit, max_qty: u.maxQty, min_hours: u.minHours, active: u.active });
  saunaRevalidate();
  return error ? dbError(error) : done(null);
}

export async function deleteUpsell(id: string): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const { error } = await ctx.supabase.from("sauna_upsells").delete().eq("id", id);
  saunaRevalidate();
  return error ? dbError(error) : done(null);
}

/** Same cross-field rules as the `sauna_programs` check constraints. */
const programInput = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/).max(60),
    name: z.string().trim().min(2).max(60),
    label: z.string().trim().max(40),
    description: z.string().trim().max(240),
    kind: z.enum(["session", "private"]),
    pricing: z.enum(["person", "family", "group"]),
    price: z.number().min(0).max(100000),
    childPrice: z.number().min(0).max(100000).nullable(),
    durationMinutes: z.number().int().min(30).max(720),
    capacity: z.number().int().min(1).max(100).nullable(),
    saunaId: z.string().regex(/^[a-z0-9-]+$/).max(60).nullable(),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(1000),
  })
  .refine((p) => (p.kind === "session" ? p.pricing !== "group" && p.saunaId === null && p.capacity === null : p.pricing === "group" && p.saunaId !== null && p.capacity !== null && p.durationMinutes % 60 === 0))
  .refine((p) => (p.pricing === "family") === (p.childPrice !== null));

export async function saveProgram(program: SaunaProgram): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const parsed = programInput.safeParse(program);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const p = parsed.data;
  const { error } = await ctx.supabase.from("sauna_programs").upsert({
    id: p.id,
    name: p.name,
    label: p.label,
    description: p.description,
    kind: p.kind,
    pricing: p.pricing,
    price: p.price,
    child_price: p.childPrice,
    duration_minutes: p.durationMinutes,
    capacity: p.capacity,
    sauna_id: p.saunaId,
    active: p.active,
    sort_order: p.sortOrder,
  });
  saunaRevalidate();
  return error ? dbError(error) : done(null);
}

export async function deleteProgram(id: string): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const { error } = await ctx.supabase.from("sauna_programs").delete().eq("id", id);
  saunaRevalidate();
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
  for (const path of ["/rezervacija", "/nakvyne", "/embed/miegas", "/skaiciuokle"]) revalidatePath(path);
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

export async function setRentalStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  const ctx = await staffClient("keturraciai");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase
    .from("quad_rentals")
    .update({ status })
    .eq("id", id)
    .select("reference, customer_phone, customer_email, user_id, source, date, start_hour")
    .maybeSingle();
  if (error) return dbError(error);
  if (data) {
    notifyCustomer(data.source, data, data.reference, status, describeRequest(["Keturraciai", data.date, `${String(data.start_hour).padStart(2, "0")}:00`]));
  }
  return done(null);
}

export async function setTourTicketStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  const ctx = await staffClient(["keturraciai", "renginiai"]);
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ id: z.uuid(), status: bookingStatus }).safeParse({ id, status });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase
    .from("event_tickets")
    .update({ status })
    .eq("id", id)
    .select("reference, customer_phone, customer_email, user_id, source, people")
    .maybeSingle();
  if (error) return dbError(error);
  if (data) notifyCustomer(data.source, data, data.reference, status, describeRequest(["Bilietai", `${data.people} asm.`]));
  return done(null);
}

// ---------------------------------------------------------------------------
// Apyrankės: ride plans, riders, purchases, comments, documents, bracelet
// bindings. Riders are also Klientai's customer records (ADR-0042): profile,
// avatar, comments and document actions accept either permission, since the
// RLS policies on those tables are additive for both.
// ---------------------------------------------------------------------------

const RIDER_PHOTO_BUCKET = "rider-photos" as const;
const RIDER_DOCUMENT_BUCKET = "rider-documents" as const;
const RIDER_WAIVER_BUCKET = "rider-waivers" as const;

const ridePlanCategory = z.enum(RIDE_PLAN_CATEGORIES);

const ridePlanInput = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(200),
  price: z.number().min(0).max(100_000).nullable(),
  category: ridePlanCategory,
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});

export async function saveRidePlan(plan: RidePlan): Promise<ActionResult<RidePlan>> {
  const ctx = await staffClient("apyrankes");
  if (!ctx.ok) return ctx.error;
  const parsed = ridePlanInput.safeParse(plan);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const p = parsed.data;
  const { data, error } = await ctx.supabase
    .from("ride_plans")
    .upsert({ id: plan.id || undefined, name: p.name, description: p.description, price: p.price, category: p.category, active: p.active, sort_order: p.sortOrder })
    .select("*")
    .single();
  if (error) return dbError(error);
  return done(toRidePlan(data));
}

export async function deleteRidePlan(id: string): Promise<ActionResult> {
  const ctx = await staffClient("apyrankes");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("ride_plans").delete().eq("id", id);
  if (error?.code === "23503") return fail("Šiuo planu dar naudojasi naudotojai – pirmiausia pakeiskite jų planą.", "in_use");
  return error ? dbError(error) : done(null);
}

/** Logs a plan assignment as a sale: a snapshot of the plan, so later edits/deletes never rewrite history. */
async function recordPurchase(ctx: Extract<StaffContext, { ok: true }>, riderId: string, planId: string): Promise<Purchase | null> {
  const { data: plan } = await ctx.supabase.from("ride_plans").select("name, category, price").eq("id", planId).maybeSingle();
  if (!plan) return null;
  const { data, error } = await ctx.supabase
    .from("purchases")
    .insert({ rider_id: riderId, plan_id: planId, plan_name: plan.name, plan_category: plan.category, price: plan.price, sold_by: ctx.userId })
    .select("*")
    .single();
  if (error || !data) return null;
  return toPurchase(data);
}

const newRiderInput = z.object({
  name: z.string().trim().min(1).max(60),
  surname: z.string().trim().min(1).max(60),
  planId: z.uuid(),
});

export async function createRider(input: { name: string; surname: string; planId: string }): Promise<ActionResult<{ rider: Rider; purchase: Purchase | null }>> {
  const ctx = await staffClient("apyrankes");
  if (!ctx.ok) return ctx.error;
  const parsed = newRiderInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const { data, error } = await ctx.supabase.from("riders").insert({ name: v.name, surname: v.surname, plan_id: v.planId }).select("*").single();
  if (error) return dbError(error);
  const rider = toRider(data);
  const purchase = await recordPurchase(ctx, rider.id, v.planId);
  return done({ rider, purchase });
}

export async function updateRiderPlan(riderId: string, planId: string): Promise<ActionResult<{ purchase: Purchase | null }>> {
  const ctx = await staffClient("apyrankes");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ riderId: z.uuid(), planId: z.uuid() }).safeParse({ riderId, planId });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("riders").update({ plan_id: planId }).eq("id", riderId);
  if (error) return dbError(error);
  const purchase = await recordPurchase(ctx, riderId, planId);
  return done({ purchase });
}

const riderProfileInput = z.object({
  name: z.string().trim().min(1).max(60),
  surname: z.string().trim().min(1).max(60),
  phone: z.string().trim().max(30).nullable(),
  phone2: z.string().trim().max(30).nullable(),
  email: z.string().trim().max(120).nullable(),
  birthdate: z.iso.date().nullable(),
});
export type RiderProfileInput = z.infer<typeof riderProfileInput>;

export async function updateRiderProfile(riderId: string, input: RiderProfileInput): Promise<ActionResult<Rider>> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(riderId).success) return fail("Netinkamos reikšmės.", "invalid");
  const parsed = riderProfileInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const { data, error } = await ctx.supabase
    .from("riders")
    .update({ name: v.name, surname: v.surname, phone: v.phone || null, phone2: v.phone2 || null, email: v.email || null, birthdate: v.birthdate })
    .eq("id", riderId)
    .select("*")
    .single();
  if (error) return dbError(error);
  return done(toRider(data));
}

export async function deleteRider(id: string): Promise<ActionResult> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data } = await ctx.supabase.from("riders").select("avatar_path").eq("id", id).maybeSingle();
  const { data: docs } = await ctx.supabase.from("rider_documents").select("file_path").eq("rider_id", id);
  const { error } = await ctx.supabase.from("riders").delete().eq("id", id);
  if (error) return dbError(error);
  if (data?.avatar_path) await ctx.supabase.storage.from(RIDER_PHOTO_BUCKET).remove([data.avatar_path]);
  if (docs?.length) await ctx.supabase.storage.from(RIDER_DOCUMENT_BUCKET).remove(docs.map((d) => d.file_path));
  return done(null);
}

const AVATAR_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };

export async function uploadRiderAvatar(riderId: string, form: FormData): Promise<ActionResult<{ avatarPath: string }>> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  const file = form.get("file");
  if (!z.uuid().safeParse(riderId).success || !(file instanceof File)) return fail("Netinkamos reikšmės.", "invalid");
  const ext = AVATAR_TYPES[file.type];
  if (!ext) return fail("Tinka JPG, PNG, WebP arba AVIF nuotraukos.", "invalid");
  if (file.size > 5 * 1024 * 1024) return fail("Nuotrauka per didelė (daugiausia 5 MB).", "invalid");
  const { supabase } = ctx;

  const { data: rider } = await supabase.from("riders").select("avatar_path").eq("id", riderId).maybeSingle();
  if (!rider) return fail("Naudotojas nerastas.", "not_found");

  const path = `${riderId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(RIDER_PHOTO_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (uploadError) return fail("Nepavyko įkelti nuotraukos. Bandykite dar kartą.", "storage");
  const { error } = await supabase.from("riders").update({ avatar_path: path }).eq("id", riderId);
  if (error) {
    await supabase.storage.from(RIDER_PHOTO_BUCKET).remove([path]);
    return dbError(error);
  }
  if (rider.avatar_path) await supabase.storage.from(RIDER_PHOTO_BUCKET).remove([rider.avatar_path]);
  return done({ avatarPath: path });
}

export async function removeRiderAvatar(riderId: string): Promise<ActionResult> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(riderId).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data: rider } = await ctx.supabase.from("riders").select("avatar_path").eq("id", riderId).maybeSingle();
  if (!rider?.avatar_path) return done(null);
  const { error } = await ctx.supabase.from("riders").update({ avatar_path: null }).eq("id", riderId);
  if (error) return dbError(error);
  await ctx.supabase.storage.from(RIDER_PHOTO_BUCKET).remove([rider.avatar_path]);
  return done(null);
}

/** Short-lived signed URL for a private rider photo, document or signed waiver. */
export async function getRiderFileUrl(bucket: "rider-photos" | "rider-documents" | "rider-waivers", path: string): Promise<ActionResult<{ url: string }>> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  if (!(bucket === RIDER_PHOTO_BUCKET || bucket === RIDER_DOCUMENT_BUCKET || bucket === RIDER_WAIVER_BUCKET) || !path) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error || !data) return fail("Nepavyko gauti nuorodos.", "storage");
  return done({ url: data.signedUrl });
}

const commentInput = z.object({ riderId: z.uuid(), text: z.string().trim().min(1).max(2000) });

export async function addRiderComment(riderId: string, text: string): Promise<ActionResult<RiderComment>> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  const parsed = commentInput.safeParse({ riderId, text });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data: staffRow } = await ctx.supabase.from("staff").select("display_name").eq("user_id", ctx.userId).single();
  const { data, error } = await ctx.supabase
    .from("rider_comments")
    .insert({ rider_id: parsed.data.riderId, text: parsed.data.text, author_id: ctx.userId, author_name: staffRow?.display_name ?? "Darbuotojas" })
    .select("*")
    .single();
  if (error) return dbError(error);
  return done(toRiderComment(data));
}

export async function deleteRiderComment(id: string): Promise<ActionResult> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("rider_comments").delete().eq("id", id);
  return error ? dbError(error) : done(null);
}

const DOCUMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function addRiderDocument(riderId: string, form: FormData): Promise<ActionResult<RiderDocument>> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  const file = form.get("file");
  if (!z.uuid().safeParse(riderId).success || !(file instanceof File)) return fail("Netinkamos reikšmės.", "invalid");
  if (!DOCUMENT_TYPES.has(file.type)) return fail("Tinka JPG, PNG, WebP arba PDF failai.", "invalid");
  if (file.size > 10 * 1024 * 1024) return fail("Failas per didelis (daugiausia 10 MB).", "invalid");
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const path = `${riderId}/${crypto.randomUUID()}${ext}`;
  const { error: uploadError } = await ctx.supabase.storage.from(RIDER_DOCUMENT_BUCKET).upload(path, file, { contentType: file.type });
  if (uploadError) return fail("Nepavyko įkelti failo. Bandykite dar kartą.", "storage");
  const { data, error } = await ctx.supabase
    .from("rider_documents")
    .insert({ rider_id: riderId, file_path: path, file_name: file.name.slice(0, 200), uploaded_by: ctx.userId })
    .select("*")
    .single();
  if (error) {
    await ctx.supabase.storage.from(RIDER_DOCUMENT_BUCKET).remove([path]);
    return dbError(error);
  }
  return done(toRiderDocument(data));
}

export async function deleteRiderDocument(id: string): Promise<ActionResult> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { data } = await ctx.supabase.from("rider_documents").select("file_path").eq("id", id).maybeSingle();
  const { error } = await ctx.supabase.from("rider_documents").delete().eq("id", id);
  if (error) return dbError(error);
  if (data?.file_path) await ctx.supabase.storage.from(RIDER_DOCUMENT_BUCKET).remove([data.file_path]);
  return done(null);
}

const cardNumber = z.string().regex(/^[0-9]{6,32}$/);

/**
 * Bind a scanned bracelet UID to a rider ("write user to key" — the reader can't
 * actually write to the bracelet, only report its factory UID). One bracelet ->
 * one rider; rebinding moves it. Returns the rider it was moved from, if any.
 */
export async function bindRiderCard(scannedCardNumber: string, riderId: string): Promise<ActionResult<{ replaced: Rider | null }>> {
  const ctx = await staffClient("apyrankes");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ cardNumber, riderId: z.uuid() }).safeParse({ cardNumber: scannedCardNumber, riderId });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;

  const { data: existing } = await ctx.supabase.from("rider_cards").select("rider_id").eq("card_number", v.cardNumber).maybeSingle();
  let replaced: Rider | null = null;
  if (existing && existing.rider_id !== v.riderId) {
    const { data: prevRider } = await ctx.supabase.from("riders").select("*").eq("id", existing.rider_id).maybeSingle();
    replaced = prevRider ? toRider(prevRider) : null;
  }

  const { error: deleteError } = await ctx.supabase.from("rider_cards").delete().or(`card_number.eq.${v.cardNumber},rider_id.eq.${v.riderId}`);
  if (deleteError) return dbError(deleteError);

  const { error } = await ctx.supabase.from("rider_cards").insert({ card_number: v.cardNumber, rider_id: v.riderId });
  return error ? dbError(error) : done({ replaced });
}

export interface RiderSessionScan {
  rider: Rider;
  session: RiderSession;
  action: "checked_in" | "checked_out";
}

/**
 * The instructor scan: resolve a bracelet to its rider, then toggle their
 * session — opens one if they have none running, closes the open one if they
 * do. Lets one scanner handle both check-in and check-out.
 */
export async function scanRiderSession(scannedCardNumber: string): Promise<ActionResult<RiderSessionScan>> {
  const ctx = await staffClient("instruktorius");
  if (!ctx.ok) return ctx.error;
  const parsed = cardNumber.safeParse(scannedCardNumber);
  if (!parsed.success) return fail("Netinkama apyrankė.", "invalid");
  const v = parsed.data;

  const { data: binding } = await ctx.supabase.from("rider_cards").select("rider_id").eq("card_number", v).maybeSingle();
  if (!binding) return fail("Apyrankė nepriskirta jokiam naudotojui.", "not_found");

  const { data: riderRow } = await ctx.supabase.from("riders").select("*").eq("id", binding.rider_id).maybeSingle();
  if (!riderRow) return fail("Naudotojas nerastas.", "not_found");
  const rider = toRider(riderRow);

  const { data: open } = await ctx.supabase.from("rider_sessions").select("*").eq("rider_id", rider.id).is("ended_at", null).maybeSingle();

  if (open) {
    const { data, error } = await ctx.supabase.from("rider_sessions").update({ ended_at: new Date().toISOString() }).eq("id", open.id).select("*").single();
    if (error) return dbError(error);
    return done({ rider, session: toRiderSession(data), action: "checked_out" });
  }

  const { data, error } = await ctx.supabase.from("rider_sessions").insert({ rider_id: rider.id, card_number: v }).select("*").single();
  if (error) return dbError(error);
  return done({ rider, session: toRiderSession(data), action: "checked_in" });
}
