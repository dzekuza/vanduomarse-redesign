import { z } from "zod";
import { DISCOUNT_SERVICES, normalizeDiscountCode } from "@/lib/discount-codes";
import { DISCOUNT_MAX_USES, DISCOUNT_VALUE_MAX, type DiscountCodeInput } from "@/lib/discount-code-schema";

/** The /admin/nuolaidos form: typed text, turned into `DiscountCodeInput` on submit. */

const amount = /^\d+([.,]\d{1,2})?$/;
const toNumber = (v: string) => Number(v.replace(",", "."));

export const discountCodeFormSchema = z
  .object({
    code: z
      .string()
      .refine((v) => normalizeDiscountCode(v).length >= 3, "Kodą sudaro bent 3 raidės ar skaitmenys.")
      .refine((v) => normalizeDiscountCode(v).length <= 30, "Kodas per ilgas."),
    kind: z.enum(["procentai", "suma"]),
    value: z.string().trim().regex(amount, "Įveskite skaičių, pvz. 10.").refine((v) => toNumber(v) > 0, "Turi būti didesnė už nulį.")
      .refine((v) => toNumber(v) <= DISCOUNT_VALUE_MAX, `Daugiausia ${DISCOUNT_VALUE_MAX} €.`),
    services: z.array(z.enum(DISCOUNT_SERVICES)).min(1, "Pasirinkite bent vieną paslaugą."),
    validFrom: z.string(),
    validUntil: z.string(),
    maxUses: z.string().trim().regex(/^(\d{1,6})?$/, "Įveskite sveiką skaičių arba palikite tuščią."),
    active: z.boolean(),
    note: z.string().trim().max(300, "Daugiausia 300 simbolių."),
  })
  .refine((v) => v.kind !== "procentai" || toNumber(v.value) <= 100, { path: ["value"], message: "Procentai negali viršyti 100." })
  .refine((v) => !v.validFrom || !v.validUntil || v.validUntil >= v.validFrom, { path: ["validUntil"], message: "Pabaiga negali būti anksčiau už pradžią." })
  .refine((v) => v.maxUses === "" || Number(v.maxUses) > 0, { path: ["maxUses"], message: "Bent 1 arba tuščia (neribota)." })
  .refine((v) => v.maxUses === "" || Number(v.maxUses) <= DISCOUNT_MAX_USES, { path: ["maxUses"], message: `Daugiausia ${DISCOUNT_MAX_USES}.` });

export type DiscountCodeFormValues = z.infer<typeof discountCodeFormSchema>;

export function toDiscountCodeInput(v: DiscountCodeFormValues, id?: string): DiscountCodeInput {
  return {
    id,
    code: v.code,
    kind: v.kind,
    value: toNumber(v.value),
    services: v.services,
    validFrom: v.validFrom || null,
    validUntil: v.validUntil || null,
    maxUses: v.maxUses ? Number(v.maxUses) : null,
    active: v.active,
    note: v.note,
  };
}
