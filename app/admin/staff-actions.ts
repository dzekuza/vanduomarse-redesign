"use server";

import { randomInt } from "node:crypto";
import { z } from "zod";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { PERMISSION_IDS } from "@/lib/admin/permissions";
import { createAdminClient, MissingServiceKeyError } from "@/lib/supabase/admin";

/**
 * Owner-only: who can sign in and which pages each role opens. Row level
 * security allows only owners to change staff and roles; `staffClient("owner")`
 * gives a clear message first. Logins are created and removed through the auth
 * admin API (service-role key, server only).
 */

const TEMP_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 12 random characters without look-alikes (no 0/O, 1/l/I). */
const tempPassword = () => Array.from({ length: 12 }, () => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]).join("");

function adminClient() {
  try {
    return { ok: true as const, admin: createAdminClient() };
  } catch (e) {
    if (e instanceof MissingServiceKeyError) {
      return { ok: false as const, error: fail("Trūksta SUPABASE_SERVICE_ROLE_KEY serverio aplinkoje. Įrašykite jį į .env.local ir paleiskite iš naujo.", "missing_key") };
    }
    throw e;
  }
}

const userId = z.uuid();

export interface NewLogin {
  userId: string;
  /** Shown to the owner once: it is not stored anywhere readable. */
  tempPassword: string;
}

const newStaffInput = z.object({
  email: z.email().max(120).transform((v) => v.toLowerCase()),
  displayName: z.string().trim().min(2).max(80),
  roleId: z.uuid(),
});

export async function createStaff(input: z.input<typeof newStaffInput>): Promise<ActionResult<NewLogin>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const parsed = newStaffInput.safeParse(input);
  if (!parsed.success) return fail("Patikrinkite vardą, el. paštą ir rolę.", "invalid");
  const v = parsed.data;
  const client = adminClient();
  if (!client.ok) return client.error;

  const { data: role } = await ctx.supabase.from("staff_roles").select("id").eq("id", v.roleId).maybeSingle();
  if (!role) return fail("Tokios rolės nėra.", "invalid");

  const password = tempPassword();
  const { data: created, error: authError } = await client.admin.auth.admin.createUser({ email: v.email, password, email_confirm: true });
  if (authError || !created.user) {
    const taken = /already|registered|exists/i.test(authError?.message ?? "");
    return fail(taken ? "Šis el. paštas jau turi paskyrą. Naudokite kitą arba pašalinkite senąją Supabase skiltyje Authentication." : "Nepavyko sukurti paskyros.", taken ? "duplicate" : "auth");
  }

  const { error } = await ctx.supabase.from("staff").insert({ user_id: created.user.id, display_name: v.displayName, role_id: v.roleId, email: v.email });
  if (error) {
    await client.admin.auth.admin.deleteUser(created.user.id);
    return dbError(error);
  }
  return done({ userId: created.user.id, tempPassword: password });
}

export async function resetStaffPassword(id: string): Promise<ActionResult<{ tempPassword: string }>> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!userId.safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const client = adminClient();
  if (!client.ok) return client.error;

  const { data: member } = await ctx.supabase.from("staff").select("user_id").eq("user_id", id).maybeSingle();
  if (!member) return fail("Tokio darbuotojo nėra.", "invalid");

  const password = tempPassword();
  const { error } = await client.admin.auth.admin.updateUserById(id, { password });
  if (error) return fail("Nepavyko pakeisti slaptažodžio.", "auth");
  return { data: { tempPassword: password } };
}

export async function setStaffRole(id: string, roleId: string): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!z.object({ id: userId, roleId: z.uuid() }).safeParse({ id, roleId }).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("staff").update({ role_id: roleId }).eq("user_id", id);
  return error ? dbError(error) : done(null);
}

export async function setStaffActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!z.object({ id: userId, active: z.boolean() }).safeParse({ id, active }).success) return fail("Netinkamos reikšmės.", "invalid");
  if (id === ctx.userId && !active) return fail("Savęs išjungti negalima.", "invalid");
  const { error } = await ctx.supabase.from("staff").update({ active }).eq("user_id", id);
  return error ? dbError(error) : done(null);
}

export async function removeStaff(id: string): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!userId.safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  if (id === ctx.userId) return fail("Savęs pašalinti negalima.", "invalid");
  const client = adminClient();
  if (!client.ok) return client.error;

  // The staff row goes first: the database refuses to drop the last owner.
  const { error } = await ctx.supabase.from("staff").delete().eq("user_id", id);
  if (error) return dbError(error);
  await client.admin.auth.admin.deleteUser(id);
  return done(null);
}

const roleInput = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().max(120),
  permissions: z.array(z.enum(PERMISSION_IDS)).max(PERMISSION_IDS.length).transform((p) => [...new Set(p)]),
});

export async function saveRole(input: z.input<typeof roleInput>): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const parsed = roleInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const r = parsed.data;
  const { error } = await ctx.supabase.from("staff_roles").upsert({ id: r.id, name: r.name, description: r.description, permissions: r.permissions });
  return error ? dbError(error) : done(null);
}

export async function deleteRole(id: string): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("staff_roles").delete().eq("id", id);
  if (error?.code === "23503") return fail("Rolė priskirta darbuotojams: pirmiausia pakeiskite jų rolę.", "in_use");
  return error ? dbError(error) : done(null);
}
