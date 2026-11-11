import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { Sauna } from "@/lib/sauna";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { Upsell } from "@/lib/sauna-upsells";
import type { CalculatorCatalog } from "@/lib/event-pricing";
import { toCouponProduct, toHHMM, toQuadSettings, toQuadTourAccessory, toQuadTourRoute, toQuadType, toSauna, toSaunaMaster, toSaunaProgram, toStayType, toUpsell } from "@/lib/admin/mappers";
import { MAX_STAY_NIGHTS, type CabinAvailability, type StayType } from "@/lib/cabin";
import type { CouponProduct } from "@/lib/coupons";
import type { CabinPageData, QuadPageData, SaunaPageData } from "./public-types";
import { QUAD_DAYS, type QuadTaken } from "@/lib/quads";
import { CELEBRATION_WINDOW_DAYS, EVENTS_WINDOW_DAYS, type CelebrationScheduleData, type ParkEventData } from "@/lib/park-events";
import { todayKey, vilniusHour } from "@/lib/sauna";
import { EVENT_WINDOW_DAYS, saunaSessionHref } from "@/lib/sauna-events";
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
const ROW_PAGE_SIZE = 1000;

interface AvailabilityWindow {
  days: number;
  now: Date;
}

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error || res.data === null) throw new Error(`${what}: ${res.error?.message ?? "no data"}`);
  return res.data;
}

/** Busy ranges can exceed Supabase's response limit. Callers order by a unique row key. */
async function readAvailabilityRows<T>(
  read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null; count: number | null }>,
  what: string,
): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const result = await read(rows.length, rows.length + ROW_PAGE_SIZE - 1);
    const page = must(result, what);
    rows.push(...page);
    if (!page.length || (result.count === null ? page.length < ROW_PAGE_SIZE : rows.length >= result.count)) return rows;
  }
}

const spotsLeft = (e: Tables<"events">) => (e.capacity === null ? undefined : Math.max(0, e.capacity - e.sold));

export async function getSaunaPageData(availabilityWindow?: AvailabilityWindow): Promise<SaunaPageData> {
  await connection();
  const supabase = createPublicClient();
  const now = availabilityWindow?.now ?? new Date();
  const today = todayKey(now);
  const eventDays = availabilityWindow?.days ?? EVENT_WINDOW_DAYS;
  const last = addDays(today, Math.max(availabilityWindow?.days ?? SAUNA_DAYS, eventDays) - 1);

  const [saunas, upsells, masters, programs, taken, events] = await Promise.all([
    // RLS limits anon to active saunas.
    supabase.from("saunas").select("*, sauna_upsell_links(upsell_id)").eq("active", true).order("sort_order").order("created_at"),
    supabase.from("sauna_upsells").select("*").eq("active", true).order("sort_order"),
    supabase.from("sauna_masters").select("*").eq("active", true).order("sort_order").order("created_at"),
    supabase.from("sauna_programs").select("*").eq("active", true).order("sort_order"),
    readAvailabilityRows(
      (from, to) => supabase
        .rpc("sauna_taken", { p_from: today, p_to: last }, { count: "exact" })
        .order("sauna_id").order("day").order("hour")
        .range(from, to),
      "Sauna availability",
    ),
    readAvailabilityRows(
      (from, to) => supabase
        .from("events")
        .select("*", { count: "exact" })
        .eq("category", "pirtis")
        .eq("published", true)
        .not("capacity", "is", null)
        .gte("date", today)
        .lte("date", addDays(today, eventDays - 1))
        .order("date")
        .order("start_time")
        .order("id")
        .range(from, to),
      "Sauna events",
    ),
  ]);

  const takenBySauna: Record<string, Record<string, number[]>> = {};
  for (const row of taken) ((takenBySauna[row.sauna_id] ??= {})[row.day] ??= []).push(row.hour);

  const activeUpsells = must(upsells, "Sauna upsells").map(toUpsell);
  const offered = new Set(activeUpsells.map((u) => u.id));
  const { url } = supabaseEnv();

  return {
    today,
    nowHour: vilniusHour(now),
    saunas: must(saunas, "Saunas").map((r) => {
      const sauna = toSauna(r, r.sauna_upsell_links, url);
      const upsellIds = sauna.upsellIds.filter((id) => offered.has(id));
      if (sauna.id !== "pirtis-marse") return { ...sauna, upsellIds };
      // The existing reservation venue is the Finnish sauna. Correct only the seeded display copy.
      return {
        ...sauna,
        upsellIds,
        name: sauna.name === "Pirtis Marse" ? "Suomiška sauna" : sauna.name,
        description: sauna.description === "Malkomis kūrenama pirtis prie pat ežero kranto."
          ? "Suomiška sauna prie ežero su panoraminiais langais."
          : sauna.description,
        features: sauna.features.filter((feature) => feature !== "Kūrenama malkomis"),
      };
    }),
    upsells: activeUpsells,
    masters: must(masters, "Sauna masters").map(toSaunaMaster),
    programs: must(programs, "Sauna programs").map(toSaunaProgram),
    takenBySauna,
    events: events.map((e) => {
      const [venue, attendant] = e.place.split(" · ");
      const host = attendant?.trim();
      return {
        key: e.id,
        title: e.title,
        host: host ?? e.place,
        venue: venue.trim(),
        hostName: host && !/^(atvira grupė|su pirtininku|be pirtininko)$/i.test(host) ? host : undefined,
        date: e.date,
        time: toHHMM(e.start_time),
        minutes: e.duration_minutes,
        pricePerPerson: e.price ?? 0,
        capacity: e.capacity ?? 0,
        spotsLeft: spotsLeft(e) ?? 0,
        blurb: e.blurb,
        description: "description" in e && typeof e.description === "string" ? e.description : undefined,
        programId: e.program_id,
      };
    }),
  };
}

