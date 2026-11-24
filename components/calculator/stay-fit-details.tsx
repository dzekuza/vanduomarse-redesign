import type { ReservationDayDetails } from "@/components/reservation/day-cell";
import { freeStayUnits, stayTypesOf, type CabinAvailability, type StayType } from "@/lib/cabin";
import { cn } from "@/lib/utils";

/** Cabin occupancy the calculator calendar can show: the loaded nights and the last night they cover. */
export interface StayAvailability {
  availability: CabinAvailability;
  /** yyyy-mm-dd of the last night with loaded data; later nights are unknown, so they show nothing. */
  through: string;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Free cabins out of the stock on every night of the stay (green when they can house the whole group, amber when some are free
 * but not enough, red when none), for the calendar's day cells.
 * Undefined when the nights are not loaded or the cabins are not limited, so the cell stays plain.
 */
export function stayFitDetails(types: readonly StayType[], stay: StayAvailability, date: Date, nights: number, guests: number): ReservationDayDetails | undefined {
  const cabins = stayTypesOf(types, "namelis").filter((type) => type.active && type.units !== null);
  if (cabins.length === 0) return undefined;
  const lastNight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + nights - 1);
  if (dayKey(lastNight) > stay.through) return undefined;

  const free = cabins.map((type) => ({ type, free: freeStayUnits(stay.availability, date, nights, type) }));
  const housed = free.reduce((sum, { type, free: units }) => sum + units * type.maxGuests, 0);
  const freeCabins = free.reduce((sum, { free: units }) => sum + units, 0);
  const stock = cabins.reduce((sum, type) => sum + (type.units ?? 0), 0);
  const fits = housed >= guests;
  let remaining = guests;
  let cabinsNeeded = 0;
  for (const { type, free: units } of free.toSorted((a, b) => b.type.maxGuests - a.type.maxGuests)) {
    const take = Math.min(units, Math.ceil(Math.max(0, remaining) / type.maxGuests));
    remaining -= take * type.maxGuests;
    cabinsNeeded += take;
  }
  return {
    label: `Laisvų namelių: ${freeCabins} iš ${stock}. ${fits ? `${guests} asm. grupei pakanka (${cabinsNeeded} nam.)` : `${guests} asm. grupei nepakanka, tilptų ${housed} asm.`}`,
    available: fits,
    indicator: (
      <span className="@container block">
        <span className={cn("block text-calendar-status font-bold tabular-nums", fits ? "text-availability-open!" : freeCabins > 0 ? "text-availability-low-ink!" : "text-rust-ink!")}>{freeCabins}/{stock}</span>
      </span>
    ),
  };
}
