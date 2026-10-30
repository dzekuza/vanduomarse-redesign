import "server-only";
import { connection } from "next/server";
import { toCouponProduct, toHHMM, toQuadSettings, toQuadType, toSauna, toUpsell } from "@/lib/admin/mappers";
import type { CabinAvailability, CabinSize } from "@/lib/cabin";
import type { CouponProduct } from "@/lib/coupons";
import type { CabinPageData, QuadPageData, SaunaPageData } from "./public-types";
import { QUAD_DAYS, type QuadTaken } from "@/lib/quads";
import { EVENTS_WINDOW_DAYS, type ParkEventData } from "@/lib/park-events";
import { todayKey, vilniusHour } from "@/lib/sauna";
import { EVENT_WINDOW_DAYS } from "@/lib/sauna-events";
import type { Tables } from "@/lib/supabase/database.types";
import { supabaseEnv } from "@/lib/supabase/env";
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

  const [saunas, upsells, taken, events] = await Promise.all([
    // RLS limits anon to active saunas.
    supabase.from("saunas").select("*, sauna_upsell_links(upsell_id)").eq("active", true).order("sort_order").order("created_at"),
    supabase.from("sauna_upsells").select("*").eq("active", true).order("sort_order"),
    supabase.rpc("sauna_taken", { p_from: today, p_to: last }),
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

  const takenBySauna: Record<string, Record<string, number[]>> = {};
  for (const row of must(taken, "Sauna availability")) ((takenBySauna[row.sauna_id] ??= {})[row.day] ??= []).push(row.hour);

  const activeUpsells = must(upsells, "Sauna upsells").map(toUpsell);
  const offered = new Set(activeUpsells.map((u) => u.id));
  const { url } = supabaseEnv();

  return {
    today,
    nowHour: vilniusHour(),
    saunas: must(saunas, "Saunas").map((r) => {
      const sauna = toSauna(r, r.sauna_upsell_links, url);
      return { ...sauna, upsellIds: sauna.upsellIds.filter((id) => offered.has(id)) };
    }),
    upsells: activeUpsells,
    takenBySauna,
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
        : e.category === "keturratis" && e.capacity !== null
          ? { label: "Registruotis į žygį", href: "/keturraciai?skirtukas=zygiai" }
          : { label: "Registruotis" },
  }));
}

/** Active coupon products for /kuponai (RLS limits anon to active rows). */
export async function getCouponProducts(): Promise<CouponProduct[]> {
  await connection();
  const supabase = createPublicClient();
  return must(await supabase.from("coupon_products").select("*").eq("active", true).order("sort_order"), "Coupon products").map(toCouponProduct);
}

/** Days of guided tours the quad page lists. */
const TOUR_DAYS = 60;


/** Fleet, opening hours, hourly availability and upcoming tours for /keturraciai. */
export async function getQuadPageData(): Promise<QuadPageData> {
  await connection();
  const supabase = createPublicClient();
  const today = todayKey();

  const [types, settings, taken, tours] = await Promise.all([
    supabase.from("quad_types").select("*").eq("active", true).order("sort_order"),
    supabase.from("quad_settings").select("*").single(),
    supabase.rpc("quad_taken", { p_from: today, p_to: addDays(today, QUAD_DAYS) }),
    supabase
      .from("events")
      .select("*")
      .eq("category", "keturratis")
      .not("capacity", "is", null)
      .gte("date", today)
      .lte("date", addDays(today, TOUR_DAYS - 1))
      .order("date")
      .order("start_time"),
  ]);

  const takenMap: QuadTaken = {};
  for (const row of must(taken, "Quad availability")) ((takenMap[row.day] ??= {})[row.quad_type_id] ??= {})[row.hour] = row.taken;

  return {
    today,
    nowHour: vilniusHour(),
    types: must(types, "Quad types").map(toQuadType),
    settings: toQuadSettings(must(settings, "Quad settings")),
    taken: takenMap,
    tours: must(tours, "Quad tours").map((e) => ({
      key: e.id,
      title: e.title,
      date: e.date,
      time: toHHMM(e.start_time),
      minutes: e.duration_minutes,
      pricePerPerson: e.price ?? 0,
      spotsLeft: spotsLeft(e) ?? 0,
      blurb: e.blurb,
      place: e.place,
    })),
  };
}
