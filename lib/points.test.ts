import { describe, expect, it } from "vitest";
import { adjustPointsSchema, earnedPoints, formatPoints, kindLabel, pointsValueEur } from "@/lib/points";

describe("points helpers", () => {
  it("earns whole points on the euros paid", () => {
    expect(earnedPoints(40, 5)).toBe(200);
    expect(earnedPoints(19.99, 5)).toBe(99);
    expect(earnedPoints(0.1, 5)).toBe(0);
    expect(earnedPoints(0.29, 100)).toBe(29);
    expect(earnedPoints(100, 5.5)).toBe(550);
  });

  it("values points to the cent", () => {
    expect(pointsValueEur(250, 0.01)).toBe(2.5);
    expect(pointsValueEur(1, 0.01)).toBe(0.01);
  });

  it("labels known kinds and passes unknown ones through", () => {
    expect(kindLabel("earn")).toBe("Gauta už pirkinį");
    expect(kindLabel("other")).toBe("other");
  });

  it("formats points", () => {
    expect(formatPoints(1250)).toMatch(/^1\s?250 tšk\.$/);
  });
});

describe("adjustPointsSchema", () => {
  it("accepts a signed whole number with a reason", () => {
    expect(adjustPointsSchema.safeParse({ delta: 100, reason: "Dovana" }).success).toBe(true);
    expect(adjustPointsSchema.safeParse({ delta: -50, reason: " Klaida " }).data?.reason).toBe("Klaida");
  });

  it("rejects zero, fractions, huge amounts and a missing reason", () => {
    expect(adjustPointsSchema.safeParse({ delta: 0, reason: "x" }).success).toBe(false);
    expect(adjustPointsSchema.safeParse({ delta: 1.5, reason: "x" }).success).toBe(false);
    expect(adjustPointsSchema.safeParse({ delta: 2_000_000, reason: "x" }).success).toBe(false);
    expect(adjustPointsSchema.safeParse({ delta: 5, reason: "  " }).success).toBe(false);
  });
});
