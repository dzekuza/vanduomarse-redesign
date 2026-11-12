/**
 * Sauna programs: the named experiences of /rezervacija (Bendra pirtis, Visa šeima,
 * Pirtis tik jūsų kompanijai, ...). Rows of `public.sauna_programs`, edited in
 * /admin/pirtis. Sessions are scheduled as events (`events.program_id`); private
 * programs book a sauna at a flat price. Prices live only in the table.
 */
export type ProgramKind = "session" | "private";
export type ProgramPricing = "person" | "family" | "group";

export interface SaunaProgram {
  id: string;
  name: string;
  /** Small uppercase line on the card, e.g. "Su pirtininku". */
  label: string;
  description: string;
  kind: ProgramKind;
  pricing: ProgramPricing;
  /** Per person, per adult (family) or per group; EUR incl. 21% PVM. */
  price: number;
  /** Per child, family pricing only. */
  childPrice: number | null;
  durationMinutes: number;
  /** Private programs: most people. */
  capacity: number | null;
  /** Private programs: the sauna they occupy. */
  saunaId: string | null;
  active: boolean;
  sortOrder: number;
}

export const PROGRAM_KIND_LABEL: Record<ProgramKind, string> = {
  session: "Seansas (pagal tvarkaraštį)",
  private: "Privati (visa pirtis grupei)",
};

export const PROGRAM_PRICING_LABEL: Record<ProgramPricing, string> = {
  person: "Už asmenį",
  family: "Suaugusiajam ir vaikui",
  group: "Už visą grupę",
};

/** "2,5 val." / "3 val." */
export function durationLabel(minutes: number): string {
  return `${String(minutes / 60).replace(".", ",")} val.`;
}

const money = (n: number) => `${String(n).replace(".", ",")} €`;

/** The price alone: "20 € / asm.", "15 € / suaug. · 5 € / vaikui", "200 € / grupei". */
export function programRateLine(p: Pick<SaunaProgram, "pricing" | "price" | "childPrice">): string {
  const unit = p.pricing === "person" ? `${money(p.price)} / asm.` : p.pricing === "group" ? `${money(p.price)} / grupei` : `${money(p.price)} / suaug.`;
  const child = p.pricing === "family" && p.childPrice !== null ? ` · ${money(p.childPrice)} / vaikui` : "";
  return `${unit}${child}`;
}

/** Price and length on one line. */
export function programPriceLine(p: Pick<SaunaProgram, "pricing" | "price" | "childPrice" | "durationMinutes">): string {
  return `${programRateLine(p)} · ${durationLabel(p.durationMinutes)}`;
}

/** What a group pays; the database computes the same on submit. */
export function programTotal(p: Pick<SaunaProgram, "pricing" | "price" | "childPrice">, adults: number, children: number): number {
  if (p.pricing === "group") return p.price;
  return adults * p.price + children * (p.childPrice ?? p.price);
}

/** The public session price for a party with at least one adult. */
export function sessionPartyPrice(pricePerPerson: number, program: SaunaProgram | null, people: number, childCount: number) {
  const children = program?.pricing === "family" ? Math.max(0, Math.min(childCount, people - 1)) : 0;
  const adults = people - children;
  return {
    adults,
    children,
    price: program ? programTotal(program, adults, children) : pricePerPerson * adults,
  };
}
