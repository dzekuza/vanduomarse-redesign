import { describe, expect, it } from "vitest";
import { isWakeBlackFridayDiscount, WAKE_BLACK_FRIDAY_DISCOUNT } from "./wake-black-friday";

describe("isWakeBlackFridayDiscount", () => {
  it("accepts the campaign row whatever percentage the owner sets", () => {
    expect(isWakeBlackFridayDiscount(WAKE_BLACK_FRIDAY_DISCOUNT)).toBe(true);
    expect(isWakeBlackFridayDiscount({ ...WAKE_BLACK_FRIDAY_DISCOUNT, value: 20 })).toBe(true);
  });

  it("rejects another code, a fixed amount, a zero value or a code not valid for plans", () => {
    expect(isWakeBlackFridayDiscount(null)).toBe(false);
    expect(isWakeBlackFridayDiscount({ ...WAKE_BLACK_FRIDAY_DISCOUNT, code: "KITAS" })).toBe(false);
    expect(isWakeBlackFridayDiscount({ ...WAKE_BLACK_FRIDAY_DISCOUNT, kind: "suma" })).toBe(false);
    expect(isWakeBlackFridayDiscount({ ...WAKE_BLACK_FRIDAY_DISCOUNT, value: 0 })).toBe(false);
    expect(isWakeBlackFridayDiscount({ ...WAKE_BLACK_FRIDAY_DISCOUNT, services: ["kuponai"] })).toBe(false);
  });
});
