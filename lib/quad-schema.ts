import { z } from "zod";
import { verificationToken } from "@/lib/phone-schema";
import { MAX_QUAD_RENTAL_UNITS } from "@/lib/quads";

export const contactFields = z.object({
  customerName: z.string().trim().min(2, "Įveskite vardą").max(80, "Per ilgas vardas"),
  customerPhone: z.string().trim().max(30, "Per ilgas numeris"),
  customerEmail: z.union([z.literal(""), z.email("Neteisingas el. paštas").max(120)]),
  /** Honeypot: real visitors never see or fill it. */
  website: z.string().max(0).optional(),
  /** From the phone gate; the actions check it matches customerPhone. */
  verificationToken,
  /**
   * Set only by the paid reservation flow: the request waits for its Stripe payment, so the
   * "request received" texts are sent when it is paid instead of when it is filed.
   */
  awaitingPayment: z.boolean().optional(),
  /**
   * Set by the reservation page: file the request for the signed-in customer account (its confirmed
   * phone or email, read from the session) instead of a typed phone with an SMS token.
   */
  viaAccount: z.boolean().optional(),
  /**
   * Set by the reservation page for "pay on site": the account's confirmed phone is the proof, so the
   * database confirms the request at once (`confirm_cash_request`) and staff need not.
   */
  payOnSite: z.boolean().optional(),
  /** Reservation discount code; every booking RPC validates it and prices it again (ADR-0036). */
  discountCode: z.string().trim().max(40).optional(),
});

export const needsContact = (v: { customerPhone: string; customerEmail: string }) => v.customerPhone !== "" || v.customerEmail !== "";
export const contactError = { message: "Nurodykite telefoną arba el. paštą", path: ["customerPhone"] };

/** What the visitor types in the last step (the choices above it live in component state). */
export const quadContactSchema = contactFields.extend({ note: z.string().trim().max(300, "Daugiausia 300 simbolių") }).refine(needsContact, contactError);
export type QuadContactValues = z.infer<typeof quadContactSchema>;

/** Tour seats: contact + how many. */
export const tourContactSchema = contactFields.refine(needsContact, contactError);
export type TourContactValues = z.infer<typeof tourContactSchema>;

const quadRentalDetails = contactFields.extend({
  date: z.iso.date(),
  startHour: z.number().int().min(0).max(23),
  hours: z.number().int().min(1).max(8),
  riders: z.number().int().min(1).max(MAX_QUAD_RENTAL_UNITS * 2),
  note: z.string().trim().max(300),
});

const quadAllocation = z.object({
  quadTypeId: z.string().regex(/^[a-z0-9-]+$/).max(60),
  units: z.number().int().min(1).max(MAX_QUAD_RENTAL_UNITS),
});

/** Hourly single-type rental request, validated by `createQuadRental`. */
export const quadRentalSchema = quadRentalDetails.extend(quadAllocation.shape).refine(needsContact, contactError);
export type QuadRentalInput = z.infer<typeof quadRentalSchema>;

/** Multiple types sharing one slot, validated by `createMixedQuadRental`. */
export const mixedQuadRentalSchema = quadRentalDetails
  .extend({ allocations: z.array(quadAllocation).min(2).max(MAX_QUAD_RENTAL_UNITS) })
  .refine(needsContact, contactError)
  .refine(({ allocations }) => new Set(allocations.map((a) => a.quadTypeId)).size === allocations.length, {
    path: ["allocations"], message: "Kiekvieną keturračių tipą nurodykite vieną kartą.",
  })
  .refine(({ allocations }) => allocations.reduce((sum, a) => sum + a.units, 0) <= MAX_QUAD_RENTAL_UNITS, {
    path: ["allocations"], message: `Vienu metu galima rezervuoti iki ${MAX_QUAD_RENTAL_UNITS} keturračių.`,
  });
export type MixedQuadRentalInput = z.infer<typeof mixedQuadRentalSchema>;

const tourGear = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(60),
  units: z.number().int().min(1).max(MAX_QUAD_RENTAL_UNITS * 2),
});

/** A Mini / Midi / Maxi tour for N quads at any start the fleet covers; route, gear and prices are database rows, validated again by `create_quad_tour_rental`. */
export const quadTourRentalSchema = contactFields
  .extend({
    routeId: z.string().regex(/^[a-z0-9-]+$/).max(60),
    date: z.iso.date(),
    startHour: z.number().int().min(0).max(23),
    units: z.number().int().min(1).max(MAX_QUAD_RENTAL_UNITS),
    accessories: z.array(tourGear).max(10),
    note: z.string().trim().max(300),
  })
  .refine(needsContact, contactError)
  .refine(({ accessories }) => new Set(accessories.map((g) => g.id)).size === accessories.length, {
    path: ["accessories"], message: "Kiekvieną priedą nurodykite vieną kartą.",
  });
export type QuadTourRentalInput = z.infer<typeof quadTourRentalSchema>;

/** Guided tour ticket request, validated again by the `createTourTicket` action. */
export const tourTicketSchema = contactFields.extend({ eventId: z.uuid(), people: z.number().int().min(1).max(20) }).refine(needsContact, contactError);
export type TourTicketInput = z.infer<typeof tourTicketSchema>;
