import { createMixedQuadRental, createQuadRental } from "@/app/actions/quads";
import { createProgramBooking, createProgramTicket, createSaunaBooking, createStayBooking } from "@/app/actions/requests";
import type { ActionResult } from "@/app/admin/actions";
import { cabinStayType } from "@/lib/cabin";
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
  error?: { activity: ActivityId; message: string };
}

function send(id: ActivityId, plans: Plans, when: When, contact: ContactInput): Promise<ActionResult<Receipt>> | null {
  const { pirtis, keturraciai, nakvyne } = plans;
  if (id === "pirtis" && pirtis?.mode === "session" && pirtis.session) {
    return createProgramTicket({ eventId: pirtis.session.key, adults: pirtis.adults, children: pirtis.children, ...contact });
  }
  if (id === "pirtis" && pirtis?.mode === "private" && pirtis.startHour !== null) {
    return createProgramBooking({ programId: pirtis.program.id, date: when.day, startHour: pirtis.startHour, party: when.people, ...contact });
  }
  if (id === "pirtis" && pirtis?.mode === "hourly" && pirtis.startHour !== null) {
    return createSaunaBooking({ saunaId: pirtis.sauna.id, date: when.day, startHour: pirtis.startHour, hours: pirtis.hours, party: when.people, extras: pirtis.extras, ...contact });
  }
  if (id === "keturraciai" && keturraciai?.startHour != null) {
    const allocations = keturraciai.items.map(({ type, units }) => ({ quadTypeId: type.id, units }));
    // The combined booking takes vehicle quantities, with one driver per vehicle.
    const rental = { date: when.day, startHour: keturraciai.startHour, hours: keturraciai.hours, riders: keturraciai.units, note: "", ...contact };
    return allocations.length === 1
      ? createQuadRental({ ...rental, ...allocations[0] })
      : createMixedQuadRental({ ...rental, allocations });
  }
  if (id === "nakvyne" && nakvyne) {
    return createStayBooking({ stayTypeId: nakvyne.roomId === "namelis" ? cabinStayType(nakvyne.size) : nakvyne.roomId, date: when.day, nights: nakvyne.nights, units: nakvyne.units, ...contact });
  }
  return null;
}

/**
 * Files each picked activity as its own request, one after another, with the
 * same contact and verified phone. Already-sent ones are skipped, so a retry
 * after a failure never books anything twice.
 */
export async function submitReservation(plans: Plans, when: When, contact: ContactInput, already: Sent): Promise<Outcome> {
  const sent: Sent = { ...already };
  for (const id of ACTIVITY_ORDER) {
    if (sent[id]) continue;
    const pending = send(id, plans, when, contact);
    if (!pending) continue;
    const result = await pending;
    if ("error" in result) return { sent, error: { activity: id, message: result.error.message } };
    sent[id] = { reference: result.data.reference, total: result.data.total };
  }
  return { sent };
}
