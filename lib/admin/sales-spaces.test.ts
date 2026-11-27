import { describe, expect, it } from "vitest";
import { buildSales, filterSales, salesRevenue, type SaleFilters } from "./sales";
import type { SpaceBooking } from "./types";

const hire = (over: Partial<SpaceBooking>): SpaceBooking => ({
  id: "h1",
  date: "2026-12-12",
  endDate: "2026-12-12",
  startTime: "18:00",
  endTime: "23:00",
  spaces: ["kupolas-svente"],
  customer: { name: "Ona", surname: "Onaitė", phone: "+37060000000", email: "" },
  guests: 80,
  price: 800,
  status: "patvirtinta",
  note: "",
  createdAt: "2026-11-26T10:00:00Z",
  ...over,
});

const empty = { bookings: [], stayTypes: [], quadRentals: [], quadTypes: [], tourTickets: [], eventTickets: [], events: [], coupons: [], purchases: [], riders: [] };
const all: SaleFilters = { category: "visos", state: "galiojancios", origin: "visi", from: "", to: "", query: "" };

describe("space hires in sales", () => {
  const sales = buildSales({
    ...empty,
    spaceBookings: [hire({}), hire({ id: "h2", status: "atsaukta", price: 500 })],
    spaces: [{ id: "kupolas-svente", label: "Kupolas: šventė", blurb: "", maxGuests: 250, priceWeekday: 700, priceWeekend: 700, wholePark: false, active: true, sortOrder: 0 }],
  });

  it("lists each hire under Erdvės as an admin sale named after its spaces", () => {
    const [s] = sales.filter((x) => x.id === "s-h1");
    expect(s).toMatchObject({ category: "erdves", item: "Kupolas: šventė", total: 800, customer: "Ona Onaitė", source: "telefonu", soldOn: "2026-11-26" });
  });

  it("counts valid hires in revenue and the Erdvės tab", () => {
    expect(salesRevenue(filterSales(sales, all))).toBe(800);
    expect(filterSales(sales, { ...all, category: "erdves" })).toHaveLength(1);
    expect(filterSales(sales, { ...all, category: "pirtis" })).toHaveLength(0);
  });
});
