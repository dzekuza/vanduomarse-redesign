"use server";

import { z } from "zod";
import type { ActionResult } from "@/app/admin/actions";
import { registrationSchema } from "@/lib/registration-schema";
import { TERMS_VERSION } from "@/lib/park-rules";
import { openPlanCheckout } from "@/lib/plan-checkout";
import { paymentsEnabled } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Public self-registration for /registracija: creates a `riders` row and its
 * `rider_waivers` consent record, then uploads the photo and signature. Runs
 * entirely as anon, through two `security definer` RPCs and two narrowly
 * scoped Storage insert policies — never a raw table or bucket write, same
 * contract as the other public forms (ADR-0010, ADR-0043).
 */

const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

const PLAN_FAILED = "Registracija įrašyta, bet nepavyko pradėti mokėjimo. Skambinkite mums ir užbaigsime užsakymą.";

/**
 * With `planId` (a bracelet plan sold online, e.g. a WAKE season pass) the registration continues into Stripe
 * Checkout: the order is created here for the rider this call just made, never for a client-supplied rider id.
 * The webhook attaches the plan after payment (ADR-0080).
 */
export async function registerRider(form: FormData): Promise<ActionResult<{ riderId: string; checkoutUrl?: string }>> {
  const parsed = registrationSchema.safeParse({
    name: form.get("name"),
    surname: form.get("surname"),
    email: form.get("email"),
    phone: form.get("phone"),
    phone2: form.get("phone2") || undefined,
    birthdate: form.get("birthdate"),
    website: form.get("website") || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Patikrinkite duomenis.", "invalid");
  const v = parsed.data;
  // A bot that filled the honeypot gets the same answer as a person, and nothing is stored.
  if (v.website) return { data: { riderId: "" } };

  // Buying a plan: refuse a bad plan or a missing payment setup BEFORE anything is saved.
  const planField = form.get("planId");
  const planId = typeof planField === "string" && planField !== "" ? planField : null;
  if (planId) {
    if (!z.uuid().safeParse(planId).success) return fail("Netinkamas abonementas.", "invalid");
    if (!paymentsEnabled()) return fail("Mokėjimas šiuo metu neveikia. Skambinkite mums ir užregistruosime jus.", "setup");
  }

  const photo = form.get("photo");
  const signature = form.get("signature");
  if (!(photo instanceof File) || !(signature instanceof File)) return fail("Trūksta nuotraukos arba parašo.", "invalid");

  const photoExt = PHOTO_TYPES[photo.type];
  if (!photoExt) return fail("Nuotrauka turi būti JPG, PNG arba WebP.", "invalid");
  if (photo.size > MAX_PHOTO_BYTES) return fail("Nuotrauka per didelė (daugiausia 5 MB).", "invalid");
  if (signature.type !== "image/png") return fail("Netinkamas parašo formatas.", "invalid");
  if (signature.size > MAX_SIGNATURE_BYTES) return fail("Parašo failas per didelis.", "invalid");

  const supabase = createPublicClient();

  const { data: riderId, error: rpcError } = await supabase.rpc("register_rider_public", {
    p_name: v.name,
    p_surname: v.surname,
    p_email: v.email,
    p_phone: v.phone,
    p_phone2: v.phone2 ?? "",
    p_birthdate: v.birthdate,
    p_terms_version: TERMS_VERSION,
  });
  if (rpcError || !riderId) return fail("Nepavyko užregistruoti. Bandykite dar kartą.", "db");

  const avatarPath = `${riderId}/avatar.${photoExt}`;
  const signaturePath = `${riderId}/signature.png`;

  const [photoUpload, signatureUpload] = await Promise.all([
    supabase.storage.from("rider-photos").upload(avatarPath, photo, { contentType: photo.type }),
    supabase.storage.from("rider-waivers").upload(signaturePath, signature, { contentType: "image/png" }),
  ]);
  if (photoUpload.error || signatureUpload.error) return fail("Registracija įrašyta, bet nepavyko įkelti failų. Kreipkitės į darbuotoją.", "upload");

  await supabase.rpc("finalize_rider_registration_public", {
    p_rider_id: riderId,
    p_avatar_path: avatarPath,
    p_signature_path: signaturePath,
  });

  if (!planId) return { data: { riderId } };

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin.rpc("create_plan_order", { p_rider_id: riderId, p_plan_id: planId });
  const row = order?.[0];
  if (orderError || !row) {
    console.error("Plan order: could not create the order", orderError);
    return fail(orderError?.hint === "plan_unavailable" ? "Šio abonemento internetu nebeparduodame. Skambinkite mums." : PLAN_FAILED, "payment");
  }
  const checkoutUrl = await openPlanCheckout({ id: row.id, reference: row.reference, planName: row.plan_name, amount: row.price, buyerEmail: row.rider_email });
  if (!checkoutUrl) {
    try {
      await admin.rpc("abandon_plan_order", { p_order_id: row.id });
    } catch (e) {
      console.error("Plan order: could not drop the order", row.reference, e);
    }
    return fail(PLAN_FAILED, "payment");
  }
  return { data: { riderId, checkoutUrl } };
}
