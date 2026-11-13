"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { loginCodeSchema } from "@/lib/customer-schema";
import { createClient } from "@/lib/supabase/server";

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

const staffEmail = z.email().max(120).transform((v) => v.toLowerCase());

/**
 * Step 1 of the e-mail code sign-in. Never creates an account (`shouldCreateUser: false`) and always answers the same,
 * so the form does not reveal which addresses belong to staff. Only a staff address ever receives a working code.
 */
export async function sendStaffCode(email: string): Promise<ActionResult> {
  const parsed = staffEmail.safeParse(email);
  if (!parsed.success) return fail("Įveskite el. paštą.", "invalid");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: parsed.data, options: { shouldCreateUser: false } });
  if (error && /rate|too many|seconds/i.test(error.message)) return fail("Kodas jau išsiųstas. Palaukite minutę ir bandykite dar kartą.", "rate_limit");
  return { data: null };
}

/** Step 2: checks the code, then signs out again unless the address is an active staff member. */
export async function confirmStaffCode(email: string, code: string): Promise<ActionResult> {
  const parsed = z.object({ email: staffEmail, code: loginCodeSchema }).safeParse({ email, code });
  if (!parsed.success) return fail("Įveskite kodą iš laiško.", "invalid");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "email" });
  if (error || !data.user) return fail("Neteisingas arba pasibaigęs kodas.", "invalid_code");
  const { data: staff } = await supabase.from("staff").select("active").eq("user_id", data.user.id).maybeSingle();
  if (!staff?.active) {
    await supabase.auth.signOut();
    return fail("Šis el. paštas neturi prieigos prie valdymo.", "forbidden");
  }
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
