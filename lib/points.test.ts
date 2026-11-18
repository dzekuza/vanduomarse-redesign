import { describe, expect, it } from "vitest";
import { adjustPointsSchema, cashShare, earnedPoints, formatPoints, kindLabel, pointsValueEur, spendPreview } from "@/lib/points";

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

describe("spendPreview", () => {
  const wallet = { balance: 1000, pointValueEur: 0.01, enabled: true };
  it("uses the whole balance when the payment is larger", () => {
    expect(spendPreview(wallet, 30)).toEqual({ points: 1000, euros: 10 });
  });
  it("keeps the cash charge at 0.50 EUR", () => {
    expect(spendPreview(wallet, 5)).toEqual({ points: 450, euros: 4.5 });
    expect(spendPreview(wallet, 0.5)).toEqual({ points: 0, euros: 0 });
  });
  it("offers nothing without points, when off, or signed out", () => {
    expect(spendPreview({ ...wallet, balance: 0 }, 30).points).toBe(0);
    expect(spendPreview({ ...wallet, enabled: false }, 30).points).toBe(0);
    expect(spendPreview(null, 30).points).toBe(0);
  });
});

describe("cashShare", () => {
  it("is the whole total without points and the cash part with them", () => {
    expect(cashShare(30, null)).toBe(30);
    expect(cashShare(30, { amount: 20, pointsDiscount: 0 })).toBe(30);
    expect(cashShare(15, { amount: 10, pointsDiscount: 20 })).toBe(5);
  });
});
