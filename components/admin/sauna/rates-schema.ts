import { z } from "zod";
import { FULL_DAY_HOURS, type PriceTable, type SaunaRates } from "@/lib/sauna";

/** Lengths the price tables offer a field for (the last is the full day); an empty field means that length is not sold. */
export const LENGTH_SLOTS = [1, 2, 3, 4, 5, 6, FULL_DAY_HOURS] as const;

const whole = (min: number, max: number) => z.number({ error: "Įveskite skaičių." }).int("Tik sveikas skaičius.").min(min).max(max);
const money = z.number({ error: "Įveskite sumą." }).min(0, "Kaina negali būti neigiama.").max(100000);
/** One price per slot; `null` = not offered. */
const priceSlots = z.array(money.nullable()).length(LENGTH_SLOTS.length);

/** Sauna pricing and booking rules, with the cross-field checks the booking relies on. */
export const ratesSchema = z
  .object({
    weekdayPrices: priceSlots,
    weekendPrices: priceSlots,
    includedGuests: whole(1, 100),
    extraGuestFee: money,
    turnaroundHours: whole(0, 6),
    maxParty: whole(1, 100),
    openHour: whole(0, 23),
    closeHour: whole(1, 24),
  })
  .superRefine((r, ctx) => {
    const weekday = ratesFromValues(r).weekdayPrices;
    const weekend = ratesFromValues(r).weekendPrices;
    if (Object.keys(weekday).length === 0) ctx.addIssue({ code: "custom", path: ["weekdayPrices"], message: "Nurodykite bent vieną trukmę." });
    if (Object.keys(weekend).length === 0) ctx.addIssue({ code: "custom", path: ["weekendPrices"], message: "Nurodykite bent vieną trukmę." });
    if (r.maxParty < r.includedGuests) ctx.addIssue({ code: "custom", path: ["maxParty"], message: "Negali būti mažiau nei kaina apima." });
    const shortest = Math.min(...Object.keys(weekday).concat(Object.keys(weekend)).map(Number));
    if (Number.isFinite(shortest) && r.closeHour - r.openHour < shortest)
      ctx.addIssue({ code: "custom", path: ["closeHour"], message: "Darbo laikas trumpesnis už trumpiausią seansą." });
  });

export type RatesValues = z.infer<typeof ratesSchema>;

function toSlots(table: PriceTable): (number | null)[] {
  return LENGTH_SLOTS.map((hours) => table[hours] ?? null);
}

function fromSlots(slots: readonly (number | null)[]): PriceTable {
  const table: PriceTable = {};
  LENGTH_SLOTS.forEach((hours, i) => {
    const price = slots[i];
    if (typeof price === "number" && Number.isFinite(price)) table[hours] = price;
  });
  return table;
}

/** Model -> form values (a field per length). */
export function ratesToValues(r: SaunaRates): RatesValues {
  return {
    weekdayPrices: toSlots(r.weekdayPrices),
    weekendPrices: toSlots(r.weekendPrices),
    includedGuests: r.includedGuests,
    extraGuestFee: r.extraGuestFee,
    turnaroundHours: r.turnaroundHours,
    maxParty: r.maxParty,
    openHour: r.openHour,
    closeHour: r.closeHour,
  };
}

/** Form values -> model; `minHours` / `maxHours` are the shortest and longest length in either table. */
export function ratesFromValues(v: RatesValues): SaunaRates {
  const weekdayPrices = fromSlots(v.weekdayPrices);
  const weekendPrices = fromSlots(v.weekendPrices);
  const lengths = [...Object.keys(weekdayPrices), ...Object.keys(weekendPrices)].map(Number);
  return {
    weekdayPrices,
    weekendPrices,
    includedGuests: v.includedGuests,
    extraGuestFee: v.extraGuestFee,
    turnaroundHours: v.turnaroundHours,
    maxParty: v.maxParty,
    minHours: lengths.length ? Math.min(...lengths) : 0,
    maxHours: lengths.length ? Math.max(...lengths) : 0,
    openHour: v.openHour,
    closeHour: v.closeHour,
  };
}
