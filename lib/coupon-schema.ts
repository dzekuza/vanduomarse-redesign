import { z } from "zod";

/** Checkout form shape, shared by the /kuponai form and the `createCouponOrder` action. */
export const couponOrderSchema = z.object({
  productId: z.string().regex(/^[a-z0-9-]+$/).max(60),
  buyerName: z.string().trim().min(2, "Įveskite vardą").max(80, "Per ilgas vardas"),
  buyerEmail: z.email("Neteisingas el. paštas").max(120),
  recipientName: z.string().trim().max(80, "Per ilgas vardas"),
  message: z.string().trim().max(300, "Daugiausia 300 simbolių"),
  /** Honeypot: real visitors never see or fill it. */
  website: z.string().max(0).optional(),
});

export type CouponOrderInput = z.infer<typeof couponOrderSchema>;
