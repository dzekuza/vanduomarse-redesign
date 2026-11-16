import { describe, expect, it } from "vitest";
import type { SaunaPageData } from "@/lib/data/public-types";
import { sessionRows } from "@/lib/reservation";
import type { SaunaEventData } from "@/lib/sauna-events";

const session = (over: Partial<SaunaEventData> = {}): SaunaEventData => ({
  key: "e1",
  title: "Vakaro seansas",
  host: "Pirtis Marse",
  date: "2026-12-01",
  time: "19:00",
  minutes: 90,
  pricePerPerson: 20,
  capacity: 10,
  spotsLeft: 10,
  blurb: "Seansas",
  programId: null,
  ...over,
});

const page = (events: SaunaEventData[]): SaunaPageData => ({
  today: "2026-11-16",
  nowHour: 10,
  saunas: [],
  comingSoonSaunas: [],
  upsells: [],
  masters: [],
  programs: [],
  takenBySauna: {},
  events,
});

describe("sessionRows sale price", () => {
  it("shows the pre-sale price next to the charged rate", () => {
    const [row] = sessionRows(page([session({ regularPrice: 25 })]), "2026-12-01");
    expect(row.rate).toBe("20 € / asm.");
    expect(row.regularRate).toBe("25 €");
  });

  it("has no struck-through price without a sale", () => {
    const [row] = sessionRows(page([session()]), "2026-12-01");
    expect(row.regularRate).toBeUndefined();
  });
});
