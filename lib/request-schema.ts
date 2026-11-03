import { z } from "zod";
import { contactError, contactFields, needsContact, tourContactSchema } from "@/lib/quad-schema";

/** What the visitor types in the contact step of the sauna, cabin, event and inquiry forms. */
export const contactSchema = tourContactSchema;
export type ContactInput = z.infer<typeof contactSchema>;

const refined = <T extends z.ZodType<{ customerPhone: string; customerEmail: string }>>(schema: T) => schema.refine(needsContact, contactError);

const couponCode = z.string().trim().max(20).optional();

/** Private sauna hire, validated again by `createSaunaBooking`; the database prices it. */
export const saunaBookingSchema = refined(
  contactFields.extend({
    saunaId: z.string().regex(/^[a-z0-9-]+$/).max(60),
    date: z.iso.date(),
    startHour: z.number().int().min(0).max(23),
    hours: z.number().int().min(1).max(12),
    party: z.number().int().min(1).max(100),
    /** Upsell id -> quantity (counted extras) or 1 (on/off extras). */
    extras: z.record(z.string().regex(/^[a-z0-9-]+$/).max(60), z.number().int().min(1).max(100)),
    coupon: couponCode,
  }),
);
export type SaunaBookingInput = z.infer<typeof saunaBookingSchema>;

/** Cabin or camper stay, validated again by `createStayBooking`. */
export const stayBookingSchema = refined(
  contactFields.extend({
    stayTypeId: z.string().regex(/^[a-z0-9-]+$/).max(60),
    date: z.iso.date(),
    nights: z.number().int().min(1).max(14),
    guests: z.number().int().min(1).max(20),
    coupon: couponCode,
  }),
);
export type StayBookingInput = z.infer<typeof stayBookingSchema>;

/** Seats at a sauna program session: adults and children, priced from the program by `createProgramTicket`. */
export const programTicketSchema = refined(
  contactFields.extend({ eventId: z.uuid(), adults: z.number().int().min(0).max(20), children: z.number().int().min(0).max(20) }),
);
export type ProgramTicketInput = z.infer<typeof programTicketSchema>;

/** A private sauna program at its flat price, validated again by `createProgramBooking`. */
export const programBookingSchema = refined(
  contactFields.extend({
    programId: z.string().regex(/^[a-z0-9-]+$/).max(60),
    date: z.iso.date(),
    startHour: z.number().int().min(0).max(23),
    party: z.number().int().min(1).max(100),
  }),
);
export type ProgramBookingInput = z.infer<typeof programBookingSchema>;

/** Seats at a public event with a limited capacity (sauna sessions and similar). */
export const eventTicketSchema = refined(contactFields.extend({ eventId: z.uuid(), people: z.number().int().min(1).max(20) }));
export type EventTicketInput = z.infer<typeof eventTicketSchema>;

/** Registration for an event without a seat limit; lands in the inquiries list. */
export const eventRegistrationSchema = refined(
  contactFields.extend({ eventId: z.uuid(), people: z.number().int().min(1).max(200), message: z.string().trim().max(500) }),
);
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;

/** Quote request from the event calculator. */
export const inquirySchema = refined(
  contactFields.extend({
    eventType: z.string().trim().min(1).max(120),
    /** yyyy-mm-dd or empty when the visitor has no date yet. */
    date: z.union([z.literal(""), z.iso.date()]),
    guests: z.number().int().min(1).max(1000),
    space: z.string().trim().max(120),
    estimateMin: z.number().min(0).max(10_000_000),
    estimateMax: z.number().min(0).max(10_000_000),
    /** The calculator input, so staff can reopen the exact quote. */
    calculatorInput: z.record(z.string(), z.unknown()),
    message: z.string().trim().max(1000),
  }),
);
export type InquiryInput = z.infer<typeof inquirySchema>;

/** The inline form values for registering to an event / sending an inquiry (no hidden choices). */
export const messageContactSchema = refined(contactFields.extend({ message: z.string().trim().max(500) }));
export type MessageContactValues = z.infer<typeof messageContactSchema>;
