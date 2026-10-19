import { z } from "zod";

const whole = (min: number, max: number) => z.number({ error: "Įveskite skaičių." }).int("Tik sveikas skaičius.").min(min).max(max);
const money = z.number({ error: "Įveskite sumą." }).min(0, "Kaina negali būti neigiama.").max(100000);

/** Sauna pricing and booking rules, with the cross-field checks the booking relies on. */
export const ratesSchema = z
  .object({
    smallGroupMax: whole(1, 50),
    smallGroupRate: money,
    largeGroupRate: money,
    maxParty: whole(1, 100),
    minHours: whole(1, 12),
    maxHours: whole(1, 12),
    packageHours: whole(1, 12),
    packagePrice: money,
    openHour: whole(0, 23),
    closeHour: whole(1, 24),
  })
  .superRefine((r, ctx) => {
    if (r.maxParty <= r.smallGroupMax)
      ctx.addIssue({ code: "custom", path: ["maxParty"], message: "Turi būti daugiau nei mažos grupės riba." });
    if (r.minHours > r.maxHours) ctx.addIssue({ code: "custom", path: ["maxHours"], message: "Negali būti mažiau nei minimali trukmė." });
    if (r.packageHours < r.minHours || r.packageHours > r.maxHours)
      ctx.addIssue({ code: "custom", path: ["packageHours"], message: "Paketas turi tilpti tarp min. ir max. trukmės." });
    if (r.closeHour - r.openHour < r.minHours)
      ctx.addIssue({ code: "custom", path: ["closeHour"], message: "Darbo laikas trumpesnis už minimalų seansą." });
  });

export type RatesValues = z.infer<typeof ratesSchema>;
