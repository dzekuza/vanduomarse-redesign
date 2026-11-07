"use server";

import type { ActionResult } from "@/app/admin/actions";
import { registrationSchema } from "@/lib/registration-schema";
import { TERMS_VERSION } from "@/lib/park-rules";
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

export async function registerRider(form: FormData): Promise<ActionResult<{ riderId: string }>> {
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

  return { data: { riderId } };
}
