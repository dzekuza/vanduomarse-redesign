import { describe, expect, it } from "vitest";
import { canPayInParts, formatPassCode, normalizePassCode, passOwedAmount, passPaidAmount, planPassSchema, splitPassPrice } from "@/lib/plan-pass";
import { WAKE_SEASON_PASS_ID } from "@/lib/wake-black-friday";

const valid = { planId: "52e95927-7591-4feb-99b4-1b92c878ca6c", buyerName: "Jonas Jonaitis", buyerEmail: "jonas@example.com", gift: false, recipientName: "", paymentPlan: "visa" };

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

describe("paying the WAKE pass in parts (ADR-0139)", () => {
  it("splits the final price in two halves: the deposit rounded to the cent, the balance the rest", () => {
    expect(splitPassPrice(600)).toEqual({ deposit: 300, balance: 300 });
    expect(splitPassPrice(675)).toEqual({ deposit: 337.5, balance: 337.5 });
    // Half a cent rounds up on the deposit (like Postgres round()); the two always add up to the price.
    expect(splitPassPrice(600.01)).toEqual({ deposit: 300.01, balance: 300 });
    expect(splitPassPrice(599.99)).toEqual({ deposit: 300, balance: 299.99 });
    for (const price of [1, 1.01, 99.99, 749.97]) {
      const { deposit, balance } = splitPassPrice(price);
      expect(Math.round((deposit + balance) * 100)).toBe(Math.round(price * 100));
    }
  });

  it("offers parts only for the WAKE season pass, and only while both halves reach 0,50 €", () => {
    expect(canPayInParts(WAKE_SEASON_PASS_ID, 600)).toBe(true);
    expect(canPayInParts("11111111-1111-4111-8111-111111111111", 600)).toBe(false);
    expect(canPayInParts(WAKE_SEASON_PASS_ID, 1)).toBe(true);
    expect(canPayInParts(WAKE_SEASON_PASS_ID, 0.99)).toBe(false);
  });

  it("accepts the payment plan in the form shape, and nothing else", () => {
    expect(planPassSchema.safeParse({ ...valid, paymentPlan: "dalimis" }).success).toBe(true);
    expect(planPassSchema.safeParse({ ...valid, paymentPlan: "trimis" }).success).toBe(false);
  });

  const pass = {
    status: "dalinai_apmoketa" as const, paymentPlan: "dalimis" as const, price: 600, depositAmount: 300, balanceAmount: 300,
    paidAt: "2026-11-27T10:00:00Z", balancePaidAt: null, refundedAt: null, depositRefundedAt: null, balanceRefundedAt: null,
  };

  it("counts what came in and what is still owed", () => {
    expect(passPaidAmount(pass)).toBe(300);
    expect(passOwedAmount(pass)).toBe(300);
    const full = { ...pass, status: "apmoketa" as const, balancePaidAt: "2026-12-01T10:00:00Z" };
    expect(passPaidAmount(full)).toBe(600);
    expect(passOwedAmount(full)).toBe(0);
    expect(passPaidAmount({ ...pass, paymentPlan: "visa", depositAmount: null, balanceAmount: null, status: "apmoketa" })).toBe(600);
  });

  it("counts nothing for an unpaid or cancelled pass, and leaves out a refunded half", () => {
    expect(passPaidAmount({ ...pass, status: "laukia_apmokejimo", paidAt: null })).toBe(0);
    expect(passPaidAmount({ ...pass, status: "atsauktas" })).toBe(0);
    expect(passPaidAmount({ ...pass, status: "priskirtas", balancePaidAt: "2026-12-01T10:00:00Z", balanceRefundedAt: "2026-12-02T10:00:00Z" })).toBe(300);
    expect(passPaidAmount({ ...pass, status: "priskirtas", paymentPlan: "visa", depositAmount: null, balanceAmount: null, refundedAt: "2026-12-02T10:00:00Z" })).toBe(0);
  });
});
