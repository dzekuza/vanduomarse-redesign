import { describe, expect, it } from "vitest";
import { freeStayUnits, lowestStayPrice, seasonOn, seasonsProblem, stayBookable, stayBookingDays, stayNightRate, stayPrice, stayRateLabel, stayTiersLabel, type StayType } from "@/lib/cabin";

const tiered: StayType = { id: "namelis-2", kind: "namelis", label: "Namelis", note: "", maxGuests: 2, pricePerNight: 100, pricePerNight2: 80, pricePerNight3: 60, seasons: [], units: 2, bookableUntil: null, active: true, sortOrder: 0 };

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

describe("nested seasons", () => {
  const winter = { id: "w", startsOn: "2026-11-26", endsOn: "2027-04-30", pricePerNight: 50, pricePerNight2: 50, pricePerNight3: 50 };
  const christmas = { id: "x", startsOn: "2026-12-24", endsOn: "2026-12-26", pricePerNight: 90, pricePerNight2: 90, pricePerNight3: 90 };
  const type: StayType = { ...tiered, seasons: [winter, christmas] };

  it("prices a night inside both from the shorter season", () => {
    expect(seasonOn(type, "2026-12-25")?.id).toBe("x");
    expect(seasonOn(type, "2026-12-23")?.id).toBe("w");
    expect(seasonOn(type, "2027-05-01")).toBeUndefined();
  });

  it("prices a stay crossing into the nested season night by night", () => {
    // 23, 24, 25 Dec: one winter night and two Christmas nights, all at the 3+ rate.
    expect(stayPrice(type, 3, 1, "2026-12-23")).toBe(50 + 90 + 90);
  });

  it("is independent of the order the seasons are listed in", () => {
    expect(seasonOn({ seasons: [christmas, winter] }, "2026-12-24")?.id).toBe("x");
  });

  it("accepts nested seasons and refuses identical or crossing ones", () => {
    expect(seasonsProblem([winter, christmas])).toBeNull();
    expect(seasonsProblem([winter, { ...winter, id: "w2" }])).toMatch(/tas pačias datas/);
    expect(seasonsProblem([winter, { ...christmas, startsOn: "2027-04-28", endsOn: "2027-05-03" }])).toMatch(/kertasi/);
    expect(seasonsProblem([christmas, { ...christmas, startsOn: "2026-12-27", endsOn: "2026-12-30" }])).toBeNull();
  });
});

describe("bookable until", () => {
  const closing: StayType = { ...tiered, bookableUntil: "2027-05-01" };

  it("allows a stay whose last night is the day before (check-out on the date)", () => {
    expect(stayBookable(closing, "2027-04-30", 1)).toBe(true);
    expect(stayBookable(closing, "2027-04-29", 2)).toBe(true);
  });

  it("refuses a stay with a night on or after the date", () => {
    expect(stayBookable(closing, "2027-04-30", 2)).toBe(false);
    expect(stayBookable(closing, "2027-05-01", 1)).toBe(false);
  });

  it("is always bookable without a date", () => {
    expect(stayBookable(tiered, "2027-09-01", 3)).toBe(true);
  });

  it("shows no free units past the date", () => {
    expect(freeStayUnits({}, new Date(2027, 3, 30), 1, closing)).toBe(2);
    expect(freeStayUnits({}, new Date(2027, 3, 30), 2, closing)).toBe(0);
  });

  it("shortens the list of check-in days when every type closes", () => {
    expect(stayBookingDays([closing], "2026-11-26")).toBe(156);
    expect(stayBookingDays([closing, tiered], "2026-11-26")).toBe(350);
    expect(stayBookingDays([], "2026-11-26")).toBe(350);
  });
});

describe("nightsLabel", () => {
  it("uses the Lithuanian plural", async () => {
    const { nightsLabel } = await import("@/lib/cabin");
    expect([1, 2, 9, 10, 12, 21, 22, 30, 111].map(nightsLabel)).toEqual(["1 naktis", "2 naktys", "9 naktys", "10 naktų", "12 naktų", "21 naktis", "22 naktys", "30 naktų", "111 naktų"]);
  });
});
