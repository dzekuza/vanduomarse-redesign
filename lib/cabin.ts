import { dateKey } from "@/lib/sauna";

/**
 * Cabin sizes from the 2026–27 sheet: 8 doubles + 6 quads (40 beds),
 * 50–60 €/night — read as 50 € for a double and 60 € for a quad.
 * Mirrored by `public.stay_types` (`namelis-2`, `namelis-4`, `kemperis`), where
 * the database enforces the unit counts; there is no admin editor for them yet.
 */
export const CABIN_SIZES = [
  { id: 2, label: "2 asmenims", pricePerNight: 50, count: 8 },
  { id: 4, label: "4 asmenims", pricePerNight: 60, count: 6 },
] as const;

export type CabinSize = (typeof CABIN_SIZES)[number]["id"];

export const CABIN_TOTAL = CABIN_SIZES.reduce((sum, s) => sum + s.count, 0);

export const ROOM_TYPES = [
  { id: "namelis", label: "Namelis", note: "2 arba 4 asmenims", pricePerNight: CABIN_SIZES[0].pricePerNight },
  { id: "kemperis", label: "Kemperio aikštelė", note: "su elektra", pricePerNight: 25 },
] as const;

export type RoomTypeId = (typeof ROOM_TYPES)[number]["id"];

/** Most guests a stay can take: the cabin size, or a camper pitch's limit. */
export const CAMPER_MAX_GUESTS = 6;

export function cabinSize(size: CabinSize) {
  return CABIN_SIZES.find((s) => s.id === size)!;
}

export function roomPrice(id: RoomTypeId, size: CabinSize): number {
  return id === "namelis" ? cabinSize(size).pricePerNight : ROOM_TYPES.find((r) => r.id === id)!.pricePerNight;
}

export function roomLabel(id: RoomTypeId, size: CabinSize): string {
  return id === "namelis" ? `Namelis ${cabinSize(size).label}` : ROOM_TYPES.find((r) => r.id === id)!.label;
}

/** Stay type id in `public.stay_types` for a cabin size. */
export const cabinStayType = (size: CabinSize) => `namelis-${size}`;

/** Free cabins per night and size, from `stay_occupancy()`: `{ "2026-10-22": { 2: 5, 4: 0 } }`. */
export type CabinAvailability = Record<string, Partial<Record<CabinSize, number>>>;

/** Cabins of `size` free for every night of a stay arriving on `checkIn` (nights outside the data count as free). */
export function freeCabins(availability: CabinAvailability, checkIn: Date, nights: number, size: CabinSize): number {
  let free: number = cabinSize(size).count;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + i);
    free = Math.min(free, availability[dateKey(d)]?.[size] ?? cabinSize(size).count);
  }
  return free;
}
