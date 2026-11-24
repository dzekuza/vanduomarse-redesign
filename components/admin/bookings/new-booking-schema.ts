import { z } from "zod";
import { PAYMENT_EMAIL_REQUIRED, paymentFormShape } from "./payment-form";

const int = (msg: string) => z.string().trim().regex(/^\d+$/, msg);

/**
 * Manual booking form. Inputs are strings; per-type requirements are checked
 * here, live availability (conflicts, cabins, group size) on submit. The date
 * may be in the past (e.g. adding an unpaid ticket to a sauna seansas that already
 * happened, so a payment link can still be e-mailed for it).
 */
export const newBookingSchema = z
  .object({
    kind: z.enum(["pirtis", "namelis", "kemperis", "renginys"]),
    saunaId: z.string(),
    /** The cabin or camper type picked in the first step ("" = the smallest that fits the party). */
    stayTypeId: z.string(),
    /** An event or session to add tickets to (kind "renginys"); `guests` is then the number of people. */
    eventId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pasirinkite datą."),
    startHour: z.string(),
    hours: z.string(),
    nights: z.string(),
    guests: int("Įveskite žmonių skaičių."),
    name: z.string().trim().min(2, "Įveskite vardą."),
    phone: z.string().trim().regex(/^\+?[\d\s()-]{6,}$/, "Įveskite telefono numerį."),
    email: z.union([z.literal(""), z.email("Neteisingas el. paštas.")]),
    source: z.enum(["telefonu", "vietoje"]),
    /** How it was paid at entry (used when `paid`), and whether it was; unpaid ones get a payment link by e-mail. */
    ...paymentFormShape,
    priceOverride: z.string().trim().refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), "Suma arba tuščia."),
    /** Normalised on submit; the server re-checks and prices it (ADR-0036), never trusting this string alone. */
    discountCode: z.string().trim().max(200), // raw input, before normalizeDiscountCode() strips punctuation/spaces; the real 3-30 bound is the DB's own code format
    note: z.string().trim().max(300),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "pirtis") {
      if (!v.saunaId) ctx.addIssue({ code: "custom", path: ["saunaId"], message: "Pasirinkite pirtį." });
      if (!v.startHour) ctx.addIssue({ code: "custom", path: ["startHour"], message: "Pasirinkite laisvą laiką." });
      if (!v.hours) ctx.addIssue({ code: "custom", path: ["hours"], message: "Pasirinkite trukmę." });
    } else if (v.kind === "renginys") {
      if (!v.eventId) ctx.addIssue({ code: "custom", path: ["eventId"], message: "Pasirinkite renginį." });
    } else if (!/^\d+$/.test(v.nights) || Number(v.nights) < 1 || Number(v.nights) > 14) {
      ctx.addIssue({ code: "custom", path: ["nights"], message: "Nuo 1 iki 14 naktų." });
    }
    if (v.paid === "nesumoketa" && v.email === "") ctx.addIssue({ code: "custom", path: ["email"], message: PAYMENT_EMAIL_REQUIRED });
    if (Number(v.guests) < 1) ctx.addIssue({ code: "custom", path: ["guests"], message: "Bent 1 žmogus." });
  });

export type NewBookingValues = z.infer<typeof newBookingSchema>;
