import { describe, expect, it } from "vitest";
import { freeForRental, quadTakenFromRentals, rentalStartsOn, tourStartsOn, type QuadFleet } from "@/lib/admin/quad-availability";
import type { QuadRental } from "@/lib/admin/types";
import type { QuadSettings, QuadTourRoute, QuadType } from "@/lib/quads";

const type = (over: Partial<QuadType>): QuadType => ({ id: "a", name: "A", description: "", seats: 2, units: 6, pricePerHour: 30, active: true, ...over });
const settings = { openHour: 10, closeHour: 14, maxHours: 4, deposit: 0, minAge: 16, rules: "", tourCancellationNote: "" } as QuadSettings;
const route = { id: "mini", name: "Mini", kilometres: 20, hours: 2, durationLabel: "Iki 2 val.", price: 59, minUnits: 5, description: "", longDescription: "", photo: "", badge: null, active: true, sortOrder: 0 } as QuadTourRoute;
const rental = (over: Partial<QuadRental>) => ({ id: "r", reference: "KT-1", items: [{ quadTypeId: "a", units: 2 }], date: "2030-01-10", startHour: 10, hours: 2, units: 2, riders: 2, status: "patvirtinta", ...over }) as QuadRental;
const fleet = (rentals: QuadRental[], types = [type({})]): QuadFleet => ({ types, settings, rentals });

// A far-future day, so "hours already past today" never matters.
const DAY = "2030-01-10";

describe("quadTakenFromRentals", () => {
  it("adds up quads per type and hour, and ignores cancelled rentals", () => {
    const taken = quadTakenFromRentals([rental({}), rental({ id: "r2", startHour: 11, hours: 2, items: [{ quadTypeId: "a", units: 1 }] }), rental({ id: "r3", status: "atsaukta" })]);
    expect(taken[DAY].a).toEqual({ 10: 2, 11: 3, 12: 1 });
  });
});

describe("tourStartsOn", () => {
  it("offers only starts where the whole route has at least the minimum number of quads free", () => {
    const starts = tourStartsOn(DAY, route, fleet([rental({ items: [{ quadTypeId: "a", units: 2 }] })]));
    // 6 quads, 2 taken 10-12: 10 and 11 leave 4 / 4 (below 5); 12 has 6 free for 12-14.
    expect(starts).toEqual([{ hour: 12, free: 6 }]);
  });
  it("counts the whole fleet across types", () => {
    const starts = tourStartsOn(DAY, route, fleet([], [type({ units: 3 }), type({ id: "b", units: 3 })]));
    expect(starts.map((s) => [s.hour, s.free])).toEqual([[10, 6], [11, 6], [12, 6]]);
  });
});

describe("rentalStartsOn / freeForRental", () => {
  it("lists starts where the type stays free for the whole rental", () => {
    const f = fleet([rental({ startHour: 12, hours: 1, items: [{ quadTypeId: "a", units: 5 }] })]);
    expect(rentalStartsOn(DAY, type({}), 2, 2, f)).toEqual([10]);
    expect(rentalStartsOn(DAY, type({}), 1, 2, f)).toEqual([10, 11, 12]);
  });
  it("gives the least free quads over the rental's hours", () => {
    const f = fleet([rental({ startHour: 11, hours: 1, items: [{ quadTypeId: "a", units: 4 }] })]);
    expect(freeForRental(DAY, type({}), 10, 2, f)).toBe(2);
  });
});
