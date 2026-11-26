import { describe, expect, it } from "vitest";
import { anySpaceClash, spaceLabels, spaceRent, spacesClash, suggestedSpacePrice, windowsOverlap, type ManagedSpace } from "./space-booking";

const space = (id: string, label: string, priceWeekday: number | null, priceWeekend: number | null, wholePark = false): ManagedSpace => ({
  id, label, blurb: "", maxGuests: 100, priceWeekday, priceWeekend, wholePark, active: true, sortOrder: 0,
});
const SPACES = [
  space("terasa", "Įstiklinta terasa", 0, 0),
  space("kupolas-svente", "Kupolas: šventė", 700, 700),
  space("kupolas-seminaras", "Kupolas: seminaras", 363, null),
  space("corona", "„Corona“ su baseinu", 1200, 1200),
  space("restoranas", "Restoranas + terasa", 500, 500),
  space("parkas", "Visas parkas (be WAKE)", 6000, 7000, true),
  space("parkas-wake", "Visas parkas su WAKE", 9000, 10000, true),
];

describe("space bookings", () => {
  it("clashes on the same space and on the whole park", () => {
    expect(spacesClash("terasa", "terasa", SPACES)).toBe(true);
    expect(spacesClash("terasa", "corona", SPACES)).toBe(false);
    expect(spacesClash("parkas", "terasa", SPACES)).toBe(true);
    expect(anySpaceClash(["terasa", "corona"], ["restoranas"], SPACES)).toBe(false);
    expect(anySpaceClash(["terasa", "corona"], ["parkas-wake"], SPACES)).toBe(true);
  });

  it("treats touching times as free", () => {
    const day = (startTime: string, endTime: string) => ({ date: "2026-11-21", endDate: "2026-11-21", startTime, endTime });
    expect(windowsOverlap(day("12:00", "16:00"), day("16:00", "20:00"))).toBe(false);
    expect(windowsOverlap(day("12:00", "16:00"), day("15:00", "20:00"))).toBe(true);
  });

  it("compares multi-day windows by date and time", () => {
    const camp = { date: "2026-11-21", endDate: "2026-11-23", startTime: "18:00", endTime: "11:00" };
    expect(windowsOverlap(camp, { date: "2026-11-22", endDate: "2026-11-22", startTime: "09:00", endTime: "10:00" })).toBe(true);
    expect(windowsOverlap(camp, { date: "2026-11-23", endDate: "2026-11-23", startTime: "11:00", endTime: "14:00" })).toBe(false);
  });

  it("adds the listed rent of each space", () => {
    // 2026-11-21 is a Saturday: dome party 700 + Corona 1200.
    expect(suggestedSpacePrice(["kupolas-svente", "corona"], "2026-11-21", SPACES)).toBe(1900);
    expect(suggestedSpacePrice(["terasa"], "2026-11-21", SPACES)).toBe(0);
    expect(suggestedSpacePrice(["terasa"], "", SPACES)).toBe(0);
    // The seminar is not offered on a weekend and adds nothing.
    expect(suggestedSpacePrice(["kupolas-seminaras"], "2026-11-21", SPACES)).toBe(0);
    expect(suggestedSpacePrice(["parkas"], "2026-11-21", SPACES)).toBe(7000);
  });

  it("uses the weekday price only for Mon–Thu daytime hires", () => {
    // 2026-11-24 is a Tuesday.
    expect(spaceRent(SPACES[5], "2026-11-24", "10:00")).toBe(6000);
    expect(spaceRent(SPACES[5], "2026-11-24", "18:00")).toBe(7000);
    expect(spaceRent(SPACES[5], "2026-11-24")).toBe(7000);
    expect(suggestedSpacePrice(["kupolas-seminaras"], "2026-11-24", SPACES, "09:00")).toBe(363);
  });

  it("names spaces", () => {
    expect(spaceLabels(["terasa", "corona"], SPACES)).toBe("Įstiklinta terasa, „Corona“ su baseinu");
    expect(spaceLabels(["nera"], SPACES)).toBe("nera");
  });
});
