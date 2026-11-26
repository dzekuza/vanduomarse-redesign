import { z } from "zod";
import { seasonsProblem, type StaySeason } from "@/lib/cabin";

const priceField = z
  .string()
  .trim()
  .min(1, "Įveskite kainą, pvz. 50.")
  .regex(/^\d+([.,]\d{1,2})?$/, "Kaina – skaičius, pvz. 50 arba 49,50.")
  .refine((v) => Number(v.replace(",", ".")) <= 10000, "Kaina negali viršyti 10 000 €.");
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą.");

const seasonSchema = z
  .object({
    id: z.string(),
    startsOn: dateField,
    endsOn: dateField,
    price: priceField,
    price2: priceField,
    price3: priceField,
  })
  .refine((s) => s.endsOn >= s.startsOn, {
    path: ["endsOn"],
    message: "Pabaiga negali būti prieš pradžią.",
  });

export const stayTypeSchema = z.object({
  label: z.string().trim().min(2, "Įveskite pavadinimą.").max(60),
  note: z.string().trim().max(120),
  maxGuests: z
    .string()
    .trim()
    .regex(/^\d+$/, "Sveikas skaičius.")
    .refine((v) => Number(v) >= 1 && Number(v) <= 30, "Nuo 1 iki 30."),
  units: z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 500),
      "Nuo 1 iki 500.",
    ),
  price: priceField,
  price2: priceField,
  price3: priceField,
  seasons: z
    .array(seasonSchema)
    .max(24, "Daugiausia 24 sezonai.")
    .superRefine((seasons, ctx) => {
      // Only complete rows; a row missing a date already shows its own error.
      const problem = seasonsProblem(seasons.filter((s) => s.startsOn && s.endsOn));
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    }),
  /** "Rezervuoti galima iki" (exclusive), or "" for no limit. */
  bookableUntil: z.union([z.literal(""), dateField]),
  active: z.boolean(),
});

export type StayTypeValues = z.infer<typeof stayTypeSchema>;

export const toNumber = (v: string) => Number(v.replace(",", "."));

export const seasonToValues = (
  s: StaySeason,
): StayTypeValues["seasons"][number] => ({
  id: s.id,
  startsOn: s.startsOn,
  endsOn: s.endsOn,
  price: String(s.pricePerNight),
  price2: String(s.pricePerNight2),
  price3: String(s.pricePerNight3),
});

export const valuesToSeason = (
  v: StayTypeValues["seasons"][number],
): StaySeason => ({
  id: v.id,
  startsOn: v.startsOn,
  endsOn: v.endsOn,
  pricePerNight: toNumber(v.price),
  pricePerNight2: toNumber(v.price2),
  pricePerNight3: toNumber(v.price3),
});
