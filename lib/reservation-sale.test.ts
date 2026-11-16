import { describe, expect, it } from "vitest";
import type { SaunaPageData } from "@/lib/data/public-types";
import { describePlans, planSauna, saleSaving, sessionRows, type SaunaPick } from "@/lib/reservation";
import type { SaunaEventData } from "@/lib/sauna-events";
import type { SaunaProgram } from "@/lib/sauna-programs";

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

const ritual: SaunaProgram = {
  id: "ritualas",
  name: "Pirties ritualas",
  label: "Su pirtininku",
  description: "",
  kind: "session",
  pricing: "person",
  price: 30,
  childPrice: null,
  durationMinutes: 120,
  capacity: null,
  saunaId: null,
  active: true,
  sortOrder: 1,
};

const page = (events: SaunaEventData[], programs: SaunaProgram[] = []): SaunaPageData => ({
  today: "2026-11-16",
  nowHour: 10,
  saunas: [],
  comingSoonSaunas: [],
  upsells: [],
  masters: [],
  programs,
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

  it("ignores a stray pre-sale price on a program session (the program sets the price)", () => {
    const [row] = sessionRows(page([session({ programId: "ritualas", regularPrice: 25 })], [ritual]), "2026-12-01");
    expect(row.regularRate).toBeUndefined();
  });

  it("gives the plan line the regular price for the party, so the summary can strike it through", () => {
    const pick: SaunaPick = { programId: null, eventId: "e1", children: 0, saunaId: "", startHour: null, hours: 2, extras: {}, masterId: null };
    const when = { day: "2026-12-01", people: 2 };
    const plan = planSauna(pick, page([session({ pricePerPerson: 12, regularPrice: 20 })]), when);
    const [line] = describePlans({ pirtis: plan }, when);
    expect(line.price).toBe(24);
    expect(line.regularPrice).toBe(40);
    expect(saleSaving([line])).toBe(16);
  });

  it("has no regular price or saving without a sale", () => {
    const pick: SaunaPick = { programId: null, eventId: "e1", children: 0, saunaId: "", startHour: null, hours: 2, extras: {}, masterId: null };
    const when = { day: "2026-12-01", people: 1 };
    const [line] = describePlans({ pirtis: planSauna(pick, page([session({ pricePerPerson: 20 })]), when) }, when);
    expect(line.regularPrice).toBeUndefined();
    expect(saleSaving([line])).toBe(0);
  });
});
