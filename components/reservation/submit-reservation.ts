import { quadTourGear, type QuadTourPick } from "@/components/quads/quad-tour-plan";
import { fileRequest } from "@/lib/file-request";
import { cabinStayType } from "@/lib/cabin";
import { discountCovers, type CheckedDiscount } from "@/lib/discount-codes";
import type { ReservationRequest } from "@/lib/payments";
import type { ContactInput } from "@/lib/request-schema";
import { ACTIVITY_ORDER, type ActivityId, type Plans, type When } from "@/lib/reservation";

export interface Receipt {
  reference: string;
  total: number;
}

export type Sent = Partial<Record<ActivityId, Receipt>>;

export interface Outcome {
  sent: Sent;
  /** The first request the server refused; later ones were not tried. */
  error?: { activity: ActivityId; message: string; code?: string };
}

/** The request an activity of the plan turns into (without the contact details), or null when it has no bookable time yet. */
function requestFor(id: ActivityId, plans: Plans, when: When, tour: QuadTourPick | null): ReservationRequest | null {
  const { pirtis, keturraciai, nakvyne } = plans;
  // A Mini / Midi / Maxi tour replaces an hourly rental; the database prices it from the route and gear rows.
  if (id === "keturraciai" && tour) {
    return { type: "quadTourRental", input: { routeId: tour.routeId, date: when.day, startHour: tour.startHour, units: tour.units, accessories: quadTourGear(tour.accessories), note: "" } };
  }
  if (id === "pirtis" && pirtis?.mode === "session" && pirtis.session) {
    return { type: "programTicket", input: { eventId: pirtis.session.key, adults: pirtis.adults, children: pirtis.children } };
  }
  if (id === "pirtis" && pirtis?.mode === "private" && pirtis.startHour !== null) {
    return { type: "programBooking", input: { programId: pirtis.program.id, date: when.day, startHour: pirtis.startHour, party: when.people } };
  }
  if (id === "pirtis" && pirtis?.mode === "hourly" && pirtis.startHour !== null) {
    return {
      type: "saunaBooking",
      input: { saunaId: pirtis.sauna.id, date: when.day, startHour: pirtis.startHour, hours: pirtis.hours, party: when.people, extras: pirtis.extras },
    };
  }
  if (id === "keturraciai" && keturraciai?.startHour != null) {
    const allocations = keturraciai.items.map(({ type, units }) => ({ quadTypeId: type.id, units }));
    // The combined booking takes vehicle quantities, with one driver per vehicle.
    const rental = { date: when.day, startHour: keturraciai.startHour, hours: keturraciai.hours, riders: keturraciai.units, note: "" };
    return allocations.length === 1
      ? { type: "quadRental", input: { ...rental, ...allocations[0] } }
      : { type: "mixedQuadRental", input: { ...rental, allocations } };
  }
  if (id === "nakvyne" && nakvyne) {
    return {
      type: "stayBooking",
      input: { stayTypeId: nakvyne.roomId === "namelis" ? cabinStayType(nakvyne.size) : nakvyne.roomId, date: when.day, nights: nakvyne.nights, units: nakvyne.units },
    };
  }
  return null;
}

/** Every request of the plan, in activity order. */
export function requestsFor(plans: Plans, when: When, tour: QuadTourPick | null = null): ReservationRequest[] {
  return ACTIVITY_ORDER.flatMap((id) => {
    const request = requestFor(id, plans, when, tour);
    return request ? [request] : [];
  });
}

/**
 * Files each picked activity as its own request, one after another, with the
 * same contact and verified phone. Already-sent ones are skipped, so a retry
 * after a failure never books anything twice. Used when online payment is off.
 * The discount code goes only with the activities it covers (the database refuses it for the rest).
 */
export async function submitReservation(plans: Plans, when: When, contact: ContactInput, already: Sent, discount: CheckedDiscount | null = null, tour: QuadTourPick | null = null): Promise<Outcome> {
  const sent: Sent = { ...already };
  for (const id of ACTIVITY_ORDER) {
    if (sent[id]) continue;
    const request = requestFor(id, plans, when, tour);
    if (!request) continue;
    const result = await fileRequest(request, { ...contact, discountCode: discountCovers(discount, id) ? discount?.code : undefined });
    if ("error" in result) return { sent, error: { activity: id, message: result.error.message, code: result.error.code } };
    sent[id] = { reference: result.data.reference, total: result.data.total };
  }
  return { sent };
}
