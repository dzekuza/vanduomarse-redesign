import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Row = Record<string, unknown> | null;

function query(result: { data?: unknown; error?: unknown } | { count: number }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    neq: () => builder,
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  return builder;
}

let codeRow: Row = null;
let uses: Record<string, number> = { bookings: 0, quad_rentals: 0, event_tickets: 0 };

const from = vi.fn((table: string) => {
  if (table === "discount_codes") return query({ data: codeRow, error: null });
  return query({ count: uses[table] ?? 0 });
});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from }) }));

import { applyStaffDiscountCode } from "@/lib/admin/discount-code";
import { todayKey } from "@/lib/sauna";

const ACTIVE_CODE = {
  id: "11111111-1111-4111-8111-111111111111",
  code: "WAKE10",
  kind: "procentai",
  value: 10,
  services: ["pirtis", "nakvyne"],
  active: true,
  valid_from: null,
  valid_until: null,
  max_uses: null,
};

beforeEach(() => {
  codeRow = null;
  uses = { bookings: 0, quad_rentals: 0, event_tickets: 0 };
  vi.clearAllMocks();
});

describe("applyStaffDiscountCode", () => {
  it("skips an empty code without reading the table", async () => {
    const result = await applyStaffDiscountCode("", "pirtis", 100);
    expect(result).toEqual({ ok: true, applied: null });
    expect(from).not.toHaveBeenCalled();
  });

  it("prices a percent code off the subtotal for a covered service", async () => {
    codeRow = ACTIVE_CODE;
    const result = await applyStaffDiscountCode("wake10", "pirtis", 100);
    expect(result).toEqual({ ok: true, applied: { id: ACTIVE_CODE.id, code: "WAKE10", amount: 10 } });
  });

  it("refuses a code that does not cover the service", async () => {
    codeRow = { ...ACTIVE_CODE, services: ["nakvyne"] };
    const result = await applyStaffDiscountCode("WAKE10", "pirtis", 100);
    expect(result).toEqual({ ok: false, message: "Toks galiojantis nuolaidos kodas nerastas." });
  });

  it("refuses an inactive code", async () => {
    codeRow = { ...ACTIVE_CODE, active: false };
    const result = await applyStaffDiscountCode("WAKE10", "pirtis", 100);
    expect(result.ok).toBe(false);
  });

  it("refuses a code outside its valid date range", async () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    codeRow = { ...ACTIVE_CODE, valid_from: future.toISOString().slice(0, 10) };
    const result = await applyStaffDiscountCode("WAKE10", "pirtis", 100);
    expect(result.ok).toBe(false);
    expect(todayKey() < (codeRow as { valid_from: string }).valid_from).toBe(true);
  });

  it("refuses a code that already hit its use limit", async () => {
    codeRow = { ...ACTIVE_CODE, max_uses: 2 };
    uses = { bookings: 1, quad_rentals: 1, event_tickets: 0 };
    const result = await applyStaffDiscountCode("WAKE10", "pirtis", 100);
    expect(result).toEqual({ ok: false, message: "Nuolaidos kodas jau išnaudotas." });
  });

  it("refuses a code that does not exist", async () => {
    codeRow = null;
    const result = await applyStaffDiscountCode("NOSUCHCODE", "pirtis", 100);
    expect(result.ok).toBe(false);
  });
});
