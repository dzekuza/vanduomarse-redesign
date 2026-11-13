"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ratesFromValues } from "@/components/admin/sauna/rates-schema";
import { saunaSchema, type SaunaValues } from "@/components/admin/sauna/sauna-schema";
import { fromSaunaRates } from "@/lib/admin/mappers";
import { MAX_SAUNA_PHOTOS, SAUNA_PHOTO_BUCKET, slugify } from "@/lib/sauna";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { SaunaMaster } from "@/lib/sauna-masters";
import { type Upsell } from "@/lib/sauna-upsells";
import { dbError, done, fail, saunaIdSchema, staffClient, type ActionResult } from "@/lib/admin/action-helpers";

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
  const row = { name: v.name, description: v.description, features: v.features.map((f) => f.value), active: v.status === "active", coming_soon: v.status === "coming-soon", ...fromSaunaRates(ratesFromValues(v.rates)) };

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


export async function setSaunaActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  if (!saunaIdSchema.safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("saunas").update({ active, coming_soon: false }).eq("id", id);
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

const masterInput = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240),
  price: z.number().min(0).max(100000),
  minHours: z.number().int().min(1).max(12),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(32000),
});

export async function saveSaunaMaster(master: SaunaMaster): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const parsed = masterInput.safeParse(master);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const m = parsed.data;
  const { error } = await ctx.supabase
    .from("sauna_masters")
    .upsert({ id: m.id, name: m.name, description: m.description, price: m.price, min_hours: m.minHours, active: m.active, sort_order: m.sortOrder });
  saunaRevalidate();
  return error ? dbError(error) : done(null);
}

export async function deleteSaunaMaster(id: string): Promise<ActionResult> {
  const ctx = await staffClient("pirtis");
  if (!ctx.ok) return ctx.error;
  const { error } = await ctx.supabase.from("sauna_masters").delete().eq("id", id);
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
