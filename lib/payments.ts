import { z } from "zod";
import type { QuadRentalInput, MixedQuadRentalInput } from "@/lib/quad-schema";
import type { ContactInput, ProgramBookingInput, ProgramTicketInput, SaunaBookingInput, StayBookingInput } from "@/lib/request-schema";
import { customerNameSchema } from "@/lib/customer-schema";

/** What a request needs besides the contact details every request of one reservation shares. */
type WithoutContact<T> = Omit<T, keyof ContactInput>;

/** One request of a paid reservation: the existing public actions file them, one per activity. */
export type ReservationRequest =
  | { type: "programTicket"; input: WithoutContact<ProgramTicketInput> }
  | { type: "programBooking"; input: WithoutContact<ProgramBookingInput> }
  | { type: "saunaBooking"; input: WithoutContact<SaunaBookingInput> }
  | { type: "quadRental"; input: WithoutContact<QuadRentalInput> }
  | { type: "mixedQuadRental"; input: WithoutContact<MixedQuadRentalInput> }
  | { type: "stayBooking"; input: WithoutContact<StayBookingInput> };

export type ReservationRequestType = ReservationRequest["type"];

/** A reservation holds at most one request per activity. */
export const REQUEST_ACTIVITY: Record<ReservationRequestType, "pirtis" | "keturraciai" | "nakvyne"> = {
  programTicket: "pirtis",
  programBooking: "pirtis",
  saunaBooking: "pirtis",
  quadRental: "keturraciai",
  mixedQuadRental: "keturraciai",
  stayBooking: "nakvyne",
};

export function isReservationRequest(value: unknown): value is ReservationRequest {
  if (typeof value !== "object" || value === null) return false;
  const { type, input } = value as { type?: unknown; input?: unknown };
  return typeof type === "string" && type in REQUEST_ACTIVITY && typeof input === "object" && input !== null;
}

/**
 * The server action input. The shape of each request is validated again by the action that
 * files it (the same schemas as the stand-alone booking pages), so only its kind is checked here.
 */
export const checkoutInputSchema = z
  .object({
    contact: z.object({ customerName: customerNameSchema }),
    requests: z.array(z.custom<ReservationRequest>(isReservationRequest)).min(1).max(3),
  })
  .refine(({ requests }) => new Set(requests.map((r) => REQUEST_ACTIVITY[r.type])).size === requests.length, {
    message: "Viena užklausa kiekvienai veiklai.",
    path: ["requests"],
  });

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

/** One line of a payment: a request and what it costs. */
export const payItemsSchema = z.array(z.object({ reference: z.string(), label: z.string(), amount: z.number() }));
export type PayItem = z.infer<typeof payItemsSchema>[number];
