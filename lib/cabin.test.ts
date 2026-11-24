import { describe, expect, it } from "vitest";
import { lowestStayPrice, stayNightRate, stayPrice, stayRateLabel, stayTiersLabel, type StayType } from "@/lib/cabin";

const tiered: StayType = { id: "namelis-2", kind: "namelis", label: "Namelis", note: "", maxGuests: 2, pricePerNight: 100, pricePerNight2: 80, pricePerNight3: 60, seasons: [], units: 2, active: true, sortOrder: 0 };

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

describe("seasonal prices", () => {
  const summer = { id: "s1", startsOn: "2027-07-01", endsOn: "2027-08-31", pricePerNight: 20, pricePerNight2: 10, pricePerNight3: 5 };
  const seasonal: StayType = { ...tiered, seasons: [summer] };

  it("prices every night of a stay inside the season from the season", () => {
    expect(stayPrice(seasonal, 1, 1, "2027-07-10")).toBe(20);
    expect(stayPrice(seasonal, 2, 1, "2027-07-10")).toBe(20);
    expect(stayPrice(seasonal, 4, 2, "2027-07-10")).toBe(40);
  });

  it("includes both ends of the range", () => {
    expect(stayPrice(seasonal, 1, 1, "2027-07-01")).toBe(20);
    expect(stayPrice(seasonal, 1, 1, "2027-08-31")).toBe(20);
    expect(stayPrice(seasonal, 1, 1, "2027-06-30")).toBe(100);
    expect(stayPrice(seasonal, 1, 1, "2027-09-01")).toBe(100);
  });

  it("prices a stay that crosses the season's end night by night, with the tier of the whole stay", () => {
    // 4 nights from 30 Aug: two summer nights at 5, two later nights at the base 3+ rate of 60.
    expect(stayPrice(seasonal, 4, 1, "2027-08-30")).toBe(130);
    // 2 nights ending in the season: one base night at the 2-night rate (80), one summer night at 10.
    expect(stayPrice(seasonal, 2, 1, "2027-06-30")).toBe(90);
  });

  it("uses the base prices without a check-in date and accepts a Date", () => {
    expect(stayPrice(seasonal, 2)).toBe(160);
    expect(stayPrice(seasonal, 1, 1, new Date(2027, 6, 10))).toBe(20);
  });

  it("shows a 'from' price when a season changes the nightly price", () => {
    expect(stayRateLabel({ ...tiered, pricePerNight2: 100, pricePerNight3: 100, seasons: [summer] })).toBe("nuo 5 € / naktį");
    expect(lowestStayPrice([seasonal])).toBe(5);
  });
});
