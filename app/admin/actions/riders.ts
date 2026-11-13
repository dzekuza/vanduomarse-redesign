"use server";

import { z } from "zod";
import { toPurchase, toRider, toRiderComment, toRiderDocument, toRiderSession, toRidePlan } from "@/lib/admin/mappers";
import type { Purchase, Rider, RiderComment, RiderDocument, RiderSession, RidePlan } from "@/lib/admin/types";
import { PURCHASE_PAYMENT_METHODS, RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import { TERMS_VERSION } from "@/lib/park-rules";
import { buildWaiverPdf } from "@/lib/waiver-pdf";
import { dbError, done, fail, staffClient, type ActionResult, type StaffContext } from "@/lib/admin/action-helpers";

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
  soldOnline: z.boolean(),
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
    .upsert({ id: plan.id || undefined, name: p.name, description: p.description, price: p.price, category: p.category, active: p.active, sold_online: p.soldOnline && p.price !== null && p.price > 0, sort_order: p.sortOrder })
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

/** Records how a plan sold at the till was paid (card / cash). Set once: a purchase that already has a method is refused. */
export async function setPurchasePayment(purchaseId: string, method: (typeof PURCHASE_PAYMENT_METHODS)[number]): Promise<ActionResult> {
  const ctx = await staffClient("apyrankes");
  if (!ctx.ok) return ctx.error;
  const parsed = z.object({ purchaseId: z.uuid(), method: z.enum(PURCHASE_PAYMENT_METHODS) }).safeParse({ purchaseId, method });
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const { data, error } = await ctx.supabase.rpc("set_purchase_payment", { p_purchase_id: purchaseId, p_method: method });
  if (error) return dbError(error);
  if (!data) return fail("Apmokėjimo būdas jau nurodytas.", "already_set");
  return done(null);
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

/** Bulk removal from the customer list: the same rules as `deleteRider`, in one statement so it succeeds or fails as a whole. */
export async function deleteRiders(ids: string[]): Promise<ActionResult<{ removed: string[] }>> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  const parsed = z.array(z.uuid()).min(1).max(100).safeParse(ids);
  if (!parsed.success) return fail("Pasirinkite nuo 1 iki 100 klientų.", "invalid");
  const unique = [...new Set(parsed.data)];
  const { data: avatars } = await ctx.supabase.from("riders").select("avatar_path").in("id", unique);
  const { data: docs } = await ctx.supabase.from("rider_documents").select("file_path").in("rider_id", unique);
  const { data: removed, error } = await ctx.supabase.from("riders").delete().in("id", unique).select("id");
  if (error) return dbError(error);
  const avatarPaths = (avatars ?? []).flatMap((a) => (a.avatar_path ? [a.avatar_path] : []));
  if (avatarPaths.length) await ctx.supabase.storage.from(RIDER_PHOTO_BUCKET).remove(avatarPaths);
  if (docs?.length) await ctx.supabase.storage.from(RIDER_DOCUMENT_BUCKET).remove(docs.map((d) => d.file_path));
  return done({ removed: (removed ?? []).map((r) => r.id) });
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

/**
 * The signed rules of a self-registered customer as a PDF: the park and pool rules, then the signature with the signing
 * details. Built on demand from the stored waiver. It refuses a waiver signed under another version than the rules text in
 * `lib/park-rules.ts`, so an old signature is never printed under newer wording.
 */
export async function riderWaiverPdf(riderId: string): Promise<ActionResult<{ fileName: string; base64: string }>> {
  const ctx = await staffClient(["apyrankes", "klientai"]);
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(riderId).success) return fail("Netinkamos reikšmės.", "invalid");
  const [{ data: waiver }, { data: rider }] = await Promise.all([
    ctx.supabase.from("rider_waivers").select("*").eq("rider_id", riderId).order("signed_at", { ascending: false }).limit(1).maybeSingle(),
    ctx.supabase.from("riders").select("name, surname, birthdate, email, phone").eq("id", riderId).maybeSingle(),
  ]);
  if (!waiver || !rider) return fail("Pasirašytų taisyklių nerasta.", "not_found");
  if (!waiver.signature_path) return fail("Parašo failas nerastas.", "not_found");
  if (waiver.terms_version !== TERMS_VERSION) {
    return fail(`Pasirašyta pagal taisyklių versiją ${waiver.terms_version}, o dabartinis tekstas yra ${TERMS_VERSION}. Atidarykite parašą atskirai.`, "version");
  }
  const { data: file, error } = await ctx.supabase.storage.from(RIDER_WAIVER_BUCKET).download(waiver.signature_path);
  if (error || !file) return fail("Nepavyko gauti parašo.", "storage");
  try {
    const pdf = await buildWaiverPdf({
      fullName: `${rider.name} ${rider.surname}`.trim(),
      birthdate: rider.birthdate,
      email: rider.email,
      phone: rider.phone,
      signedAt: waiver.signed_at,
      termsVersion: waiver.terms_version,
      signature: Buffer.from(await file.arrayBuffer()),
    });
    const day = waiver.signed_at.slice(0, 10);
    return done({ fileName: `Taisykles-${rider.name}-${rider.surname}-${day}.pdf`.replace(/\s+/g, "-"), base64: pdf.toString("base64") });
  } catch (e) {
    console.error("Waiver PDF could not be built", riderId, e);
    return fail("Nepavyko sukurti PDF.", "pdf");
  }
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
