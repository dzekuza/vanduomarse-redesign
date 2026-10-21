import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import { toBlock, toBooking, toInquiry, toManagedEvent, toPriceItem, toSaunaRates, toUpsell } from "./mappers";
import type { AdminData } from "./types";

/** Who is signed in and whether they are staff (RLS hides staff rows from everyone else). */
export async function currentStaff(supabase: ServerSupabase) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { user: null, staff: null } as const;
  const { data: staff } = await supabase.from("staff").select("user_id, display_name").eq("user_id", auth.user.id).maybeSingle();
  return { user: auth.user, staff } as const;
}

/** All dashboard data, read as the signed-in staff user. Throws if any query fails. */
export async function loadAdminData(supabase: ServerSupabase): Promise<AdminData> {
  const [bookings, blocks, inquiries, events, prices, settings, upsells] = await Promise.all([
    supabase.from("bookings").select("*, booking_extras(name, unit, quantity)").order("date").order("start_hour"),
    supabase.from("sauna_blocks").select("*").order("date").order("hour"),
    supabase.from("inquiries").select("*, inquiry_notes(text, created_at)").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("date").order("start_time"),
    supabase.from("price_items").select("*").order("sort_order"),
    supabase.from("sauna_settings").select("*").single(),
    supabase.from("sauna_upsells").select("*").order("sort_order"),
  ]);

  for (const res of [bookings, blocks, inquiries, events, prices, settings, upsells]) {
    if (res.error) throw new Error(`Admin data: ${res.error.message}`);
  }

  return {
    bookings: bookings.data!.map(toBooking),
    blocks: blocks.data!.map(toBlock),
    inquiries: inquiries.data!.map(toInquiry),
    events: events.data!.map(toManagedEvent),
    prices: prices.data!.map(toPriceItem),
    saunaRates: toSaunaRates(settings.data!),
    upsells: upsells.data!.map(toUpsell),
  };
}
