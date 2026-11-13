import { bookingTypeLabel, bookingWhen, parseDay, quadRentalLabel } from "@/lib/admin/format";
import type { AdminData, BookingStatus, Customer, TourTicket } from "@/lib/admin/types";
import type { EventCategory } from "@/lib/park-events";
import { dateKey, formatHour } from "@/lib/sauna";

/**
 * The group an entry belongs to: colour, icon and filter chip. Sauna sessions count as `pirtis`,
 * campers as `namelis` and quad tours as `keturraciai`; whether it is an event (with its own
 * tickets) is told by `CalendarEntry.event`.
 */
export type CalendarKind = "pirtis" | "namelis" | "keturraciai" | "renginys";

export const CALENDAR_KINDS: { id: CalendarKind; label: string }[] = [
  { id: "pirtis", label: "Pirtis" },
  { id: "namelis", label: "Apgyvendinimas" },
  { id: "keturraciai", label: "Keturračiai" },
  { id: "renginys", label: "Renginiai" },
];

/** One dated thing from any booking table, in a shape the calendar can lay out. */
export interface CalendarEntry {
  /** Unique across kinds (`kind:id`). */
  key: string;
  /** Source row id (opens its sheet). */
  id: string;
  kind: CalendarKind;
  /** First day, yyyy-mm-dd. */
  date: string;
  /** Last day, inclusive; equals `date` except for multi-night stays. */
  endDate: string;
  /** HH:MM, for sorting and display; empty for all-day stays. */
  time: string;
  title: string;
  detail: string;
  customer: Customer;
  status: BookingStatus;
  reference: string;
  /** Set for events: seats taken and the limit (null = unlimited). Their bookings are the event's tickets. */
  event?: { sold: number; held: number; capacity: number | null; published: boolean };
}

type Source = Pick<AdminData, "bookings" | "stayTypes" | "quadRentals" | "quadTypes" | "events">;

const EVENT_KIND: Record<EventCategory, CalendarKind> = { pirtis: "pirtis", keturratis: "keturraciai", vakarai: "renginys", akademija: "renginys", sventes: "renginys" };

/** Seats taken out of the limit, e.g. "8/12" (tickets plus places staff set aside); "12 asm." when unlimited. */
export const seatsLabel = (event: NonNullable<CalendarEntry["event"]>) => (event.capacity ? `${event.sold + event.held}/${event.capacity}` : `${event.sold} asm.`);

/** An event's tickets: quad-tour and other event requests share one shape. */
export const ticketsFor = (eventId: string, ...lists: readonly TourTicket[][]) => lists.flat().filter((t) => t.eventId === eventId);

const hhmm = (hour: number) => formatHour(hour);

function lastNight(date: string, nights: number): string {
  const d = parseDay(date);
  d.setDate(d.getDate() + Math.max(1, nights) - 1);
  return dateKey(d);
}

/** Every non-cancelled booking and rental, plus every event (its tickets are read with `ticketsFor`), as one flat, date-sorted list. */
export function calendarEntries({ bookings, stayTypes, quadRentals, quadTypes, events }: Source): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  for (const b of bookings) {
    if (b.status === "atsaukta") continue;
    const stay = b.kind !== "pirtis";
    entries.push({
      key: `booking:${b.id}`,
      id: b.id,
      kind: b.kind === "kemperis" ? "namelis" : b.kind,
      date: b.date,
      endDate: stay ? lastNight(b.date, b.nights ?? 1) : b.date,
      time: b.startHour === undefined ? "" : `${hhmm(b.startHour)}`,
      title: bookingTypeLabel(b, stayTypes),
      detail: bookingWhen(b),
      customer: b.customer,
      status: b.status,
      reference: b.reference,
    });
  }

  for (const r of quadRentals) {
    if (r.status === "atsaukta" || r.tourEventId) continue; // a tour booking is listed inside its departure
    entries.push({
      key: `rental:${r.id}`,
      id: r.id,
      kind: "keturraciai",
      date: r.date,
      endDate: r.date,
      time: hhmm(r.startHour),
      title: quadRentalLabel(r, quadTypes),
      detail: `${hhmm(r.startHour)}–${hhmm(r.startHour + r.hours)}`,
      customer: r.customer,
      status: r.status,
      reference: r.reference,
    });
  }

  for (const e of events) {
    entries.push({
      key: `event:${e.id}`,
      id: e.id,
      kind: EVENT_KIND[e.category],
      date: e.date,
      endDate: e.date,
      time: e.time,
      title: e.title,
      detail: e.place,
      customer: { name: "", email: "", phone: "" },
      status: "patvirtinta",
      reference: "",
      event: { sold: e.sold, held: e.held, capacity: e.capacity, published: e.published },
    });
  }

  return entries.toSorted((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

/** Entries that touch `day` (a stay counts on every night it covers). */
export const entriesOn = (entries: readonly CalendarEntry[], day: string) => entries.filter((e) => e.date <= day && day <= e.endDate);

/** Monday-first 6x7 grid of day keys covering the month that contains `anchor`. */
export function monthGrid(anchor: Date): { day: string; inMonth: boolean }[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first.getFullYear(), first.getMonth(), 1 - offset + i);
    return { day: dateKey(d), inMonth: d.getMonth() === anchor.getMonth() };
  });
}

/** The Monday-first week (7 day keys) containing `day`. */
export function weekDays(day: string): string[] {
  const d = parseDay(day);
  const offset = (d.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset + i)));
}
