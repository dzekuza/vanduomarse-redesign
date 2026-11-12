import { z } from "zod";

/** Checkout form shape, shared by the /kuponai form and the `createCouponOrder` action. */
export const couponOrderSchema = z.object({
  productId: z.string().regex(/^[a-z0-9-]+$/).max(60),
  buyerName: z.string().trim().min(2, "Įveskite vardą").max(80, "Per ilgas vardas"),
  buyerEmail: z.email("Neteisingas el. paštas").max(120),
  /** Optional contact number; coupon orders are not phone-verified. */
  buyerPhone: z
    .string()
    .trim()
    .max(30, "Per ilgas numeris")
    .refine((v) => v === "" || v.replace(/\D/g, "").length >= 8, "Įveskite telefono numerį, pvz. +370 612 34567"),
  recipientName: z.string().trim().max(80, "Per ilgas vardas"),
  /** Optional: the code is emailed to the recipient as well, once the order is paid. */
  recipientEmail: z.union([z.literal(""), z.email("Neteisingas el. paštas").max(120)]),
  message: z.string().trim().max(300, "Daugiausia 300 simbolių"),
  /** Honeypot: real visitors never see or fill it. */
  website: z.string().max(0).optional(),
});

export type CouponOrderInput = z.infer<typeof couponOrderSchema>;
