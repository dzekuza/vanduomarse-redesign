import { describe, expect, it } from "vitest";
import { anySpaceClash, spaceLabels, spacesClash, suggestedSpacePrice, timesOverlap } from "./space-booking";

describe("space bookings", () => {
  it("clashes on the same space and on the whole park", () => {
    expect(spacesClash("terasa", "terasa")).toBe(true);
    expect(spacesClash("terasa", "corona")).toBe(false);
    expect(spacesClash("parkas", "terasa")).toBe(true);
    expect(anySpaceClash(["terasa", "corona"], ["restoranas"])).toBe(false);
    expect(anySpaceClash(["terasa", "corona"], ["parkas-wake"])).toBe(true);
  });

  it("treats touching times as free", () => {
    expect(timesOverlap("12:00", "16:00", "16:00", "20:00")).toBe(false);
    expect(timesOverlap("12:00", "16:00", "15:00", "20:00")).toBe(true);
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
