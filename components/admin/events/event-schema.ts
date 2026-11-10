import { z } from "zod";
import { EVENT_CATEGORIES } from "@/lib/park-events";

const optionalAmount = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), "Įveskite skaičių arba palikite tuščią.");

/** The event column is a PostgreSQL smallint. */
export const eventDurationMinutes = z.number().int().positive().max(32_767);
export const EVENT_DESCRIPTION_MAX = 5000;
export const eventDescription = z.string().trim().max(EVENT_DESCRIPTION_MAX, "Aprašymas per ilgas.");

/** Form values are strings (inputs); converted to a ManagedEvent on submit. */
export const eventSchema = z.object({
  title: z.string().trim().min(3, "Pavadinimas per trumpas.").max(80),
  category: z.enum(EVENT_CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pasirinkite laiką."),
  durationMinutes: z.string().trim(),
  place: z.string().trim().min(2, "Nurodykite vietą.").max(80),
  price: optionalAmount,
  capacity: optionalAmount,
  blurb: z.string().trim().min(10, "Aprašymas per trumpas.").max(240),
  description: eventDescription,
  published: z.boolean(),
  /** Sauna program id, or "" for none. */
  programId: z.string(),
}).refine(
  ({ category, durationMinutes }) => category !== "pirtis" || durationMinutes === "" ||
    (/^\d+$/.test(durationMinutes) && eventDurationMinutes.safeParse(Number(durationMinutes)).success),
  { path: ["durationMinutes"], message: "Įveskite teigiamą sveiką minučių skaičių arba palikite tuščią." },
);

export type EventFormValues = z.infer<typeof eventSchema>;
