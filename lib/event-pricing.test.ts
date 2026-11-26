import { describe, expect, it } from "vitest";
import { DEFAULT_INPUT, estimate, type EstimateInput, type SpaceId } from "./event-pricing";

/** A Saturday evening, so every space has its weekend rate. */
const input = (spaces: SpaceId[], patch: Partial<EstimateInput> = {}): EstimateInput => ({
  ...DEFAULT_INPUT,
  date: "2027-06-12",
  day: "weekend",
  eventTime: "evening",
  adults: 80,
  spaces,
  ...patch,
});

const spaceTotal = (spaces: SpaceId[], patch?: Partial<EstimateInput>) =>
  estimate(input(spaces, patch)).lines.filter((line) => line.group === "Erdvė").reduce((sum, line) => sum + line.amount.min, 0);

describe("estimate with several spaces", () => {
  it("prices nothing until a space is picked", () => {
    const result = estimate(input([]));
    expect(result.available).toBe(false);
    expect(result.lines).toEqual([]);
  });

  it("adds the rents: Kupolas + lauko terasa is the sheet's 1 900 € package", () => {
    expect(spaceTotal(["kupolas-svente"])).toBe(700);
    expect(spaceTotal(["corona"])).toBe(1200);
    expect(spaceTotal(["kupolas-svente", "corona"])).toBe(1900);
    expect(spaceTotal(["kupolas-corona"])).toBe(1900);
  });

  it("charges one minimum bill (the highest) and one service fee", () => {
    const both = estimate(input(["kupolas-svente", "corona"]));
    const single = estimate(input(["corona"]));
    expect(both.minSpendGap).toEqual(single.minSpendGap);
    expect(both.lines.filter((line) => line.label === "Aptarnavimo mokestis")).toHaveLength(1);
  });

  it("takes the larger service fee when the whole park is hired with another space", () => {
    const park = estimate(input(["parkas"]));
    const fee = park.lines.find((line) => line.label === "Aptarnavimo mokestis");
    expect(fee?.amount).toEqual({ min: 350, max: 350 });
  });

  it("is unavailable when one chosen space does not take the group", () => {
    const result = estimate(input(["kupolas-svente", "restoranas"], { adults: 80 }));
    expect(result.available).toBe(false);
    expect(result.warnings.join(" ")).toContain("Restoranas + terasa: daugiausia 45 asmenų.");
  });

  it("warns that the seminar dome is for weekdays only", () => {
    const result = estimate(input(["kupolas-seminaras"]));
    expect(result.available).toBe(false);
    expect(result.warnings).toContain("Seminarams kupolas nuomojamas tik darbo dienomis.");
  });

  it("applies the extra hours once", () => {
    const hours = estimate(input(["kupolas-svente", "corona"], { extraHours: 2 })).lines.filter((line) => line.label.includes("× 2"));
    expect(hours).toHaveLength(1);
    expect(hours[0].amount.min).toBe(300);
  });

  it("before the date is chosen the rent is a range over both kinds of day, not zero", () => {
    const park = estimate(input(["parkas"], { date: null, day: null, eventTime: null }));
    expect(park.available).toBe(false);
    expect(park.lines.find((line) => line.group === "Erdvė")?.amount).toEqual({ min: 6000, max: 7000 });
    const dome = estimate(input(["kupolas-svente"], { date: null, day: null, eventTime: null }));
    expect(dome.lines.find((line) => line.group === "Erdvė")?.amount).toEqual({ min: 700, max: 700 });
    expect(dome.warnings).toContain("Pasirink renginio datą ir laiką, kad matytum tikslią erdvės kainą.");
  });
});

describe("camp (stovykla)", () => {
  const camp = (spaces: SpaceId[], patch: Partial<EstimateInput> = {}) => estimate(input(spaces, { preset: "stovykla", adults: 30, ...patch }));
  const group = (result: ReturnType<typeof estimate>, name: string) => result.lines.filter((line) => line.group === name);

  it("charges the dome 100 € a day instead of the event rent", () => {
    const rent = group(camp(["kupolas-svente"], { campDays: 3 }), "Erdvė");
    expect(rent).toHaveLength(1);
    expect(rent[0].amount).toEqual({ min: 300, max: 300 });
    expect(group(estimate(input(["kupolas-svente"])), "Erdvė")[0].amount.min).toBe(700);
  });

  it("keeps other spaces at their normal price and the seminar dome available at a weekend", () => {
    expect(group(camp(["corona"]), "Erdvė")[0].amount.min).toBe(1200);
    expect(camp(["kupolas-seminaras"]).available).toBe(true);
  });

  it("prices the meals per guest: the weekend package is 81 € a person", () => {
    const result = camp(["kupolas-svente"], { campMeals: { breakfast: 2, lunch: 1, dinner: 2 } });
    const meals = group(result, "Maistas ir gėrimai").filter((line) => !line.label.startsWith("Iki minimalios"));
    expect(meals.reduce((sum, line) => sum + line.amount.min, 0)).toBe(30 * 81);
  });

  it("ignores camp meals and days when the event is not a camp", () => {
    const result = estimate(input(["kupolas-svente"], { campDays: 3, campMeals: { breakfast: 2, lunch: 1, dinner: 2 } }));
    expect(group(result, "Maistas ir gėrimai")).toEqual([]);
    expect(group(result, "Erdvė")[0].amount.min).toBe(700);
  });

  it("has no service fee, drinks or catering extras at a camp", () => {
    const drinks = { keg: 2, wine: 5, sparkling: 0, cocktail: 0, juice: 0 };
    const result = camp(["kupolas-svente"], { drinks, bartenders: 2, decor: true, serving: true, coffeeBreak: true });
    expect(group(result, "Paslaugos")).toEqual([]);
    expect(group(result, "Maistas ir gėrimai")).toEqual([]);
    expect(estimate(input(["kupolas-svente"], { drinks, bartenders: 2 })).lines.some((line) => line.group === "Paslaugos")).toBe(true);
  });

  it("notes the chosen activities as priced by agreement and ignores them outside a camp", () => {
    const result = camp(["kupolas-svente"], { campActivities: ["film", "yoga", "other"] });
    expect(result.notes).toEqual(["Veiklos (kaina aptariama): Filmų vakaras, Joga, Kita veikla."]);
    expect(estimate(input(["kupolas-svente"], { campActivities: ["film"] })).notes).toEqual([]);
  });
});
