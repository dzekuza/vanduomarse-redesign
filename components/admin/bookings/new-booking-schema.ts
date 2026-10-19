import { z } from "zod";

const int = (msg: string) => z.string().trim().regex(/^\d+$/, msg);

/**
 * Manual booking form. Inputs are strings; per-type requirements are checked
 * here, live availability (conflicts, cabins, group size) on submit.
 */
export const newBookingSchema = z
  .object({
    kind: z.enum(["pirtis", "namelis", "kemperis"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
    startHour: z.string(),
    hours: z.string(),
    nights: z.string(),
    guests: int("Įveskite žmonių skaičių."),
    name: z.string().trim().min(2, "Įveskite vardą."),
    phone: z.string().trim().regex(/^\+?[\d\s()-]{6,}$/, "Įveskite telefono numerį."),
    email: z.union([z.literal(""), z.email("Neteisingas el. paštas.")]),
    status: z.enum(["patvirtinta", "laukia"]),
    source: z.enum(["telefonu", "vietoje"]),
    priceOverride: z.string().trim().refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), "Suma arba tuščia."),
    note: z.string().trim().max(300),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "pirtis") {
      if (!v.startHour) ctx.addIssue({ code: "custom", path: ["startHour"], message: "Pasirinkite laisvą laiką." });
      if (!v.hours) ctx.addIssue({ code: "custom", path: ["hours"], message: "Pasirinkite trukmę." });
    } else if (!/^\d+$/.test(v.nights) || Number(v.nights) < 1 || Number(v.nights) > 14) {
      ctx.addIssue({ code: "custom", path: ["nights"], message: "Nuo 1 iki 14 naktų." });
    }
    if (Number(v.guests) < 1) ctx.addIssue({ code: "custom", path: ["guests"], message: "Bent 1 žmogus." });
  });

export type NewBookingValues = z.infer<typeof newBookingSchema>;

/** Most guests a stay allows (sheet: quads sleep 4; camper pitch is a family). */
export const STAY_MAX_GUESTS = { namelis: 4, kemperis: 6 } as const;
