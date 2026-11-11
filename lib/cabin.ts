import { dateKey } from "@/lib/sauna";

/**
 * Cabin sizes from the 2026–27 sheet: 8 doubles + 6 quads (40 beds),
 * 50–60 €/night — read as 50 € for a double and 60 € for a quad.
 * Mirrored by `public.stay_types` (`namelis-2`, `namelis-4`, `kemperis`), where
 * the database enforces the unit counts; there is no admin editor for them yet.
 */
export const CABIN_SIZES = [
  { id: 2, name: "Dvivietis namelis", label: "2 asmenims", pricePerNight: 50, count: 8 },
  { id: 4, name: "Keturvietis namelis", label: "4 asmenims", pricePerNight: 60, count: 6 },
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

/** Public request limit for stay units, separate from the park's stock. */
export const MAX_STAY_UNITS = 20;
export const MAX_STAY_NIGHTS = 14;

export function cabinSize(size: CabinSize) {
  return CABIN_SIZES.find((s) => s.id === size)!;
}

export function roomPrice(id: RoomTypeId, size: CabinSize): number {
  return id === "namelis" ? cabinSize(size).pricePerNight : ROOM_TYPES.find((r) => r.id === id)!.pricePerNight;
}

export function roomLabel(id: RoomTypeId, size: CabinSize): string {
  return id === "namelis" ? cabinSize(size).name : ROOM_TYPES.find((r) => r.id === id)!.label;
}

/** Stay type id in `public.stay_types` for a cabin size. */
export const cabinStayType = (size: CabinSize) => `namelis-${size}`;

export type StayUnitType = CabinSize | "kemperis";
export const STAY_TYPES: readonly StayUnitType[] = [...CABIN_SIZES.map(({ id }) => id), "kemperis"];

/** Free units per night and type from `stay_occupancy()`, with no entry for unlimited camper stock. */
export type CabinAvailability = Record<string, Partial<Record<StayUnitType, number>>>;

/** Lowest availability across all nights, with unlisted nights using the default inventory. */
export function freeStayUnits(availability: CabinAvailability, checkIn: Date, nights: number, type: StayUnitType): number {
  const inventory = type === "kemperis" ? Infinity : cabinSize(type).count;
  let free = inventory;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + i);
    free = Math.min(free, availability[dateKey(d)]?.[type] ?? inventory);
  }
  return free;
}

export function freeCabins(availability: CabinAvailability, checkIn: Date, nights: number, size: CabinSize): number {
  return freeStayUnits(availability, checkIn, nights, size);
}

/** Cabins of either size that are free for every night of the stay. */
export function freeCabinsTotal(availability: CabinAvailability, checkIn: Date, nights: number): number {
  return CABIN_SIZES.reduce((total, { id }) => total + freeCabins(availability, checkIn, nights, id), 0);
}