/** Active stay types (cabin sizes, camper pitches) in display order; RLS lets anon read inactive rows too, so filter here. */
async function loadStayTypes(): Promise<StayType[]> {
  await connection();
  const supabase = createPublicClient();
  return must(await supabase.from("stay_types").select("*").eq("active", true).order("sort_order"), "Stay types").map(toStayType);
}

/** Memoised per request, so pages and readers that share it query Supabase once. */
export const getStayTypes = cache(loadStayTypes);

/** Active saunas for the event calculator: the same rows and rates as /pirtis, so quotes match real prices. */
async function getActiveSaunas(): Promise<Sauna[]> {
  await connection();
  const supabase = createPublicClient();
  const { url } = supabaseEnv();
  const rows = must(
    await supabase.from("saunas").select("*, sauna_upsell_links(upsell_id)").eq("active", true).order("sort_order").order("created_at"),
    "Saunas",
  );
  return rows.map((r) => toSauna(r, r.sauna_upsell_links, url));
}

/** Active private sauna programs (a whole sauna at a flat price), for the event calculator. */
async function getPrivatePrograms(): Promise<SaunaProgram[]> {
  await connection();
  const supabase = createPublicClient();
  const rows = must(
    await supabase.from("sauna_programs").select("*").eq("active", true).eq("kind", "private").order("sort_order"),
    "Sauna programs",
  );
  return rows.map(toSaunaProgram).filter((p) => p.saunaId !== null);
}

/** Active sauna extras (priedai), for the event calculator. */
async function getActiveUpsells(): Promise<Upsell[]> {
  await connection();
  const supabase = createPublicClient();
  return must(await supabase.from("sauna_upsells").select("*").eq("active", true).order("sort_order"), "Sauna upsells").map(toUpsell);
}

/** Everything the event calculator reads from the database: cabin sizes, saunas and their private programs. */
async function loadCalculatorCatalog(): Promise<CalculatorCatalog> {
  const [stayTypes, saunas, programs, upsells] = await Promise.all([getStayTypes(), getActiveSaunas(), getPrivatePrograms(), getActiveUpsells()]);
  return { stayTypes, saunas, programs, upsells };
}

/** Memoised per request, so pages and readers that share it query Supabase once. */
export const getCalculatorCatalog = cache(loadCalculatorCatalog);

export async function getCabinPageData(availabilityWindow?: AvailabilityWindow): Promise<CabinPageData> {
  await connection();
  const supabase = createPublicClient();
  const today = todayKey(availabilityWindow?.now);
  // Last check-in day plus the longest stay.
  const last = addDays(today, (availabilityWindow?.days ?? CABIN_DAYS) + MAX_STAY_NIGHTS);
  const [stayTypes, rows] = await Promise.all([
    getStayTypes(),
    readAvailabilityRows(
      (from, to) => supabase
        .rpc("stay_occupancy", { p_from: today, p_to: last }, { count: "exact" })
        .order("day").order("stay_type_id")
        .range(from, to),
      "Cabin availability",
    ),
  ]);

  const availability: CabinAvailability = {};
  for (const row of rows) {
    if (row.units === null) continue;
    (availability[row.day] ??= {})[row.stay_type_id] = Math.max(0, row.units - row.taken);
  }
  return { today, stayTypes, availability };
}

