import { z } from "zod";
import { MAX_SAUNA_FEATURES, SAUNA_STATUSES } from "@/lib/sauna";
import { ratesSchema } from "./rates-schema";

/** A sauna's details, rates and offered extras; validated in the form and again in `saveSauna`. */
export const saunaSchema = z.object({
  name: z.string().trim().min(2, "Įveskite pavadinimą.").max(60, "Ne ilgiau nei 60 simbolių."),
  description: z.string().trim().max(400, "Ne ilgiau nei 400 simbolių."),
  features: z
    .array(z.object({ value: z.string().trim().min(1, "Įrašykite arba pašalinkite.").max(40, "Ne ilgiau nei 40 simbolių.") }))
    .max(MAX_SAUNA_FEATURES, `Daugiausia ${MAX_SAUNA_FEATURES} savybių.`),
  rates: ratesSchema,
  upsellIds: z.array(z.string().regex(/^[a-z0-9-]+$/).max(60)).max(50),
  status: z.enum(SAUNA_STATUSES),
});

export type SaunaValues = z.infer<typeof saunaSchema>;
