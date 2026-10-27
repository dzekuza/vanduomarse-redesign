/**
 * Optional extras sold with a private sauna booking. Stored in
 * `public.sauna_upsells` and managed in /admin/pirtis; the public booking
 * renders whatever is active there.
 */
export type UpsellUnit = "rezervacijai" | "asmeniui" | "vienetui" | "valandai";

export interface Upsell {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: UpsellUnit;
  /** For `vienetui`: max items (null = up to the group size). Other units are on/off. */
  maxQty: number | null;
  active: boolean;
}

export const UPSELL_UNIT_LABEL: Record<UpsellUnit, string> = {
  rezervacijai: "už rezervaciją",
  asmeniui: "asmeniui",
  vienetui: "už vienetą",
  valandai: "už valandą",
};

export const UPSELL_UNIT_SHORT: Record<UpsellUnit, string> = {
  rezervacijai: "€",
  asmeniui: "€/asm.",
  vienetui: "€/vnt.",
  valandai: "€/val.",
};

/** Items a counted upsell allows for this group. */
export function upsellMax(u: Upsell, partySize: number): number {
  return u.maxQty ?? partySize;
}

/** Line total. `qty` is the item count for `vienetui`, and 0/1 (off/on) otherwise. */
export function upsellTotal(u: Upsell, qty: number, ctx: { partySize: number; hours: number }): number {
  if (qty <= 0) return 0;
  switch (u.unit) {
    case "rezervacijai":
      return u.price;
    case "asmeniui":
      return u.price * ctx.partySize;
    case "valandai":
      return u.price * ctx.hours;
    case "vienetui":
      return u.price * qty;
  }
}

/** "Pirtininkas", "Beržinė vanta × 3" — for receipts and admin lists. */
export function upsellSummary(upsells: Upsell[], quantities: Record<string, number>): string[] {
  return upsells
    .filter((u) => (quantities[u.id] ?? 0) > 0)
    .map((u) => (u.unit === "vienetui" ? `${u.name} × ${quantities[u.id]}` : u.name));
}
