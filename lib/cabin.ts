import { dateKey } from "@/lib/sauna";

/**
 * Cabin sizes from the 2026–27 sheet: 8 doubles + 6 quads (40 beds),
 * 50–60 €/night — read as 50 € for a double and 60 € for a quad.
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

/** Deterministic pseudo-occupancy so server and client render the same thing. */
function bookedCabins(dateK: string, size: CabinSize): number {
  const s = `${dateK}namelis${size}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % (cabinSize(size).count + 1);
}

/** Cabins of `size` free for every night of a stay arriving on `checkIn`. */
export function freeCabins(checkIn: Date, nights: number, size: CabinSize): number {
  let free: number = cabinSize(size).count;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + i);
    free = Math.min(free, cabinSize(size).count - bookedCabins(dateKey(d), size));
  }
  return free;
}

export function cabinReference(dateK: string, roomId: string, nights: number): string {
  const s = `${dateK}${roomId}${nights}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  const code = (h % 9000) + 1000;
  return `MM-${code}`;
}
