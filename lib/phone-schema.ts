import { z } from "zod";

/** Step 1 of the phone gate: the number to text. */
export const phoneNumberSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(30, "Per ilgas numeris")
    .refine((v) => v.replace(/\D/g, "").length >= 8, "Įveskite telefono numerį, pvz. +370 612 34567"),
});
export type PhoneNumberValues = z.infer<typeof phoneNumberSchema>;

/** Step 2: the 6-digit code from the SMS. */
export const phoneCodeSchema = phoneNumberSchema.extend({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Įveskite 6 skaitmenų kodą"),
});
export type PhoneCodeValues = z.infer<typeof phoneCodeSchema>;

/** The signed proof every public booking action needs; issued by `confirmPhoneCode`. */
export const verificationToken = z.string().max(500).optional();
