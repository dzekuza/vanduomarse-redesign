import { createMixedQuadRental, createQuadRental, createQuadTourRental } from "@/app/actions/quads";
import { createProgramBooking, createProgramTicket, createSaunaBooking, createStayBooking } from "@/app/actions/requests";
import type { ActionResult } from "@/app/admin/actions";
import type { ReservationRequest } from "@/lib/payments";
import type { ContactInput } from "@/lib/request-schema";

export type FiledRequest = ActionResult<{ reference: string; total: number }>;

/** Files one request of a reservation with the public action for its kind; the database prices and checks it. */
export function fileRequest(request: ReservationRequest, contact: ContactInput): Promise<FiledRequest> {
  switch (request.type) {
    case "programTicket":
      return createProgramTicket({ ...request.input, ...contact });
    case "programBooking":
      return createProgramBooking({ ...request.input, ...contact });
    case "saunaBooking":
      return createSaunaBooking({ ...request.input, ...contact });
    case "quadRental":
      return createQuadRental({ ...request.input, ...contact });
    case "mixedQuadRental":
      return createMixedQuadRental({ ...request.input, ...contact });
    case "quadTourRental":
      return createQuadTourRental({ ...request.input, ...contact });
    case "stayBooking":
      return createStayBooking({ ...request.input, ...contact });
  }
}
