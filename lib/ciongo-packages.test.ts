import { describe, expect, it } from "vitest";
import { CIONGO_PACKAGES, ciongoEstimate, ciongoFromPrice, ciongoPackage, ciongoPackagesByPrice, type CiongoPriceSources } from "./ciongo-packages";
import type { QuadTourRoute } from "./quads";
import type { SaunaRates } from "./sauna";

const route = {
  id: "midi", name: "Midi", kilometres: 35, hours: 2, durationLabel: "", price: 80, minUnits: 5, maxUnits: 15,
  groupFrom: 10, groupPrice: 72, guidesFrom: 11, guideUnits: 2, description: "", longDescription: "", photo: "", badge: null, active: true, sortOrder: 0,
} satisfies QuadTourRoute;
const rates = (weekday: number, weekend: number): SaunaRates => ({
  weekdayPrices: { 3: weekday }, weekendPrices: { 3: weekend }, includedGuests: 10, extraGuestFee: 15, turnaroundHours: 1, maxParty: 20, minHours: 2, maxHours: 12, openHour: 10, closeHour: 22,
} as SaunaRates);
const sources: CiongoPriceSources = { route, saunas: { suomiska: rates(210, 270), malkine: rates(270, 350) } };
const pkg = (id: string) => ciongoPackage(id)!;

describe("CIONGO packages", () => {
  it("has the five packages of the offer sheet", () => {
    expect(CIONGO_PACKAGES).toHaveLength(5);
  });

  it("lists the packages from the cheapest to the dearest", () => {
    const sorted = ciongoPackagesByPrice(sources).map((pkg) => ciongoFromPrice(pkg, sources).min);
    expect(sorted).toEqual(sorted.toSorted((a, b) => a - b));
    expect(ciongoPackagesByPrice(sources)[0].id).toBe("svesk-su-veiksmu");
  });

  it("prices Adrenalinas ir pirtis like the sheet: 1530 € weekday, 1590 € weekend, Finnish sauna", () => {
    const base = { people: 10, sauna: "suomiska" as const, overnight: false };
    expect(ciongoEstimate(pkg("adrenalinas-ir-pirtis"), { ...base, day: "2026-12-01" }, sources).total).toEqual({ min: 1530, max: 1530 });
    expect(ciongoEstimate(pkg("adrenalinas-ir-pirtis"), { ...base, day: "2026-12-05" }, sources).total).toEqual({ min: 1590, max: 1590 });
    expect(ciongoEstimate(pkg("adrenalinas-ir-pirtis"), { ...base, day: null }, sources).total).toEqual({ min: 1530, max: 1590 });
  });

  it("uses the sheet's wood-fired sauna with a sauna master: 530 € / 600 €", () => {
    const line = (day: string) => ciongoEstimate(pkg("komandos-diena"), { people: 10, sauna: "malkine", overnight: false, day }, sources).lines.find(({ id }) => id === "pirtis");
    expect(line("2026-12-01")?.amount).toEqual({ min: 530, max: 530 });
    expect(line("2026-12-06")?.amount).toEqual({ min: 600, max: 600 });
  });

  it("matches Vakarėlis su nakvyne: 2030–2380 € on a weekday", () => {
    const estimate = ciongoEstimate(pkg("vakarelis-su-nakvyne"), { people: 10, sauna: "suomiska", overnight: false, day: "2026-12-02" }, sources);
    expect(estimate.total).toEqual({ min: 2030, max: 2380 });
    expect(estimate.perPerson).toEqual({ min: 203, max: 238 });
  });

  it("adds optional cabins only when chosen", () => {
    const base = { people: 10, sauna: "suomiska" as const, day: "2026-12-02" };
    expect(ciongoEstimate(pkg("svesk-su-veiksmu"), { ...base, overnight: false }, sources).total).toEqual({ min: 1280, max: 1430 });
    expect(ciongoEstimate(pkg("svesk-su-veiksmu"), { ...base, overnight: true }, sources).total).toEqual({ min: 1780, max: 2030 });
  });

  it("scales by group: below 10 quads cost 80 €, extra sauna guests pay the sauna's fee", () => {
    const small = ciongoEstimate(pkg("adrenalinas-ir-pirtis"), { people: 6, sauna: "suomiska", overnight: false, day: "2026-12-01" }, sources);
    expect(small.lines.find(({ id }) => id === "keturraciai")?.amount).toEqual({ min: 480, max: 480 });
    const large = ciongoEstimate(pkg("adrenalinas-ir-pirtis"), { people: 12, sauna: "suomiska", overnight: false, day: "2026-12-01" }, sources);
    expect(large.lines.find(({ id }) => id === "pirtis")?.amount).toEqual({ min: 240, max: 240 });
  });

  it("shows a 'from' price for the sheet's group", () => {
    expect(ciongoFromPrice(pkg("adrenalinas-ir-pirtis"), sources).min).toBe(1530);
  });
});
