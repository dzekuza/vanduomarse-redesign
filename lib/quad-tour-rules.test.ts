import { describe, expect, it } from "vitest";
import { quadTourGuideUnits, quadTourLowestPrice, quadTourMaxUnits, quadTourPriceLabel, quadTourUnitPrice, quadTourUnitsNote } from "./quads";

/** The Midi tour as the 2026-11-27 migration sets it. */
const midi = { price: 80, minUnits: 5, maxUnits: 15, groupFrom: 10, groupPrice: 72, guidesFrom: 11, guideUnits: 2 };
const plain = { ...midi, groupFrom: null, groupPrice: null, guidesFrom: null, guideUnits: 0 };

describe("quad tour rules", () => {
  it("charges 80 € per quad below 10 and 72 € from 10", () => {
    expect(quadTourUnitPrice(midi, 9)).toBe(80);
    expect(quadTourUnitPrice(midi, 10)).toBe(72);
    expect(quadTourUnitPrice(midi, 15)).toBe(72);
    expect(quadTourUnitPrice(plain, 15)).toBe(80);
  });

  it("adds two guide quads from 11 customer quads", () => {
    expect(quadTourGuideUnits(midi, 10)).toBe(0);
    expect(quadTourGuideUnits(midi, 11)).toBe(2);
    expect(quadTourGuideUnits(plain, 15)).toBe(0);
  });

  it("caps customers at 15 and keeps room for the guides' quads", () => {
    expect(quadTourMaxUnits(midi, 20)).toBe(15);
    expect(quadTourMaxUnits(midi, 17)).toBe(15);
    expect(quadTourMaxUnits(midi, 16)).toBe(14);
    // 11 + 2 guides does not fit in 12, so the most is 10 (no guides needed).
    expect(quadTourMaxUnits(midi, 12)).toBe(10);
    expect(quadTourMaxUnits(midi, 4)).toBe(4);
    expect(quadTourMaxUnits(midi, 0)).toBe(0);
  });

  it("describes price and limits in Lithuanian", () => {
    expect(quadTourPriceLabel(midi)).toBe("80 € / keturračiui · nuo 10 keturr. 72 €");
    expect(quadTourPriceLabel(plain)).toBe("80 € / keturračiui");
    expect(quadTourLowestPrice(midi)).toBe(72);
    expect(quadTourUnitsNote(midi)).toBe("Bent 5, daugiausiai 15 keturračių. Nuo 11 keturračių kartu važiuoja 2 vedliai.");
  });
});
