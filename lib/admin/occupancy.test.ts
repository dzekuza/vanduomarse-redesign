import { describe, expect, it } from "vitest";
import { externalUnitsOn, freeStartHours, fullStayNights, saunaBookingAt, saunaHourTaken, stayUnitsOn } from "@/lib/admin/occupancy";
import type { Block, Booking, ExternalBlock } from "@/lib/admin/types";
import type { StayType } from "@/lib/cabin";
import { DEFAULT_SAUNA_RATES as RATES } from "@/lib/sauna";

const booking = (over: Partial<Booking>): Booking => ({
  id: "b",
  reference: "R",
  kind: "pirtis",
  customer: { name: "Test", phone: "", email: "" },
  date: "2026-11-16",
  guests: null,
  extras: [],
  total: 0,
  status: "patvirtinta",
  createdAt: "2026-11-01T00:00:00Z",
  ...over,
});

const cabin: StayType = { id: "namelis-2", kind: "namelis", label: "Namelis", note: "", maxGuests: 2, pricePerNight: 80, pricePerNight2: 80, pricePerNight3: 80, units: 2, active: true, sortOrder: 0 };

describe("sauna occupancy", () => {
  const sauna = booking({ startHour: 14, hours: 3, saunaId: "s1" });

  it("covers the booked hours only", () => {
    expect(saunaBookingAt([sauna], "2026-11-16", 14)).toBe(sauna);
    expect(saunaBookingAt([sauna], "2026-11-16", 16)).toBe(sauna);
    expect(saunaBookingAt([sauna], "2026-11-16", 17)).toBeUndefined();
    expect(saunaBookingAt([sauna], "2026-11-17", 14)).toBeUndefined();
  });

  it("ignores cancelled bookings", () => {
    expect(saunaBookingAt([{ ...sauna, status: "atsaukta" }], "2026-11-16", 14)).toBeUndefined();
  });

  it("treats staff blocks as taken", () => {
    const block: Block = { id: "x", saunaId: "s1", date: "2026-11-16", hour: 11, reason: "remontas" };
    expect(saunaHourTaken([], [block], "2026-11-16", 11)).toBe(true);
    expect(saunaHourTaken([], [block], "2026-11-16", 12)).toBe(false);
  });

  it("only lists starts where the shortest session fits", () => {
    const starts = freeStartHours([sauna], [], RATES, "2026-11-16");
    expect(starts).not.toContain(14);
    expect(starts).not.toContain(13); // 13 + 2 h overlaps 14
    expect(starts).toContain(11);
    expect(starts).toContain(17);
  });
});

describe("stay occupancy", () => {
  const stay = booking({ kind: "namelis", date: "2026-11-16", nights: 2, stayTypeId: "namelis-2", stayUnits: 1 });

  it("counts a unit for each night of the stay, not the check-out day", () => {
    expect(stayUnitsOn([stay], "2026-11-15", "namelis")).toBe(0);
    expect(stayUnitsOn([stay], "2026-11-16", "namelis")).toBe(1);
    expect(stayUnitsOn([stay], "2026-11-17", "namelis")).toBe(1);
    expect(stayUnitsOn([stay], "2026-11-18", "namelis")).toBe(0);
  });

  it("filters by stay type and ignores cancelled stays", () => {
    expect(stayUnitsOn([stay], "2026-11-16", "namelis", "namelis-4")).toBe(0);
    expect(stayUnitsOn([{ ...stay, status: "atsaukta" }], "2026-11-16", "namelis")).toBe(0);
  });

  it("flags nights where every unit is taken", () => {
    const two = [stay, { ...stay, id: "b2", nights: 1 }];
    expect(fullStayNights(two, "2026-11-16", 3, cabin)).toEqual(["2026-11-16"]);
  });

  it("never reports full for unlimited stock", () => {
    expect(fullStayNights([stay], "2026-11-16", 2, { ...cabin, units: null })).toEqual([]);
  });
});

describe("Sirvoy blocks", () => {
  const block = (over: Partial<ExternalBlock>): ExternalBlock => ({ id: "x1", calendarId: "room-1", stayTypeId: "namelis-2", label: "1", startsOn: "2026-11-16", nights: 2, ...over });

  it("counts a room for each night it is taken, not the check-out day", () => {
    const blocks = [block({})];
    expect(externalUnitsOn(blocks, "2026-11-15")).toBe(0);
    expect(externalUnitsOn(blocks, "2026-11-16")).toBe(1);
    expect(externalUnitsOn(blocks, "2026-11-17")).toBe(1);
    expect(externalUnitsOn(blocks, "2026-11-18")).toBe(0);
  });

  it("counts one room once however many of its events overlap, and different rooms separately", () => {
    const blocks = [block({}), block({ id: "x2", startsOn: "2026-11-17", nights: 1 }), block({ id: "x3", calendarId: "room-2", label: "2" })];
    expect(externalUnitsOn(blocks, "2026-11-17")).toBe(2);
    expect(externalUnitsOn(blocks, "2026-11-17", "namelis-4")).toBe(0);
  });

  it("adds to the booking count for cabins only", () => {
    const stay = booking({ kind: "namelis", date: "2026-11-16", nights: 2, stayTypeId: "namelis-2", stayUnits: 1 });
    expect(stayUnitsOn([stay], "2026-11-16", "namelis", "namelis-2", [block({})])).toBe(2);
    expect(stayUnitsOn([stay], "2026-11-16", "kemperis", undefined, [block({})])).toBe(0);
  });

  it("flags nights where bookings and Sirvoy rooms together fill the type", () => {
    const stay = booking({ kind: "namelis", date: "2026-11-16", nights: 1, stayTypeId: "namelis-2", stayUnits: 1 });
    const blocks = [block({ startsOn: "2026-11-16", nights: 2 })];
    expect(fullStayNights([stay], "2026-11-16", 3, { ...cabin, units: 2 }, blocks)).toEqual(["2026-11-16"]);
    expect(fullStayNights([stay], "2026-11-16", 3, { ...cabin, units: 1 }, blocks)).toEqual(["2026-11-16", "2026-11-17"]);
  });
});
