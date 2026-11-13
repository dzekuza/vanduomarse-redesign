import { freeStartHours, saunaSlice, stayUnitsOn } from "@/lib/admin/occupancy";
import type { AdminData, ManagedEvent } from "@/lib/admin/types";
import type { Sauna } from "@/lib/sauna";
import type { StayType } from "@/lib/cabin";

export type BookingOptionsSource = Pick<AdminData, "events" | "bookings" | "blocks" | "saunas" | "stayTypes">;

export interface DayOptions {
  /** Events and public sessions that day staff can add tickets to, by start time; `left` null = no limit, 0 = full. */
  events: { event: ManagedEvent; left: number | null }[];
  /** Active cabin and camper types with the units still free for the night; `free` null = no limit. */
  stays: { type: StayType; free: number | null }[];
  /** Active private saunas with how many start times are still free. */
  saunas: { sauna: Sauna; freeStarts: number }[];
}

/**
 * What can be booked on `date`, for the first step of the staff booking form: the day's bookable events and sessions
 * (not private calendar entries, not quad tour departures, which are sold as rentals), cabins and camper pitches with
 * free units, and the private saunas with free start times.
 */
export function bookingOptionsOn(date: string, data: BookingOptionsSource): DayOptions {
  const events = data.events
    .filter((e) => e.date === date && !e.calendarPrivate && !e.tourRouteId)
    .toSorted((a, b) => a.time.localeCompare(b.time))
    .map((event) => ({ event, left: event.capacity === null ? null : Math.max(0, event.capacity - event.sold - event.held) }));

  const stays = data.stayTypes
    .filter((t) => t.active)
    .toSorted((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "lt"))
    .map((type) => ({ type, free: type.units === null ? null : Math.max(0, type.units - stayUnitsOn(data.bookings, date, type.kind, type.id)) }));

  const saunas = data.saunas
    .filter((s) => s.active)
    .map((sauna) => {
      const slice = saunaSlice(data.bookings, data.blocks, sauna.id);
      return { sauna, freeStarts: freeStartHours(slice.bookings, slice.blocks, sauna.rates, date).length };
    });

  return { events, stays, saunas };
}
