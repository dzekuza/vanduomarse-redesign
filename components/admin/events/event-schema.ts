import { z } from "zod";
import { EVENT_CATEGORIES } from "@/lib/park-events";

const optionalAmount = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), "Įveskite skaičių arba palikite tuščią.");

/** Form values are strings (inputs); converted to a ManagedEvent on submit. */
export const eventSchema = z.object({
  title: z.string().trim().min(3, "Pavadinimas per trumpas.").max(80),
  category: z.enum(EVENT_CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pasirinkite laiką."),
  place: z.string().trim().min(2, "Nurodykite vietą.").max(80),
  price: optionalAmount,
  capacity: optionalAmount,
  blurb: z.string().trim().min(10, "Aprašymas per trumpas.").max(240),
  published: z.boolean(),
});

export type EventFormValues = z.infer<typeof eventSchema>;
