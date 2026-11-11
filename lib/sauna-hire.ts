import { z } from "zod";
import type { Sauna } from "./sauna";

export const hireDuration = z.enum(["2", "3", "4", "day"]);
export type HireDuration = z.infer<typeof hireDuration>;

const rates = z.record(hireDuration, z.number().nonnegative());
export const saunaHireTariff = z.object({
  weekday: rates,
  weekend: rates,
  includedGuests: z.number().int().positive(),
  extraGuestPrice: z.number().nonnegative(),
  hostPrice: z.number().nonnegative(),
  unhostedProgram: z.string(),
  hostedProgram: z.string(),
});
export type SaunaHireTariff = z.infer<typeof saunaHireTariff>;
export type HireBandPrices = Record<"weekday" | "weekend", number>;
export type SaunaHireEstimate = number | HireBandPrices;

export const HIRE_DURATIONS = [
  { id: "2", label: "2 val." },
  { id: "3", label: "3 val." },
  { id: "4", label: "4 val." },
  { id: "day", label: "Visa diena" },
] as const;

export function hireHours(duration: HireDuration, sauna: Sauna) {
  return duration === "day" ? sauna.rates.closeHour - sauna.rates.openHour : Number(duration);
}

function hireBand(day: string): keyof HireBandPrices {
  const weekday = new Date(day).getUTCDay();
  return weekday === 0 || weekday >= 5 ? "weekend" : "weekday";
}

export function hireBasePrice(tariff: SaunaHireTariff, duration: HireDuration, day: string) {
  return tariff[hireBand(day)][duration];
}

function hirePriceForBand(tariff: SaunaHireTariff, duration: HireDuration, band: keyof HireBandPrices, guests: number, hosted: boolean) {
  return tariff[band][duration] + (hosted ? tariff.hostPrice : 0)
    + Math.max(0, guests - tariff.includedGuests) * tariff.extraGuestPrice;
}

export function hirePrice(tariff: SaunaHireTariff, duration: HireDuration, day: string, guests: number, hosted: boolean) {
  return hirePriceForBand(tariff, duration, hireBand(day), guests, hosted);
}

export function saunaHireEstimate(tariff: SaunaHireTariff, duration: HireDuration, day: string | null, guests: number, hosted: boolean): SaunaHireEstimate {
  return day ? hirePrice(tariff, duration, day, guests, hosted) : {
    weekday: hirePriceForBand(tariff, duration, "weekday", guests, hosted),
    weekend: hirePriceForBand(tariff, duration, "weekend", guests, hosted),
  };
}
