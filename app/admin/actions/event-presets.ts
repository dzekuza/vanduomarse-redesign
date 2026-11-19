"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ManagedEventPreset } from "@/lib/admin/types";
import { dbError, done, fail, staffClient, type ActionResult } from "@/lib/admin/action-helpers";
import { slugify } from "@/lib/sauna";

/* ---------------- calculator event types (renginio tipas) ---------------- */

const presetInput = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/).max(60).nullable(),
    label: z.string().trim().min(2).max(60),
    perGuestMin: z.number().min(0).max(100000),
    perGuestMax: z.number().min(0).max(100000),
    adults: z.number().int().min(1).max(1000),
    kids: z.number().int().min(0).max(1000),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(32000),
  })
  .refine((v) => v.perGuestMax >= v.perGuestMin);

export type EventPresetInput = z.infer<typeof presetInput>;

/** The public pages with the calculator are cached; refresh them so a change shows at once. */
const refreshPublic = () => revalidatePath("/", "layout");

/** Creates (`id` null, the id comes from the label) or updates an event type. */
export async function saveEventPreset(input: EventPresetInput): Promise<ActionResult<{ preset: ManagedEventPreset }>> {
  const ctx = await staffClient("kainos");
  if (!ctx.ok) return ctx.error;
  const parsed = presetInput.safeParse(input);
  if (!parsed.success) return fail("Netinkamos reikšmės.", "invalid");
  const v = parsed.data;
  const row = { label: v.label, per_guest_min: v.perGuestMin, per_guest_max: v.perGuestMax, adults: v.adults, kids: v.kids, active: v.active, sort_order: v.sortOrder };

  let id = v.id;
  if (id) {
    const { error } = await ctx.supabase.from("event_presets").update(row).eq("id", id);
    if (error) return dbError(error);
  } else {
    const base = slugify(v.label) || "tipas";
    const { data: taken } = await ctx.supabase.from("event_presets").select("id").like("id", `${base}%`);
    const used = new Set((taken ?? []).map((r) => r.id));
    id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    const { error } = await ctx.supabase.from("event_presets").insert({ id, ...row });
    if (error) return dbError(error);
  }
  refreshPublic();
  return done({ preset: { id, label: v.label, perGuest: { min: v.perGuestMin, max: v.perGuestMax }, adults: v.adults, kids: v.kids, active: v.active, sortOrder: v.sortOrder } });
}

export async function deleteEventPreset(id: string): Promise<ActionResult> {
  const ctx = await staffClient("kainos");
  if (!ctx.ok) return ctx.error;
  if (!z.string().regex(/^[a-z0-9-]+$/).max(60).safeParse(id).success) return fail("Netinkamos reikšmės.", "invalid");
  const { error } = await ctx.supabase.from("event_presets").delete().eq("id", id);
  if (error) return dbError(error);
  refreshPublic();
  return done(null);
}
