import { describe, expect, it } from "vitest";
import { sortSales, type Sale } from "./sales";

const sale = (id: string, soldAt: string, over: Partial<Sale> = {}): Sale => ({
  id,
  category: "pirtis",
  soldOn: soldAt.slice(0, 10),
  soldAt,
  whenKey: "",
  item: id,
  when: "",
  customer: id,
  reference: id,
  total: 0,
  state: "galioja",
  source: "svetaine",
  statusLabel: "",
  target: { kind: "link", href: "/" },
  riderId: null,
  ...over,
});

describe("sortSales", () => {
  it("orders sales of one day by time, not by id", () => {
    const rows = [sale("e-1", "2026-11-18T12:57:00Z"), sale("b-1", "2026-11-18T14:54:00Z")];
    expect(sortSales(rows, { key: "soldAt", dir: "desc" }).map((s) => s.id)).toEqual(["b-1", "e-1"]);
    expect(sortSales(rows, { key: "soldAt", dir: "asc" }).map((s) => s.id)).toEqual(["e-1", "b-1"]);
  });

  it("sorts numbers numerically and text by Lithuanian collation", () => {
    const rows = [sale("a", "2026-11-18T10:00:00Z", { total: 100, customer: "Šarūnas" }), sale("b", "2026-11-18T09:00:00Z", { total: 20, customer: "Saulius" })];
    expect(sortSales(rows, { key: "total", dir: "asc" }).map((s) => s.id)).toEqual(["b", "a"]);
    expect(sortSales(rows, { key: "customer", dir: "asc" }).map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("keeps sales without a service date at the bottom either way", () => {
    const rows = [sale("none", "2026-11-18T10:00:00Z"), sale("dated", "2026-11-18T09:00:00Z", { whenKey: "2026-12-01 10" })];
    expect(sortSales(rows, { key: "when", dir: "asc" })[0].id).toBe("dated");
    expect(sortSales(rows, { key: "when", dir: "desc" })[0].id).toBe("dated");
  });
});
