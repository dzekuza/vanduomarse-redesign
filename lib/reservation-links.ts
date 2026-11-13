/** What /rezervacija can book. The sauna splits into shared sessions and private hire. */
export type ReservationType = "session" | "private" | "nakvyne" | "keturraciai" | "wake";

export const RESERVATION_TYPE_LABEL: Record<ReservationType, string> = {
  session: "Pirties seansai",
  private: "Privati pirtis",
  nakvyne: "Nakvynė",
  keturraciai: "Keturračiai",
  wake: "Wake",
};

/** Order of the header dropdown and the chips. */
export const RESERVATION_TYPES: readonly ReservationType[] = ["session", "private", "nakvyne", "keturraciai", "wake"];

const QUERY: Record<ReservationType, string> = {
  session: "veikla=pirtis&tipas=seansai",
  private: "veikla=pirtis&tipas=privati",
  nakvyne: "veikla=nakvyne",
  keturraciai: "veikla=keturraciai",
  wake: "veikla=wake",
};

/** Deep link that opens /rezervacija on that type; also what the page writes to the address bar when a chip is picked. */
export function reservationHref(type: ReservationType): string {
  return `/rezervacija?${QUERY[type]}`;
}

/** `?tipas=` of the sauna tab: which of its two ways to book opens first. */
export function parseSaunaMode(value: string | string[] | undefined): "session" | "private" | undefined {
  const tipas = Array.isArray(value) ? value[0] : value;
  return tipas === "privati" ? "private" : tipas === "seansai" ? "session" : undefined;
}
