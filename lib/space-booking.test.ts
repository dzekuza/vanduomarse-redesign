import { describe, expect, it } from "vitest";
import { anySpaceClash, spaceLabels, spacesClash, suggestedSpacePrice, windowsOverlap } from "./space-booking";

describe("space bookings", () => {
  it("clashes on the same space and on the whole park", () => {
    expect(spacesClash("terasa", "terasa")).toBe(true);
    expect(spacesClash("terasa", "corona")).toBe(false);
    expect(spacesClash("parkas", "terasa")).toBe(true);
    expect(anySpaceClash(["terasa", "corona"], ["restoranas"])).toBe(false);
    expect(anySpaceClash(["terasa", "corona"], ["parkas-wake"])).toBe(true);
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

  it("adds the sheet rent of each space", () => {
    // 2026-11-21 is a Saturday: dome party 700 + Corona 1200.
    expect(suggestedSpacePrice(["kupolas-svente", "corona"], "2026-11-21", 40)).toBe(1900);
    expect(suggestedSpacePrice(["terasa"], "2026-11-21", 20)).toBe(0);
    expect(suggestedSpacePrice(["terasa"], "", 20)).toBe(0);
  });

  it("names spaces", () => {
    expect(spaceLabels(["terasa", "corona"])).toBe("Įstiklinta terasa, „Corona“ su baseinu");
  });
});
