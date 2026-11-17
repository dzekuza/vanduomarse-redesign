import { describe, expect, it } from "vitest";
import { formatPassCode, normalizePassCode, planPassSchema } from "@/lib/plan-pass";

const valid = { planId: "52e95927-7591-4feb-99b4-1b92c878ca6c", buyerName: "Jonas Jonaitis", buyerEmail: "jonas@example.com", gift: false, recipientName: "" };

describe("pass codes", () => {
  it("shows 12 characters in groups of four", () => {
    expect(formatPassCode("XZ8DNQKA6FUL")).toBe("XZ8D-NQKA-6FUL");
  });

  it("reads back what a person types: spaces, dashes and lower case", () => {
    expect(normalizePassCode(" xz8d-nqka 6ful ")).toBe("XZ8DNQKA6FUL");
    expect(normalizePassCode(formatPassCode("XZ8DNQKA6FUL"))).toBe("XZ8DNQKA6FUL");
  });
});

describe("planPassSchema", () => {
  it("accepts a buyer with only a name and an e-mail", () => {
    expect(planPassSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a gift with a friend's name", () => {
    expect(planPassSchema.safeParse({ ...valid, gift: true, recipientName: "Petras" }).success).toBe(true);
  });

  it("refuses a bad plan id, name or e-mail", () => {
    expect(planPassSchema.safeParse({ ...valid, planId: "nope" }).success).toBe(false);
    expect(planPassSchema.safeParse({ ...valid, buyerName: "J" }).success).toBe(false);
    expect(planPassSchema.safeParse({ ...valid, buyerEmail: "not-an-email" }).success).toBe(false);
  });

  it("does not reject a filled honeypot itself: the action answers it like any failure, without feedback", () => {
    expect(planPassSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(true);
  });
});
