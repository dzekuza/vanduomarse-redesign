import { z } from "zod";
import { DISCOUNT_CODE_MAX, DISCOUNT_CODE_MIN, DISCOUNT_SERVICES, normalizeDiscountCode } from "@/lib/discount-codes";

/** The database's limits (numeric(10,2) value, max uses); the admin form uses the same ones. */
export const DISCOUNT_VALUE_MAX = 10000;
export const DISCOUNT_MAX_USES = 100000;

const twoDecimals = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;

/** What /admin/nuolaidos sends to `saveDiscountCode`; mirrors the discount_codes checks. */
export const discountCodeInput = z
  .object({
    id: z.uuid().optional(),
    code: z
      .string()
      .transform(normalizeDiscountCode)
      .pipe(z.string().min(DISCOUNT_CODE_MIN, "Kodą sudaro bent 3 raidės ar skaitmenys.").max(DISCOUNT_CODE_MAX, "Kodas per ilgas.")),
    kind: z.enum(["procentai", "suma"]),
    value: z
      .number()
      .positive("Nuolaida turi būti didesnė už nulį.")
      .max(DISCOUNT_VALUE_MAX, "Nuolaida per didelė.")
      .refine(twoDecimals, "Daugiausia du skaitmenys po kablelio."),
    services: z
      .array(z.enum(DISCOUNT_SERVICES))
      .min(1, "Pasirinkite bent vieną paslaugą.")
      .refine((s) => new Set(s).size === s.length, "Paslaugos kartojasi."),
    validFrom: z.iso.date().nullable(),
    validUntil: z.iso.date().nullable(),
    maxUses: z.number().int().positive().max(DISCOUNT_MAX_USES, "Per didelė riba.").nullable(),
    active: z.boolean(),
    note: z.string().trim().max(300),
  })
  .refine((v) => v.kind !== "procentai" || v.value <= 100, { path: ["value"], message: "Procentai negali viršyti 100." })
  .refine((v) => !v.validFrom || !v.validUntil || v.validUntil >= v.validFrom, { path: ["validUntil"], message: "Pabaiga negali būti anksčiau už pradžią." });

export type DiscountCodeInput = z.input<typeof discountCodeInput>;
