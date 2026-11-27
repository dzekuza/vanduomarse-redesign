import { describe, expect, it } from "vitest";
import { buildSales, filterSales, salesRevenue, type SaleFilters } from "./sales";
import type { PlanPass, Purchase } from "./types";

const pass = (over: Partial<PlanPass>): PlanPass => ({
  id: "p1",
  reference: "PS-1",
  code: null,
  planId: "52e95927-7591-4feb-99b4-1b92c878ca6c",
  planName: "WAKE sezono abonementas",
  price: 600,
  discountCode: "WAKEBLACKFRIDAY2026",
  buyerName: "Jonas Jonaitis",
  buyerEmail: "jonas@example.com",
  gift: false,
  recipientName: "",
  status: "dalinai_apmoketa",
  paidAt: "2026-11-27T10:00:00Z",
  riderId: null,
  redeemedAt: null,
  purchaseId: null,
  createdAt: "2026-11-27T09:58:00Z",
  paymentPlan: "dalimis",
  depositAmount: 300,
  balanceAmount: 300,
  balancePaidAt: null,
  balanceSessionId: null,
  refundedAt: null,
  depositRefundedAt: null,
  balanceRefundedAt: null,
  ...over,
});

const empty = { bookings: [], stayTypes: [], quadRentals: [], quadTypes: [], tourTickets: [], eventTickets: [], events: [], coupons: [], purchases: [] as Purchase[], riders: [] };
const all: SaleFilters = { category: "visos", state: "galiojancios", origin: "visi", from: "", to: "", query: "" };

describe("online WAKE passes in sales (ADR-0139)", () => {
  it("lists a part-paid pass under Vandenlentės, counting only the deposit and showing what is owed", () => {
    const [s] = buildSales({ ...empty, planPasses: [pass({})] });
    expect(s).toMatchObject({
      id: "pp-p1",
      category: "vandenlentes",
      item: "WAKE sezono abonementas",
      customer: "Jonas Jonaitis",
      reference: "PS-1",
      total: 300,
      state: "galioja",
      source: "svetaine",
      statusLabel: "Apmokėta 300 € · Likutis 300 €",
      target: { kind: "pass", id: "p1" },
      soldOn: "2026-11-27",
    });
    expect(salesRevenue(filterSales([s], all))).toBe(300);
  });

  it("counts the full price once the balance is paid", () => {
    const sales = buildSales({ ...empty, planPasses: [pass({ status: "apmoketa", code: "XZ8DNQKA6FUL", balancePaidAt: "2026-12-01T10:00:00Z" })] });
    expect(sales[0]).toMatchObject({ total: 600, statusLabel: "Apmokėtas, nepriskirtas" });
    expect(salesRevenue(sales)).toBe(600);
  });

  it("counts a full-payment pass at its price, and a gift says so", () => {
    const sales = buildSales({ ...empty, planPasses: [pass({ paymentPlan: "visa", depositAmount: null, balanceAmount: null, status: "apmoketa", code: "XZ8DNQKA6FUL", gift: true })] });
    expect(sales[0]).toMatchObject({ total: 600, item: "WAKE sezono abonementas (dovana)" });
  });

  it("leaves unpaid passes out and shows cancelled or refunded ones as not counting", () => {
    const sales = buildSales({
      ...empty,
      planPasses: [
        pass({ id: "unpaid", status: "laukia_apmokejimo", paidAt: null }),
        pass({ id: "cancelled", status: "atsauktas", depositRefundedAt: "2026-11-28T10:00:00Z", refundedAt: "2026-11-28T10:00:00Z" }),
        pass({ id: "refunded", status: "priskirtas", paymentPlan: "visa", depositAmount: null, balanceAmount: null, refundedAt: "2026-11-28T10:00:00Z" }),
      ],
    });
    expect(sales.map((s) => s.id).sort()).toEqual(["pp-cancelled", "pp-refunded"]);
    expect(sales.every((s) => s.state === "atsaukta")).toBe(true);
    expect(salesRevenue(sales)).toBe(0);
    expect(filterSales(sales, all)).toHaveLength(0);
  });

  it("counts an attached pass once: the till purchase logged when staff attached it is left out", () => {
    const purchase: Purchase = { id: "pu1", riderId: "r1", planId: "x", planName: "WAKE sezono abonementas", planCategory: "wake" as Purchase["planCategory"], price: 600, paymentMethod: "kortele", soldAt: "2026-12-02T10:00:00Z" };
    const other: Purchase = { ...purchase, id: "pu2", price: 50 };
    const sales = buildSales({
      ...empty,
      purchases: [purchase, other],
      planPasses: [pass({ status: "priskirtas", code: "XZ8DNQKA6FUL", balancePaidAt: "2026-12-01T10:00:00Z", riderId: "r1", purchaseId: "pu1" })],
    });
    expect(sales.map((s) => s.id).sort()).toEqual(["p-pu2", "pp-p1"]);
    expect(salesRevenue(sales)).toBe(650);
  });
});
