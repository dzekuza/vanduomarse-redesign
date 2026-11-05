import type { QuadPageData } from "@/lib/data/public-types";
import { freeAt, hourLabel, MAX_QUAD_RENTAL_UNITS } from "@/lib/quads";
import type { PlanLine, When } from "@/lib/reservation";
import { hoursLabel, longDateLabel, nextDays, pastHourOn } from "@/lib/sauna";
import { QUAD_PREVIEW_MIN_UNITS, QUAD_PREVIEW_ROUTES } from "./quad-preview-content";

export interface QuadPreviewPick {
  routeId: string;
  startHour: number;
  units: number;
}

/** Per-type inventory is held for the full route, then combined into one preview quantity. */
export function quadPreviewStarts(data: QuadPageData, day: string, hours: number, busy: readonly number[] = []): { hour: number; free: number }[] {
  const { settings, types, taken, today, nowHour } = data;
  if (day < today || !Number.isInteger(hours) || hours < 1 || hours > settings.maxHours) return [];
  const past = pastHourOn(day, today, nowHour);
  return Array.from({ length: Math.max(0, settings.closeHour - settings.openHour - hours + 1) }, (_, index) => {
    const hour = settings.openHour + index;
    const occupied = Array.from({ length: hours }, (_, offset) => hour + offset);
    const free = hour <= past || occupied.some((part) => busy.includes(part)) ? 0 : Math.min(
      MAX_QUAD_RENTAL_UNITS,
      types.filter((type) => type.active).reduce((sum, type) => sum + Math.min(...occupied.map((part) => freeAt(type, taken, day, part))), 0),
    );
    return { hour, free };
  }).filter(({ free }) => free > 0);
}

/** Supplier preview totals stay separate from actual reservation request prices. */
export function quadPreviewPlan(data: QuadPageData, when: When, pick: QuadPreviewPick | null, busy: readonly number[] = []): { line: PlanLine; ok: boolean; hours: number[]; maxUnits: number } | null {
  const route = QUAD_PREVIEW_ROUTES.find(({ id }) => id === pick?.routeId);
  if (!pick || !route) return null;
  const start = quadPreviewStarts(data, when.day, route.hours, busy).find(({ hour }) => hour === pick.startHour);
  const maxUnits = start?.free ?? 0;
  const validUnits = Number.isInteger(pick.units) && pick.units >= 1 && pick.units <= MAX_QUAD_RENTAL_UNITS;
  const ok = validUnits && pick.units >= QUAD_PREVIEW_MIN_UNITS && pick.units <= maxUnits;
  const time = Number.isInteger(pick.startHour) && pick.startHour >= 0 && pick.startHour + route.hours <= 24
    ? `${hourLabel(pick.startHour)}-${hourLabel(pick.startHour + route.hours)}`
    : "Pasirink laiką";
  return {
    line: {
      id: "keturraciai",
      title: `${route.name} turas`,
      detail: `${pick.units} × Keturratis · ${hoursLabel(route.hours)}`,
      schedule: `${longDateLabel(nextDays(when.day, 1)[0])}, ${time}`,
      price: validUnits ? route.price * pick.units : 0,
    },
    ok,
    hours: ok ? Array.from({ length: route.hours }, (_, offset) => pick.startHour + offset) : [],
    maxUnits,
  };
}
