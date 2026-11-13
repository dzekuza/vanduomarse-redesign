import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isPermissionId, type PermissionId } from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared by the staff server actions (`app/admin/actions.ts`, `staff-actions.ts`).
 * Lives outside the "use server" files because those may only export async functions.
 */

export type ActionResult<T = null> = { data: T } | { error: { message: string; code?: string } };

export const fail = (message: string, code?: string): { error: { message: string; code?: string } } => ({ error: { message, code } });

export interface DbError {
  code?: string;
  hint?: string | null;
  message: string;
}

/** Postgres errors -> Lithuanian messages staff can act on. */
export function dbError(e: DbError) {
  if (e.code === "23P01") {
    const byHint: Record<string, string> = {
      sauna_blocked: "Šis pirties laikas uždarytas.",
      sauna_booked: "Šis pirties laikas jau užimtas.",
      stay_full: "Visi šio tipo nameliai tomis naktimis užimti.",
      event_full: "Renginyje nebėra vietų.",
      quad_full: "Tiek keturračių šiuo laiku nebėra.",
    };
    return fail(byHint[e.hint ?? ""] ?? "Šis laikas jau užimtas – pasirinkite kitą.", "conflict");
  }
  if (e.code === "23503") return fail("Įrašas susietas su kitais duomenimis, todėl jo pašalinti negalima.", "in_use");
  if (e.code === "23505") return fail("Toks pavadinimas ar el. paštas jau naudojamas.", "duplicate");
  if (e.code === "23514") {
    const byHint: Record<string, string> = {
      coupon_balance: "Suma viršija kupono likutį.",
      coupon_inactive: "Kuponas neaktyvus: neapmokėtas, panaudotas arba atšauktas.",
      coupon_expired: "Kuponas pasibaigęs.",
      coupon_not_pending: "Užsakymas jau apmokėtas arba atšauktas.",
      last_owner: "Negalima pašalinti, pažeminti ar išjungti paskutinio savininko.",
      owner_role: "Savininko rolės keisti ar trinti negalima.",
    };
    return fail(byHint[e.hint ?? ""] ?? "Netinkamos reikšmės.", "invalid");
  }
  if (e.code === "42501") return fail("Neturite teisės šiam veiksmui.", "forbidden");
  return fail("Nepavyko išsaugoti. Bandykite dar kartą.", "db");
}

/** What a staff action requires: one page, any of several, owner-only, or just being active staff. */
export type Need = PermissionId | readonly PermissionId[] | "owner" | "any";

export type StaffContext =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string; isOwner: boolean }
  | { ok: false; error: ReturnType<typeof fail> };

/**
 * The signed-in, active staff member with the permission `need`. The database
 * enforces the same rule through row level security; checking here gives a clear
 * message instead of a silent no-op.
 */
export async function staffClient(need: Need): Promise<StaffContext> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: fail("Prisijunkite iš naujo.", "unauthorized") };

  const { data: staff } = await supabase.from("staff").select("active, staff_roles(is_owner, permissions)").eq("user_id", auth.user.id).maybeSingle();
  if (!staff || !staff.active) return { ok: false, error: fail("Neturite prieigos.", "forbidden") };

  const isOwner = staff.staff_roles?.is_owner ?? false;
  const granted = (staff.staff_roles?.permissions ?? []).filter(isPermissionId);
  const wanted: readonly PermissionId[] = need === "owner" || need === "any" ? [] : typeof need === "string" ? [need] : need;
  const allowed = need === "any" || isOwner || (need !== "owner" && wanted.some((p) => granted.includes(p)));
  if (!allowed) return { ok: false, error: fail("Neturite teisės šiam veiksmui.", "forbidden") };

  return { ok: true, supabase, userId: auth.user.id, isOwner };
}

export function done<T>(data: T): { data: T } {
  revalidatePath("/admin", "layout");
  return { data };
}

/** Sauna ids are slugs; shared by the sauna and booking actions. */
export const saunaIdSchema = z.string().regex(/^[a-z0-9-]+$/).max(60);
