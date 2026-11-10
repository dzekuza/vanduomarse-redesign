import type { QuadPageData } from "@/lib/data/public-types";
import { freeAt, hourLabel, MAX_QUAD_RENTAL_UNITS, type QuadTourAccessory, type QuadTourRoute } from "@/lib/quads";
import type { PlanLine, When } from "@/lib/reservation";
import { hoursLabel, longDateLabel, nextDays, pastHourOn } from "@/lib/sauna";

/** A chosen tour: route, the dated departure (an event), its start, quads and gear quantities by accessory id. */
export interface QuadTourPick {
  routeId: string;
  /** The departure the booking joins. */
  eventId: string;
  startHour: number;
  units: number;
  accessories?: Record<string, number>;
}

export interface QuadTourSlot {
  hour: number;
  free: number;
  /** Set for a departure: the event a booking at this start joins. */
  eventId?: string;
}

export const QUAD_TOUR_MAX_ACCESSORIES = MAX_QUAD_RENTAL_UNITS * 2;

export interface QuadTourAccessoryItem {
  id: string;
  name: string;
  units: number;
  price: number;
  total: number;
}

/** Gear priced from the catalogue the database serves; `create_quad_tour_rental` prices it again. */
export function quadTourAccessories(catalogue: readonly QuadTourAccessory[], accessories?: Record<string, number>): { items: QuadTourAccessoryItem[]; total: number; ok: boolean; count: number } {
  const items: QuadTourAccessoryItem[] = [];
  if (accessories === undefined) return { items, total: 0, ok: true, count: 0 };
  if (!accessories || typeof accessories !== "object" || Array.isArray(accessories)) return { items, total: 0, ok: false, count: 0 };

  let ok = true;
  for (const [id, units] of Object.entries(accessories)) {
    const accessory = catalogue.find((entry) => entry.id === id);
    if (!accessory && units === 0) continue;
    if (!accessory || !Number.isInteger(units) || units < 0 || units > QUAD_TOUR_MAX_ACCESSORIES) {
      ok = false;
      continue;
    }
    if (units > 0) items.push({ id, name: accessory.name, units, price: accessory.price, total: units * accessory.price });
  }
  return {
    items,
    total: ok ? items.reduce((sum, item) => sum + item.total, 0) : 0,
    ok,
    count: items.reduce((sum, item) => sum + item.units, 0),
  };
}

/** Future starts with per-type inventory held for the full route, including full slots. */
export function quadTourSlots(data: QuadPageData, day: string, hours: number, busy: readonly number[] = []): QuadTourSlot[] {
  const { settings, types, taken, today, nowHour } = data;
  if (day < today || !Number.isInteger(hours) || hours < 1) return [];
  const past = pastHourOn(day, today, nowHour);
  const first = Math.max(settings.openHour, past + 1);
  const fleet = types.filter(({ active }) => active);
  return Array.from({ length: Math.max(0, settings.closeHour - first - hours + 1) }, (_, index) => {
    const hour = first + index;
    const occupied = Array.from({ length: hours }, (_, offset) => hour + offset);
    const free = occupied.some((part) => busy.includes(part)) ? 0 : Math.min(
      MAX_QUAD_RENTAL_UNITS,
      fleet.reduce((sum, type) => sum + Math.min(...occupied.map((part) => freeAt(type, taken, day, part))), 0),
    );
    return { hour, free };
  });
}

/**
 * The route's scheduled departures on a day. A tour is only sold on these: each shows the quads that can
 * still join, capped by the departure's own capacity and by the free fleet for the whole route.
 */
export function quadTourDepartureSlots(data: QuadPageData, day: string, route: QuadTourRoute, busy: readonly number[] = []): QuadTourSlot[] {
  const fleet = quadTourSlots(data, day, route.hours, busy);
  return data.departures
    .filter((departure) => departure.routeId === route.id && departure.date === day)
    .flatMap((departure) => {
      const slot = fleet.find(({ hour }) => hour === departure.hour);
      return slot ? [{ hour: departure.hour, free: Math.min(slot.free, departure.spotsLeft ?? slot.free), eventId: departure.id }] : [];
    })
    .toSorted((a, b) => a.hour - b.hour);
}

/** Departures of a route that still have at least its minimum number of quads. */
export function quadTourStarts(data: QuadPageData, day: string, route: QuadTourRoute, busy: readonly number[] = []) {
  return quadTourDepartureSlots(data, day, route, busy).filter(({ free }) => free >= route.minUnits);
}

/** The plan line of a chosen tour. The database prices the request again when it is filed. */
export function quadTourPlan(data: QuadPageData, when: When, pick: QuadTourPick | null, busy: readonly number[] = []): { line: PlanLine; ok: boolean; hours: number[]; maxUnits: number; route: QuadTourRoute } | null {
  const route = data.tourRoutes.find(({ id }) => id === pick?.routeId);
  if (!pick || !route) return null;
  const start = quadTourStarts(data, when.day, route, busy).find(({ eventId }) => eventId === pick.eventId);
  const maxUnits = start?.free ?? 0;
  const validUnits = Number.isInteger(pick.units) && pick.units >= 1 && pick.units <= MAX_QUAD_RENTAL_UNITS;
  const accessories = quadTourAccessories(data.tourAccessories, pick.accessories);
  const ok = validUnits && pick.units >= route.minUnits && pick.units <= maxUnits && accessories.ok;
  const time = Number.isInteger(pick.startHour) && pick.startHour >= 0 && pick.startHour + route.hours <= 24
    ? `${hourLabel(pick.startHour)}-${hourLabel(pick.startHour + route.hours)}`
    : "Pasirink laiką";
  return {
    line: {
      id: "keturraciai",
      title: `${route.name} turas`,
      detail: [`${pick.units} × Keturratis · ${hoursLabel(route.hours)}`, ...accessories.items.map((item) => `${item.units} × ${item.name}`)].join(" · "),
      schedule: `${longDateLabel(nextDays(when.day, 1)[0])}, ${time}`,
      price: validUnits && accessories.ok ? route.price * pick.units + accessories.total : 0,
    },
    ok,
    hours: ok ? Array.from({ length: route.hours }, (_, offset) => pick.startHour + offset) : [],
    maxUnits,
    route,
  };
}

/** The gear of a pick as the request wants it: only the items with a quantity. */
export function quadTourGear(accessories?: Record<string, number>): { id: string; units: number }[] {
  return Object.entries(accessories ?? {}).flatMap(([id, units]) => (units > 0 ? [{ id, units }] : []));
}
