import { dateKey } from "@/lib/sauna";

/**
 * Stay types (cabin sizes and camper pitches) live in `public.stay_types` and are
 * managed by the owner at `/admin/namukai`. Prices, guest limits and stock all come
 * from there; nothing about a particular cabin size is hard-coded in the app.
 */
export type StayKind = "namelis" | "kemperis";

export interface StayType {
  /** Slug, e.g. `namelis-2` or `kemperis` (see `newStayTypeId`). */
  id: string;
  kind: StayKind;
  label: string;
  note: string;
  maxGuests: number;
  /** Price per night for a 1-night stay. */
  pricePerNight: number;
  /** Price per night when the stay is exactly 2 nights. */
  pricePerNight2: number;
  /** Price per night when the stay is 3 or more nights. */
  pricePerNight3: number;
  /** How many exist; null = not limited (camper pitches). */
  units: number | null;
  active: boolean;
  sortOrder: number;
}

/** Public request limit for stay units, separate from the park's stock. */
export const MAX_STAY_UNITS = 20;
export const MAX_STAY_NIGHTS = 14;

export const STAY_KIND_LABEL: Record<StayKind, string> = { namelis: "Namelis", kemperis: "Kemperio aikštelė" };

/** The types of one kind, in display order. */
export const stayTypesOf = (types: readonly StayType[], kind: StayKind): StayType[] => types.filter((t) => t.kind === kind);

export const findStayType = (types: readonly StayType[], id: string): StayType | undefined => types.find((t) => t.id === id);

/** Per-night price for a stay of `nights`: the tier of the whole stay's length applies to every night. */
export function stayNightRate(type: Pick<StayType, "pricePerNight" | "pricePerNight2" | "pricePerNight3">, nights: number): number {
  if (nights >= 3) return type.pricePerNight3;
  if (nights === 2) return type.pricePerNight2;
  return type.pricePerNight;
}

/** Price of a stay, for one unit unless `units` is given. Mirrors `private.stay_night_price()` in the database. */
export const stayPrice = (type: Pick<StayType, "pricePerNight" | "pricePerNight2" | "pricePerNight3">, nights: number, units = 1): number =>
  stayNightRate(type, nights) * nights * units;

/** The cheapest nightly price of a kind (across all night tiers), or null when there is none. */
export function lowestStayPrice(types: readonly StayType[], kind?: StayKind): number | null {
  const prices = types.filter((t) => !kind || t.kind === kind).map((t) => Math.min(t.pricePerNight, t.pricePerNight2, t.pricePerNight3));
  return prices.length ? Math.min(...prices) : null;
}

/** "100 € / naktį", or "nuo 60 € / naktį" when longer stays are cheaper per night. */
export function stayRateLabel(type: Pick<StayType, "pricePerNight" | "pricePerNight2" | "pricePerNight3">): string {
  const low = Math.min(type.pricePerNight, type.pricePerNight2, type.pricePerNight3);
  return `${low < type.pricePerNight ? "nuo " : ""}${low} € / naktį`;
}

/** "100 / 80 / 60 €" for a type, or just "100 €" when every tier is the same. */
export function stayTiersLabel(type: Pick<StayType, "pricePerNight" | "pricePerNight2" | "pricePerNight3">): string {
  const { pricePerNight: a, pricePerNight2: b, pricePerNight3: c } = type;
  return a === b && b === c ? `${a} €` : `${a} / ${b} / ${c} €`;
}

/** Free units per night and stay type id from `stay_occupancy()`, with no entry for unlimited stock. */
export type CabinAvailability = Record<string, Record<string, number>>;

/** Lowest availability across all nights, with unlisted nights using the type's whole stock. */
export function freeStayUnits(availability: CabinAvailability, checkIn: Date, nights: number, type: StayType): number {
  const inventory = type.units ?? Infinity;
  let free = inventory;
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + i);
    free = Math.min(free, availability[dateKey(d)]?.[type.id] ?? inventory);
  }
  return free;
}

/** Units of any type of a kind that are free for every night of the stay. */
export function freeStayUnitsOfKind(types: readonly StayType[], availability: CabinAvailability, checkIn: Date, nights: number, kind: StayKind): number {
  return stayTypesOf(types, kind).reduce((sum, t) => sum + freeStayUnits(availability, checkIn, nights, t), 0);
}

/** Id for a new type: the kind plus a short random suffix, within the `^[a-z0-9-]+$` the table requires. */
export const newStayTypeId = (kind: StayKind) => `${kind}-${crypto.randomUUID().slice(0, 8)}`;

/** "iki 4 asmenų" */
export const guestsLabel = (maxGuests: number) => `iki ${maxGuests} ${maxGuests === 1 ? "asmens" : "asmenų"}`;

/** The active type a phone booking gets: the smallest of the kind that fits the party, else the largest. */
export function pickStayType(types: readonly StayType[], kind: StayKind, guests: number): StayType | undefined {
  const ofKind = types.filter((t) => t.kind === kind && t.active).toSorted((a, b) => a.maxGuests - b.maxGuests);
  return ofKind.find((t) => t.maxGuests >= guests) ?? ofKind.at(-1);
}

/** Total cabins (or pitches) of a kind; camper pitches without a limit count as 0. */
export const stayStock = (types: readonly StayType[], kind: StayKind): number =>
  types.filter((t) => t.kind === kind && t.active).reduce((sum, t) => sum + (t.units ?? 0), 0);
