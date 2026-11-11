import type { QuadPageData } from "@/lib/data/public-types";
import { freeAt, hourLabel, MAX_QUAD_RENTAL_UNITS } from "@/lib/quads";
import type { PlanLine, When } from "@/lib/reservation";
import { hoursLabel, longDateLabel, nextDays, pastHourOn } from "@/lib/sauna";
import { QUAD_PREVIEW_ACCESSORIES, QUAD_PREVIEW_MIN_UNITS, QUAD_PREVIEW_ROUTES } from "./quad-preview-content";

export interface QuadPreviewPick {
  routeId: string;
  startHour: number;
  units: number;
  accessories?: Record<string, number>;
}

export interface QuadPreviewSlot {
  hour: number;
  free: number;
}

export const QUAD_PREVIEW_MAX_ACCESSORIES = MAX_QUAD_RENTAL_UNITS * 2;

export interface QuadPreviewAccessoryItem {
  id: string;
  name: string;
  units: number;
  price: number;
  total: number;
}

/** Optional gear uses only the preview catalogue and never changes real request prices. */
export function quadPreviewAccessories(accessories?: Record<string, number>): { items: QuadPreviewAccessoryItem[]; total: number; ok: boolean; count: number } {
  const items: QuadPreviewAccessoryItem[] = [];
  if (accessories === undefined) return { items, total: 0, ok: true, count: 0 };
  if (!accessories || typeof accessories !== "object" || Array.isArray(accessories)) return { items, total: 0, ok: false, count: 0 };

  let ok = true;
  for (const [id, units] of Object.entries(accessories)) {
    const accessory = QUAD_PREVIEW_ACCESSORIES.find((entry) => entry.id === id);
    if (!accessory && units === 0) continue;
    if (!accessory || !Number.isInteger(units) || units < 0 || units > QUAD_PREVIEW_MAX_ACCESSORIES) {
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
export function quadPreviewSlots(data: QuadPageData, day: string, hours: number, busy: readonly number[] = []): QuadPreviewSlot[] {
  const { settings, types, taken, today, nowHour } = data;
  if (day < today || !Number.isInteger(hours) || hours < 1 || hours > settings.maxHours) return [];
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

export function quadPreviewStarts(data: QuadPageData, day: string, hours: number, busy: readonly number[] = []) {
  return quadPreviewSlots(data, day, hours, busy).filter(({ free }) => free > 0);
}

/** Supplier preview totals stay separate from actual reservation request prices. */
export function quadPreviewPlan(data: QuadPageData, when: When, pick: QuadPreviewPick | null, busy: readonly number[] = []): { line: PlanLine; ok: boolean; hours: number[]; maxUnits: number } | null {
  const route = QUAD_PREVIEW_ROUTES.find(({ id }) => id === pick?.routeId);
  if (!pick || !route) return null;
  const start = quadPreviewStarts(data, when.day, route.hours, busy).find(({ hour }) => hour === pick.startHour);
  const maxUnits = start?.free ?? 0;
  const validUnits = Number.isInteger(pick.units) && pick.units >= 1 && pick.units <= MAX_QUAD_RENTAL_UNITS;
  const accessories = quadPreviewAccessories(pick.accessories);
  const ok = validUnits && pick.units >= QUAD_PREVIEW_MIN_UNITS && pick.units <= maxUnits && accessories.ok;
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
  };
}
