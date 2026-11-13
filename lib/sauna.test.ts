import { describe, expect, it } from "vitest";
import {
  DEFAULT_SAUNA_RATES as RATES,
  fullDayStartHours,
  guestSurcharge,
  isOpenStart,
  isWeekendDay,
  maxHoursFrom,
  minHoursFor,
  sessionLengths,
  sessionPrice,
  startHours,
} from "@/lib/sauna";

const FRIDAY = "2026-11-13";
const MONDAY = "2026-11-16";

describe("sauna pricing", () => {
  it("uses the weekend table Friday to Sunday", () => {
    expect(isWeekendDay(FRIDAY)).toBe(true);
    expect(isWeekendDay("2026-11-15")).toBe(true);
    expect(isWeekendDay(MONDAY)).toBe(false);
    expect(isWeekendDay("2026-11-19")).toBe(false);
  });

  it("prices by the day's table", () => {
    expect(sessionPrice(2, 10, RATES, MONDAY)).toBe(160);
    expect(sessionPrice(4, 10, RATES, MONDAY)).toBe(240);
    expect(sessionPrice(3, 10, RATES, FRIDAY)).toBe(250);
    expect(sessionPrice(4, 10, RATES, FRIDAY)).toBe(320);
  });

  it("bills a length that is not offered as the next one up, capped at the longest", () => {
    expect(sessionPrice(2, 10, RATES, FRIDAY)).toBe(250);
    expect(sessionPrice(9, 10, RATES, MONDAY)).toBe(240);
    expect(sessionPrice(0, 10, RATES, MONDAY)).toBe(0);
  });

  it("adds a flat fee for every guest above the included number", () => {
    expect(guestSurcharge(10, RATES)).toBe(0);
    expect(guestSurcharge(13, RATES)).toBe(45);
    expect(sessionPrice(2, 13, RATES, MONDAY)).toBe(205);
  });

  it("lifts the shortest length for extras that need more time", () => {
    expect(sessionLengths(RATES, MONDAY)).toEqual([2, 3, 4]);
    expect(minHoursFor(RATES, MONDAY, 3)).toBe(3);
    expect(minHoursFor(RATES, FRIDAY)).toBe(3);
    expect(minHoursFor(RATES, MONDAY, 9)).toBe(0);
  });
});

describe("sauna hours", () => {
  it("offers starts that leave room for the shortest session", () => {
    expect(startHours(RATES)[0]).toBe(RATES.openHour);
    expect(startHours(RATES).at(-1)).toBe(RATES.closeHour - RATES.minHours);
  });

  it("stops a run at the next taken hour, closing or the max length", () => {
    expect(maxHoursFrom([], 10, RATES)).toBe(RATES.maxHours);
    expect(maxHoursFrom([13], 10, RATES)).toBe(3);
    expect(maxHoursFrom([], RATES.closeHour - 1, RATES)).toBe(1);
  });

  it("rejects past starts and starts without room", () => {
    expect(isOpenStart([], 12, RATES, 11)).toBe(true);
    expect(isOpenStart([], 12, RATES, 12)).toBe(false);
    expect(isOpenStart([13], 12, RATES, -1)).toBe(false);
  });

  it("offers a full day only when the whole run is free and future", () => {
    // A full day is a 12 h run, so it needs a sauna whose max length allows it.
    const rates = { ...RATES, maxHours: 12 };
    // Any start whose run to closing beats the longest hourly session (4 h) qualifies.
    expect(fullDayStartHours([], rates, MONDAY, -1)).toEqual([10, 11, 12, 13, 14, 15, 16, 17]);
    expect(fullDayStartHours([15], rates, MONDAY, -1)).toEqual([16, 17]);
    expect(fullDayStartHours([], rates, MONDAY, 12)).toEqual([13, 14, 15, 16, 17]);
  });
  it("offers no full day when the sauna caps sessions below it", () => {
    expect(fullDayStartHours([], RATES, MONDAY, -1)).toEqual([]);
  });
});
