import "server-only";
import { connection } from "next/server";
import { toHHMM, toSaunaRates, toUpsell } from "@/lib/admin/mappers";
import type { CabinAvailability, CabinSize } from "@/lib/cabin";
import type { CabinPageData, SaunaPageData } from "./public-types";
import { EVENTS_WINDOW_DAYS, type ParkEventData } from "@/lib/park-events";
import { todayKey } from "@/lib/sauna";
import { EVENT_WINDOW_DAYS } from "@/lib/sauna-events";
import type { Tables } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Reads for the public pages. Each returns plain, serializable data (dates as
 * yyyy-mm-dd) for Client Components. `connection()` keeps them per-request so
 * availability is never served from a build-time snapshot.
 */

/** Days the sauna and cabin pickers show. */
export const SAUNA_DAYS = 14;
export const CABIN_DAYS = 21;
const MAX_NIGHTS = 14;

const CONTACT = "info@vanduomarse.lt";

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error || res.data === null) throw new Error(`${what}: ${res.error?.message ?? "no data"}`);
  return res.data;
}

const spotsLeft = (e: Tables<"events">) => (e.capacity === null ? undefined : Math.max(0, e.capacity - e.sold));

export async function getSaunaPageData(): Promise<SaunaPageData> {
  await connection();
  const supabase = createPublicClient();
  const today = todayKey();
  const last = addDays(today, Math.max(SAUNA_DAYS, EVENT_WINDOW_DAYS) - 1);

  const [settings, upsells, taken, events] = await Promise.all([
    supabase.from("sauna_settings").select("*").single(),
    supabase.from("sauna_upsells").select("*").eq("active", true).order("sort_order"),
    supabase.rpc("sauna_taken_hours", { p_from: today, p_to: last }),
    supabase
      .from("events")
      .select("*")
      .eq("category", "pirtis")
      .not("capacity", "is", null)
      .gte("date", today)
      .lte("date", addDays(today, EVENT_WINDOW_DAYS - 1))
      .order("date")
      .order("start_time"),
  ]);

  const takenByDay: Record<string, number[]> = {};
  for (const row of must(taken, "Sauna availability")) (takenByDay[row.day] ??= []).push(row.hour);

  return {
    today,
    rates: toSaunaRates(must(settings, "Sauna settings")),
    upsells: must(upsells, "Sauna upsells").map(toUpsell),
    takenByDay,
    events: must(events, "Sauna events").map((e) => ({
      key: e.id,
      title: e.title,
      host: e.place.split(" · ")[1] ?? e.place,
      date: e.date,
      time: toHHMM(e.start_time),
      minutes: e.duration_minutes,
      pricePerPerson: e.price ?? 0,
      spotsLeft: spotsLeft(e) ?? 0,
      blurb: e.blurb,
    })),
  };
}

export async function getCabinPageData(): Promise<CabinPageData> {
  await connection();
  const supabase = createPublicClient();
  const today = todayKey();
  // Last check-in day plus the longest stay.
  const rows = must(
    await supabase.rpc("stay_occupancy", { p_from: today, p_to: addDays(today, CABIN_DAYS + MAX_NIGHTS) }),
    "Cabin availability",
  );

  const availability: CabinAvailability = {};
  for (const row of rows) {
    const size = Number(row.stay_type_id.replace("namelis-", "")) as CabinSize;
    if (!row.stay_type_id.startsWith("namelis-") || row.units === null) continue;
    (availability[row.day] ??= {})[size] = Math.max(0, row.units - row.taken);
  }
  return { today, availability };
}

export async function getParkEvents(): Promise<ParkEventData[]> {
  await connection();
  const supabase = createPublicClient();
  const today = todayKey();
  const rows = must(
    await supabase
      .from("events")
      .select("*")
      .gte("date", today)
      .lte("date", addDays(today, EVENTS_WINDOW_DAYS - 1))
      .order("date")
      .order("start_time"),
    "Events",
  );

  // RLS already limits anon to published rows.
  return rows.map((e) => ({
    key: e.id,
    title: e.title,
    category: e.category,
    date: e.date,
    time: toHHMM(e.start_time),
    place: e.place,
    blurb: e.blurb,
    price: e.price,
    spotsLeft: spotsLeft(e),
    cta:
      e.category === "pirtis" && e.capacity !== null
        ? { label: "Pirkti bilietą", href: "/pirtis?skirtukas=renginiai" }
        : { label: "Registruotis", href: `mailto:${CONTACT}?subject=${encodeURIComponent(e.title)}` },
  }));
}
