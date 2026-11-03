import { z } from "zod";

const amount = (message: string) => z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, message);

/** Form values are strings (inputs); converted to a `SaunaProgram` on submit. */
export const programSchema = z
  .object({
    name: z.string().trim().min(2, "Įveskite pavadinimą.").max(60),
    label: z.string().trim().max(40, "Daugiausia 40 simbolių."),
    description: z.string().trim().max(240, "Daugiausia 240 simbolių."),
    kind: z.enum(["session", "private"]),
    pricing: z.enum(["person", "family", "group"]),
    price: amount("Įveskite kainą, pvz. 20."),
    childPrice: z.string().trim(),
    /** Hours, e.g. 2.5; private programs take whole hours. */
    hours: amount("Įveskite trukmę valandomis, pvz. 2,5."),
    capacity: z.string().trim(),
    saunaId: z.string(),
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const minutes = Math.round(Number(v.hours.replace(",", ".")) * 60);
    if (minutes < 30 || minutes > 720) ctx.addIssue({ code: "custom", path: ["hours"], message: "Nuo 0,5 iki 12 val." });
    if (v.kind === "private") {
      if (minutes % 60 !== 0) ctx.addIssue({ code: "custom", path: ["hours"], message: "Privati programa trunka pilnas valandas." });
      if (!/^\d+$/.test(v.capacity) || Number(v.capacity) < 1) ctx.addIssue({ code: "custom", path: ["capacity"], message: "Nurodykite žmonių skaičių." });
      if (!v.saunaId) ctx.addIssue({ code: "custom", path: ["saunaId"], message: "Pasirinkite pirtį." });
    }
    if (v.pricing === "family" && !/^\d+([.,]\d{1,2})?$/.test(v.childPrice)) ctx.addIssue({ code: "custom", path: ["childPrice"], message: "Įveskite vaiko kainą." });
  });

export type ProgramFormValues = z.infer<typeof programSchema>;
