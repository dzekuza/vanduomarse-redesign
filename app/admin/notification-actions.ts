"use server";

import { z } from "zod";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { notificationRecipientInput, type NotificationRecipientInput } from "@/lib/notification-recipient-schema";
import { toE164 } from "@/lib/sms/twilio";

/**
 * /admin/pranesimai writes: which phone numbers get staff SMS and which e-mail addresses get staff e-mail, and for which topics.
 * Owner-only (RLS enforces the same). `done` revalidates the admin layout so the store
 * resets to what the database holds.
 */

export async function saveNotificationRecipient(input: NotificationRecipientInput): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  const parsed = notificationRecipientInput.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const phone = v.phone ? toE164(v.phone) : null;
  if (v.phone && !phone) return fail("Netinkamas telefono numeris. Pavyzdys: +370 612 34567.", "invalid");
  const email = v.email ? v.email.toLowerCase() : null;

  const row = { name: v.name, phone, email, topics: v.topics, active: v.active };
  const { error } = v.id
    ? await ctx.supabase.from("notification_recipients").update(row).eq("id", v.id)
    : await ctx.supabase.from("notification_recipients").insert(row);
  if (error?.code === "23505") {
    return error.message.includes("_email_idx")
      ? fail("Šis el. paštas jau yra sąraše.", "duplicate-email")
      : fail("Šis numeris jau yra sąraše.", "duplicate");
  }
  return error ? dbError(error) : done(null);
}

export async function setNotificationRecipientActive(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success || typeof active !== "boolean") return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("notification_recipients").update({ active }).eq("id", id);
  return error ? dbError(error) : done(null);
}

export async function deleteNotificationRecipient(id: string): Promise<ActionResult> {
  const ctx = await staffClient("owner");
  if (!ctx.ok) return ctx.error;
  if (!z.uuid().safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("notification_recipients").delete().eq("id", id);
  return error ? dbError(error) : done(null);
}

/** The bell was opened: everything up to now counts as seen, for this staff member only (any staff, RLS keeps it to their own marker). */
export async function markNotificationsRead(): Promise<ActionResult<{ readAt: string }>> {
  const ctx = await staffClient("any");
  if (!ctx.ok) return ctx.error;
  const readAt = new Date().toISOString();
  const { error } = await ctx.supabase.from("staff_notification_reads").upsert({ user_id: ctx.userId, read_at: readAt });
  return error ? dbError(error) : { data: { readAt } };
}