async function loadParkEvents(windowDays = EVENTS_WINDOW_DAYS, date?: string): Promise<ParkEventData[]> {
  await connection();
  const supabase = createPublicClient();
  const today = date ?? todayKey();
  const rows = await readAvailabilityRows(
    (from, to) => supabase
      .from("events")
      .select("*", { count: "exact" })
      .eq("published", true)
      .gte("date", today)
      .lte("date", addDays(today, windowDays - 1))
      .order("date")
      .order("start_time")
      .order("id")
      .range(from, to),
    "Events",
  );

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
    capacity: e.capacity ?? undefined,
    cta:
      e.category === "pirtis" && e.capacity !== null
        ? { label: "Pirkti bilietą", href: saunaSessionHref(e.id) }
        : e.category === "keturratis" && e.capacity !== null
          ? { label: "Registruotis į žygį", href: "/rezervacija?veikla=keturraciai" }
          : { label: "Registruotis" },
  }));
}

/** Memoised per request, so pages and readers that share it query Supabase once. */
export const getParkEvents = cache(loadParkEvents);

/** Public event details plus the dates explicitly marked private by staff. */
export async function getCelebrationSchedule(): Promise<CelebrationScheduleData> {
  await connection();
  const today = todayKey();
  const supabase = createPublicClient();
  const [events, dates] = await Promise.all([
    getParkEvents(CELEBRATION_WINDOW_DAYS, today),
    supabase.rpc("private_event_dates", { p_from: today, p_to: addDays(today, CELEBRATION_WINDOW_DAYS - 1) }),
  ]);
  // Until the calendar migration is applied the published event schedule can still render.
  const privateDates = dates.error?.code === "PGRST202" ? [] : must(dates, "Private event dates").map(({ event_date }) => event_date);
  return { today, events, privateDates };
}

/** Active coupon products for /kuponai (RLS limits anon to active rows). */
async function loadCouponProducts(): Promise<CouponProduct[]> {
  await connection();
  const supabase = createPublicClient();
  return must(await supabase.from("coupon_products").select("*").eq("active", true).order("sort_order"), "Coupon products").map(toCouponProduct);
}

/** Memoised per request, so pages and readers that share it query Supabase once. */
export const getCouponProducts = cache(loadCouponProducts);

/** Days of guided tours the quad page lists. */
const TOUR_DAYS = 60;


/** Fleet, opening hours, hourly availability and upcoming tours for /keturraciai. */
export async function getQuadPageData(availabilityWindow?: AvailabilityWindow): Promise<QuadPageData> {
  await connection();
  const supabase = createPublicClient();
  const now = availabilityWindow?.now ?? new Date();
  const today = todayKey(now);
  const last = addDays(today, availabilityWindow ? availabilityWindow.days - 1 : QUAD_DAYS);

  const [types, settings, taken, tours, routes, accessories, departures] = await Promise.all([
    supabase.from("quad_types").select("*").eq("active", true).order("sort_order"),
    supabase.from("quad_settings").select("*").single(),
    readAvailabilityRows(
      (from, to) => supabase
        .rpc("quad_taken", { p_from: today, p_to: last }, { count: "exact" })
        .order("day").order("hour").order("quad_type_id")
        .range(from, to),
      "Quad availability",
    ),
    supabase
      .from("events")
      .select("*")
      .eq("category", "keturratis")
      .not("capacity", "is", null)
      .is("tour_route_id", null)
      .gte("date", today)
      .lte("date", addDays(today, TOUR_DAYS - 1))
      .order("date")
      .order("start_time"),
    // RLS limits anon to active rows.
    supabase.from("quad_tour_routes").select("*").eq("active", true).order("sort_order").order("id"),
    supabase.from("quad_tour_accessories").select("*").eq("active", true).order("sort_order").order("id"),
    // RLS limits anon to published events. Only inside the fleet availability window, so every departure has stock data.
    supabase
      .from("events")
      .select("*")
      .eq("category", "keturratis")
      .not("tour_route_id", "is", null)
      .gte("date", today)
      .lte("date", last)
      .order("date")
      .order("start_time"),
  ]);

  const takenMap: QuadTaken = {};
  for (const row of taken) ((takenMap[row.day] ??= {})[row.quad_type_id] ??= {})[row.hour] = row.taken;

  return {
    today,
    nowHour: vilniusHour(now),
    types: must(types, "Quad types").map(toQuadType),
    settings: toQuadSettings(must(settings, "Quad settings")),
    taken: takenMap,
    tourRoutes: must(routes, "Quad tour routes").map(toQuadTourRoute),
    tourAccessories: must(accessories, "Quad tour accessories").map(toQuadTourAccessory),
    departures: must(departures, "Quad tour departures").flatMap((e) =>
      e.tour_route_id ? [{ id: e.id, routeId: e.tour_route_id, date: e.date, hour: Number(toHHMM(e.start_time).slice(0, 2)), capacity: e.capacity, spotsLeft: spotsLeft(e) ?? null }] : [],
    ),
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
