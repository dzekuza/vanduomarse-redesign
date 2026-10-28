import { z } from "zod";

export const contactFields = z.object({
  customerName: z.string().trim().min(2, "Įveskite vardą").max(80, "Per ilgas vardas"),
  customerPhone: z.string().trim().max(30, "Per ilgas numeris"),
  customerEmail: z.union([z.literal(""), z.email("Neteisingas el. paštas").max(120)]),
  /** Honeypot: real visitors never see or fill it. */
  website: z.string().max(0).optional(),
});

export const needsContact = (v: { customerPhone: string; customerEmail: string }) => v.customerPhone !== "" || v.customerEmail !== "";
export const contactError = { message: "Nurodykite telefoną arba el. paštą", path: ["customerPhone"] };

/** What the visitor types in the last step (the choices above it live in component state). */
export const quadContactSchema = contactFields.extend({ note: z.string().trim().max(300, "Daugiausia 300 simbolių") }).refine(needsContact, contactError);
export type QuadContactValues = z.infer<typeof quadContactSchema>;

/** Tour seats: contact + how many. */
export const tourContactSchema = contactFields.refine(needsContact, contactError);
export type TourContactValues = z.infer<typeof tourContactSchema>;

/** Hourly rental request, validated again by the `createQuadRental` action. */
export const quadRentalSchema = contactFields
  .extend({
    quadTypeId: z.string().regex(/^[a-z0-9-]+$/).max(60),
    date: z.iso.date(),
    startHour: z.number().int().min(0).max(23),
    hours: z.number().int().min(1).max(8),
    units: z.number().int().min(1).max(20),
    riders: z.number().int().min(1).max(40),
    note: z.string().trim().max(300),
  })
  .refine(needsContact, contactError);
export type QuadRentalInput = z.infer<typeof quadRentalSchema>;

/** Guided tour ticket request, validated again by the `createTourTicket` action. */
export const tourTicketSchema = contactFields.extend({ eventId: z.uuid(), people: z.number().int().min(1).max(20) }).refine(needsContact, contactError);
export type TourTicketInput = z.infer<typeof tourTicketSchema>;
