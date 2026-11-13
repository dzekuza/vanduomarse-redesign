import { describe, expect, it } from "vitest";
import { cancelPolicy, hoursUntilStart } from "@/lib/request-cancel";

// 12:00 in Vilnius (UTC+2 in November).
const NOW = new Date("2026-11-10T10:00:00Z");

const paid = { status: "patvirtinta", payment: "apmoketa", total: 80, startHour: 12 } as const;

describe("hoursUntilStart", () => {
  it("counts park time, not server time", () => {
    expect(hoursUntilStart("2026-11-12", 12, NOW)).toBe(48);
    expect(hoursUntilStart("2026-11-10", 11, NOW)).toBe(-1);
  });
});

describe("cancelPolicy", () => {
  it("refunds a paid request in full at 24 h or more", () => {
    expect(cancelPolicy({ ...paid, date: "2026-11-11" }, NOW)).toEqual({ state: "yes", refund: 80 });
  });

  it("asks the customer to call when a paid request starts in under 24 h", () => {
    expect(cancelPolicy({ ...paid, date: "2026-11-11", startHour: 11 }, NOW)).toEqual({ state: "late", refund: 0 });
  });

  it("lets an unpaid request cancel at any time before it starts, with nothing to refund", () => {
    const unpaid = { ...paid, payment: null, date: "2026-11-10", startHour: 14 } as const;
    expect(cancelPolicy(unpaid, NOW)).toEqual({ state: "yes", refund: 0 });
  });

  it("offers nothing once started, cancelled, done, still paying, refunded or undated", () => {
    expect(cancelPolicy({ ...paid, date: "2026-11-10", startHour: 12 }, NOW).state).toBe("no");
    expect(cancelPolicy({ ...paid, date: "2026-11-20", status: "atsaukta" }, NOW).state).toBe("no");
    expect(cancelPolicy({ ...paid, date: "2026-11-20", status: "ivykdyta" }, NOW).state).toBe("no");
    expect(cancelPolicy({ ...paid, date: "2026-11-20", payment: "laukia" }, NOW).state).toBe("no");
    expect(cancelPolicy({ ...paid, date: "" }, NOW).state).toBe("no");
  });

  it("does not refund an already refunded payment", () => {
    expect(cancelPolicy({ ...paid, date: "2026-11-20", payment: "grazinta" }, NOW)).toEqual({ state: "yes", refund: 0 });
  });
});
