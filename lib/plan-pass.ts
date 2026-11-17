import { z } from "zod";

/** Same alphabet and length as coupon codes (`private.generate_coupon_code`). */
export const PASS_CODE_LENGTH = 12;

/** "ABCD-EFGH-IJKL": easier to read out and to type than 12 run-together characters. */
export function formatPassCode(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

/** What a person types in (spaces, dashes, lower case) reduced to the stored code. */
export function normalizePassCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** A pass bought online without registering; staff attach it to a registered rider at the park (ADR-0109). */
export const PASS_STATUS = ["laukia_apmokejimo", "apmoketa", "priskirtas", "atsauktas"] as const;
export type PassStatus = (typeof PASS_STATUS)[number];

export const PASS_STATUS_LABELS: Record<PassStatus, string> = {
  laukia_apmokejimo: "Laukia apmokėjimo",
  apmoketa: "Apmokėtas, nepriskirtas",
  priskirtas: "Priskirtas",
  atsauktas: "Atšauktas",
};

/** Checkout form shape, shared by the pass buy form and the `buyPlanPass` action. */
export const planPassSchema = z.object({
  planId: z.uuid("Netinkamas abonementas."),
  buyerName: z.string().trim().min(2, "Įveskite vardą").max(80, "Per ilgas vardas"),
  buyerEmail: z.email("Neteisingas el. paštas").max(120),
  /** "Perku draugui": the code is meant to be handed on. */
  gift: z.boolean(),
  /** Optional, gift only: only names the friend in the e-mail. */
  recipientName: z.string().trim().max(80, "Per ilgas vardas"),
  /** Optional discount code; the database validates it and sets the price. */
  discountCode: z.string().trim().max(40).optional(),
  /** Honeypot: real visitors never see or fill it. */
  website: z.string().max(0).optional(),
});

export type PlanPassInput = z.infer<typeof planPassSchema>;
