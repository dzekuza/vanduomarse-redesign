import { describe, expect, it } from "vitest";
import { lowestStayPrice, stayNightRate, stayPrice, stayRateLabel, stayTiersLabel, type StayType } from "@/lib/cabin";

const tiered: StayType = { id: "namelis-2", kind: "namelis", label: "Namelis", note: "", maxGuests: 2, pricePerNight: 100, pricePerNight2: 80, pricePerNight3: 60, units: 2, active: true, sortOrder: 0 };

describe("stay night tiers", () => {
  it("applies the rate of the whole stay's length to every night", () => {
    expect(stayNightRate(tiered, 1)).toBe(100);
    expect(stayNightRate(tiered, 2)).toBe(80);
    expect(stayNightRate(tiered, 3)).toBe(60);
    expect(stayNightRate(tiered, 14)).toBe(60);
  });

  it("prices a stay by nights and units", () => {
    expect(stayPrice(tiered, 1)).toBe(100);
    expect(stayPrice(tiered, 2)).toBe(160);
    expect(stayPrice(tiered, 4, 2)).toBe(480);
    expect(stayPrice(tiered, 0)).toBe(0);
  });

  it("labels the tiers and the cheapest rate", () => {
    expect(stayTiersLabel(tiered)).toBe("100 / 80 / 60 €");
    expect(stayTiersLabel({ ...tiered, pricePerNight2: 100, pricePerNight3: 100 })).toBe("100 €");
    expect(stayRateLabel(tiered)).toBe("nuo 60 € / naktį");
    expect(stayRateLabel({ ...tiered, pricePerNight2: 100, pricePerNight3: 100 })).toBe("100 € / naktį");
    expect(lowestStayPrice([tiered])).toBe(60);
  });
});
