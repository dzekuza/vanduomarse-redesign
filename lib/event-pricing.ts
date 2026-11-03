import { MASTER_PRICE, sessionPrice } from "./sauna";

/**
 * Event price estimator, built from "Kainodara'26-'27.xlsx" (valid until 2027-12-31).
 * Every price includes 21% PVM. Where the sheet gives a range, we carry a
 * min-max range through to the total instead of inventing a single figure.
 */

export interface Money {
  min: number;
  max: number;
}

const fixed = (n: number): Money => ({ min: n, max: n });
const range = (min: number, max: number): Money => ({ min, max });
const add = (a: Money, b: Money): Money => ({ min: a.min + b.min, max: a.max + b.max });
const times = (m: Money, k: number): Money => ({ min: m.min * k, max: m.max * k });
const ZERO = fixed(0);

/** Weekday daytime (I-IV) vs evening or weekend: the sheet prices these differently. */
export type DayType = "weekday" | "weekend";

/* ---------- Spaces (sheet "Kainodara", section 1) ---------- */

export type SpaceId =
  | "terasa"
  | "kupolas-svente"
  | "kupolas-seminaras"
  | "kupolas-corona"
  | "corona"
  | "restoranas"
  | "parkas"
  | "parkas-wake";

export interface Space {
  id: SpaceId;
  label: string;
  blurb: string;
  maxGuests: number;
  includedTime: string;
  /** Space hire for the day type and head count; null = not offered then. */
  rent: (day: DayType, guests: number) => number | null;
  /** Food and drink spend the booking must reach. */
  minSpend: (day: DayType, guests: number) => number;
  /** Per extra hour (terrace) or overtime after 24:00; null = agreed individually. */
  extraHour: { label: string; rate: number } | null;
  serviceFee: Money;
  note?: string;
}

const TEAM_FEE = range(100, 350);
const OVERTIME = { label: "Viršvalandžiai po 24:00", rate: 150 };

function terraceMin(day: DayType, guests: number): number | null {
  if (guests <= 20) return day === "weekday" ? 600 : 700;
  if (guests <= 25) return day === "weekday" ? 900 : 1000;
  if (guests <= 30) return day === "weekday" ? 1100 : 1200;
  return null;
}

export const SPACES: Space[] = [
  {
    id: "terasa",
    label: "Įstiklinta terasa",
    blurb: "Šildoma terasa, staliukai, apšvietimas. Nuomos mokesčio nėra, tik minimali sąskaita.",
    maxGuests: 30,
    includedTime: "3 val.",
    rent: (day, g) => (terraceMin(day, g) === null ? null : 0),
    minSpend: (day, g) => terraceMin(day, g) ?? 0,
    extraHour: { label: "Papildoma valanda", rate: 150 },
    serviceFee: TEAM_FEE,
  },
  {
    id: "kupolas-svente",
    label: "Kupolas: šventė",
    blurb: "Šildomas kupolas, scena, garso ir šviesos pajungimai, DJ vieta.",
    maxGuests: 250,
    includedTime: "Šventinis vakaras",
    rent: () => 700,
    minSpend: () => 0,
    extraHour: OVERTIME,
    serviceFee: TEAM_FEE,
  },
  {
    id: "kupolas-seminaras",
    label: "Kupolas: seminaras",
    blurb: "Konferencinis išdėstymas, ekranas, įgarsinimas. I–V, 9:00–15:00.",
    maxGuests: 250,
    includedTime: "Iki 6 val.",
    rent: (day) => (day === "weekday" ? 363 : null),
    minSpend: () => 0,
    extraHour: null,
    serviceFee: TEAM_FEE,
  },
  {
    id: "kupolas-corona",
    label: "Kupolas + „Corona“",
    blurb: "Kupolas, baseino zona, lauko baras, WC, DJ erdvė. Populiariausias vestuvių paketas.",
    maxGuests: 500,
    includedTime: "Šventinis vakaras",
    rent: () => 1900,
    minSpend: () => 1500,
    extraHour: OVERTIME,
    serviceFee: TEAM_FEE,
  },
  {
    id: "corona",
    label: "„Corona“ su baseinu",
    blurb: "Privatus baseinas, atskiras baras, minkštasuoliai, DJ zona. Visiškas privatumas.",
    maxGuests: 250,
    includedTime: "Renginio trukmė",
    rent: () => 1200,
    minSpend: () => 1500,
    extraHour: OVERTIME,
    serviceFee: TEAM_FEE,
  },
  {
    id: "restoranas",
    label: "Restoranas + terasa",
    blurb: "Vidaus salė ir šildoma terasa, baldai, aptarnavimas.",
    maxGuests: 45,
    includedTime: "4 val.",
    rent: () => 500,
    minSpend: () => 1500,
    extraHour: OVERTIME,
    serviceFee: TEAM_FEE,
    note: "Privačiai nuomojamas tik spalio–gegužės mėn.",
  },
  {
    id: "parkas",
    label: "Visas parkas (be WAKE)",
    blurb: "Visos erdvės, scena ir teritorija be vandenlenčių trasos.",
    maxGuests: 500,
    includedTime: "Visa diena",
    rent: (day) => (day === "weekday" ? 6000 : 7000),
    minSpend: () => 0,
    extraHour: OVERTIME,
    serviceFee: fixed(350),
    note: "Maitinimas pagal individualią sąmatą.",
  },
  {
    id: "parkas-wake",
    label: "Visas parkas su WAKE",
    blurb: "Visos erdvės ir neribotas vandenlenčių parkas su instruktoriais ir įranga.",
    maxGuests: 500,
    includedTime: "Visa diena",
    rent: (day) => (day === "weekday" ? 9000 : 10000),
    minSpend: () => 0,
    extraHour: OVERTIME,
    serviceFee: TEAM_FEE,
    note: "Maitinimas pagal individualią sąmatą.",
  },
];

/* ---------- Catering and drinks (sheets "Maitinimo meniu", "Gėrimų meniu") ---------- */

export type CateringId = "none" | "bufetas-20" | "bufetas-25" | "bufetas-30" | "bufetas-35" | "marmitai";

export const CATERING: { id: CateringId; label: string; hint: string; perAdult: number }[] = [
  { id: "none", label: "Be maitinimo", hint: "Arba užsakysite vietoje", perAdult: 0 },
  { id: "bufetas-20", label: "Švediškas stalas", hint: "2 karštieji · 20 €/asm.", perAdult: 20 },
  { id: "bufetas-25", label: "Švediškas stalas", hint: "2 karštieji · 25 €/asm.", perAdult: 25 },
  { id: "bufetas-30", label: "Švediškas stalas", hint: "3 karštieji · 30 €/asm.", perAdult: 30 },
  { id: "bufetas-35", label: "Švediškas stalas", hint: "3 karštieji · 35 €/asm.", perAdult: 35 },
  { id: "marmitai", label: "Pietūs marmituose", hint: "Furšetui · 12 €/asm.", perAdult: 12 },
];

export const BUFFET_MIN_GUESTS = 20;
export const COFFEE_BREAK = range(5, 8);

export type DrinkId = "keg" | "wine" | "sparkling" | "cocktail" | "juice";

export const DRINKS: { id: DrinkId; label: string; price: Money }[] = [
  { id: "keg", label: "Alaus statinė 30 l", price: range(351, 424) },
  { id: "wine", label: "Namų vynas, butelis", price: range(29, 33) },
  { id: "sparkling", label: "Putojantis vynas, butelis", price: range(33, 42) },
  { id: "cocktail", label: "Kokteilis", price: range(8, 11) },
  { id: "juice", label: "Sultys, grafinas", price: fixed(12) },
];

/* ---------- Services (sheet section 2 and contract terms) ---------- */

export const PRICES = {
  bartender: 120,
  decor: range(150, 250),
  serving: 7,
  /** Sheet conflict: +100 € on the sauna rows, 200 € in the contract terms. */
  saunaMaster: range(MASTER_PRICE, 200),
  wakePrivate: 1694,
  wakeRider: 20,
  atvTour: 72,
  atvMinRiders: 10,
  cabinNight: range(50, 60),
  cabinBeds: 40,
} as const;

/* ---------- Event presets (sheet section 3) ---------- */

export type PresetId =
  | "vestuves"
  | "vestuves-kamerines"
  | "krikstynos"
  | "gimtadienis"
  | "teambuilding"
  | "imones-svente"
  | "konferencija"
  | "bernvakaris";

export interface EventPreset {
  id: PresetId;
  label: string;
  perGuest: Money;
  apply: Partial<EstimateInput>;
}

export const PRESETS: EventPreset[] = [
  { id: "vestuves", label: "Vestuvės", perGuest: range(55, 95), apply: { space: "kupolas-corona", adults: 120, catering: "bufetas-30", day: "weekend", decor: true } },
  { id: "vestuves-kamerines", label: "Kamerinės vestuvės", perGuest: range(45, 70), apply: { space: "terasa", adults: 30, catering: "bufetas-30", day: "weekend", serving: true, decor: true } },
  { id: "krikstynos", label: "Krikštynos", perGuest: range(25, 45), apply: { space: "terasa", adults: 20, kids: 5, catering: "bufetas-20", day: "weekday" } },
  { id: "gimtadienis", label: "Gimtadienis", perGuest: range(35, 65), apply: { space: "terasa", adults: 25, catering: "bufetas-25", day: "weekend", bartenders: 1 } },
  { id: "teambuilding", label: "Komandos diena", perGuest: range(45, 85), apply: { space: "kupolas-seminaras", adults: 40, catering: "marmitai", day: "weekday", coffeeBreak: true, wakePrivate: true, saunaHours: 2 } },
  { id: "imones-svente", label: "Įmonės šventė", perGuest: range(60, 120), apply: { space: "parkas-wake", adults: 300, catering: "bufetas-35", day: "weekend" } },
  { id: "konferencija", label: "Konferencija", perGuest: range(15, 35), apply: { space: "kupolas-seminaras", adults: 60, catering: "marmitai", day: "weekday", coffeeBreak: true } },
  { id: "bernvakaris", label: "Bernvakaris / mergvakaris", perGuest: range(153, 238), apply: { space: "terasa", adults: 15, catering: "none", day: "weekend", saunaHours: 3, atvRiders: 15, cabinGuests: 15, cabinNights: 1 } },
];

/* ---------- Estimate ---------- */

export interface EstimateInput {
  preset: PresetId | null;
  /** yyyy-mm-dd of the event, null until chosen. */
  date: string | null;
  /** null until the visitor picks one: nothing is preselected. */
  space: SpaceId | null;
  day: DayType | null;
  adults: number;
  /** Children 3-10 y.: 50% of the buffet price; under 3 eat free and are not counted. */
  kids: number;
  extraHours: number;
  /** null = not chosen yet; "none" is the explicit "Be maitinimo". */
  catering: CateringId | null;
  coffeeBreak: boolean;
  drinks: Record<DrinkId, number>;
  bartenders: number;
  decor: boolean;
  serving: boolean;
  saunaHours: number;
  saunaMaster: boolean;
  wakePrivate: boolean;
  wakeRiders: number;
  atvRiders: number;
  cabinGuests: number;
  cabinNights: number;
}

export const DEFAULT_INPUT: EstimateInput = {
  preset: null,
  date: null,
  space: null,
  day: null,
  adults: 20,
  kids: 0,
  extraHours: 0,
  catering: null,
  coffeeBreak: false,
  drinks: { keg: 0, wine: 0, sparkling: 0, cocktail: 0, juice: 0 },
  bartenders: 0,
  decor: false,
  serving: false,
  saunaHours: 0,
  saunaMaster: false,
  wakePrivate: false,
  wakeRiders: 0,
  atvRiders: 0,
  cabinGuests: 0,
  cabinNights: 1,
};

/** Mon-Thu are workdays (daytime rates); Fri-Sun are the evening / weekend rates. */
export function dayTypeOf(isoDate: string): DayType {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow >= 1 && dow <= 4 ? "weekday" : "weekend";
}

export interface EstimateLine {
  group: "Erdvė" | "Maistas ir gėrimai" | "Paslaugos" | "Pramogos" | "Nakvynė";
  label: string;
  amount: Money;
}

export interface Estimate {
  lines: EstimateLine[];
  total: Money;
  perGuest: Money | null;
  /** Food and drink still to be ordered to reach the space's minimum bill. */
  minSpendGap: Money;
  warnings: string[];
  available: boolean;
}


export function estimate(input: EstimateInput): Estimate {
  const space = input.space ? SPACES.find((s) => s.id === input.space)! : null;
  const guests = input.adults + input.kids;
  const lines: EstimateLine[] = [];
  const warnings: string[] = [];
  const push = (group: EstimateLine["group"], label: string, amount: Money) => {
    if (amount.max > 0) lines.push({ group, label, amount });
  };

  // Space
  const rent = space && input.day ? space.rent(input.day, guests) : null;
  const available = space !== null && rent !== null && guests <= space.maxGuests;
  if (space) {
    if (!input.day) warnings.push("Pasirink, kada vyks renginys (darbo diena ar vakaras / savaitgalis): nuo to priklauso erdvės kaina.");
    if (guests > space.maxGuests) warnings.push(`${space.label}: daugiausia ${space.maxGuests} svečių.`);
    if (input.day && rent === null && guests <= space.maxGuests)
      warnings.push(input.space === "kupolas-seminaras" ? "Seminarams kupolas nuomojamas tik darbo dienomis." : `${space.label}: šiai datai netaikoma.`);
    push("Erdvė", `${space.label} (${space.includedTime})`, fixed(rent ?? 0));
    if (space.extraHour && input.extraHours > 0)
      push("Erdvė", `${space.extraHour.label} × ${input.extraHours}`, fixed(space.extraHour.rate * input.extraHours));
    if (space.note) warnings.push(space.note);
  }

  // Food and drink
  const cat = input.catering ? CATERING.find((c) => c.id === input.catering)! : null;
  let fnb = ZERO;
  if (cat && cat.perAdult > 0) {
    const kidsShare = cat.id.startsWith("bufetas") ? 0.5 : 1;
    const food = fixed(cat.perAdult * input.adults + cat.perAdult * kidsShare * input.kids);
    push("Maistas ir gėrimai", `${cat.label}, ${cat.hint.split(" · ").pop()}`, food);
    fnb = add(fnb, food);
    if (cat.id.startsWith("bufetas") && guests < BUFFET_MIN_GUESTS)
      warnings.push(`Švediškas stalas užsakomas nuo ${BUFFET_MIN_GUESTS} asm.`);
  }
  if (input.coffeeBreak) {
    const coffee = times(COFFEE_BREAK, guests);
    push("Maistas ir gėrimai", "Kavos pertrauka", coffee);
    fnb = add(fnb, coffee);
  }
  for (const d of DRINKS) {
    const qty = input.drinks[d.id];
    if (qty > 0) {
      const amount = times(d.price, qty);
      push("Maistas ir gėrimai", `${d.label} × ${qty}`, amount);
      fnb = add(fnb, amount);
    }
  }
  const minSpend = space && input.day ? space.minSpend(input.day, guests) : 0;
  const minSpendGap = range(Math.max(0, minSpend - fnb.max), Math.max(0, minSpend - fnb.min));
  push("Maistas ir gėrimai", `Iki minimalios sąskaitos (${minSpend} €)`, minSpendGap);

  // Services
  if (space) push("Paslaugos", "Aptarnavimo mokestis", space.serviceFee);
  if (input.bartenders > 0) push("Paslaugos", `Barmenai × ${input.bartenders}`, fixed(PRICES.bartender * input.bartenders));
  if (input.decor) push("Paslaugos", "Šventinis stalo dekoravimas", PRICES.decor);
  if (input.serving) push("Paslaugos", "Stalų serviravimas", fixed(PRICES.serving * guests));

  // Activities
  if (input.saunaHours > 0) {
    push("Pramogos", `Pirtis, ${Math.max(2, input.saunaHours)} val.`, fixed(sessionPrice(input.saunaHours, guests)));
    if (guests > 20) warnings.push("Pirtyje vienu metu telpa iki 20 asm., didesnė grupė keičiasi.");
    if (input.saunaMaster) push("Pramogos", "Pirtininkas", PRICES.saunaMaster);
  }
  if (input.wakePrivate) push("Pramogos", "Privati WAKE trasa, 2 val.", fixed(PRICES.wakePrivate));
  if (input.wakeRiders > 0) push("Pramogos", `WAKE plaukimas × ${input.wakeRiders}`, fixed(PRICES.wakeRider * input.wakeRiders));
  if (input.atvRiders > 0) {
    push("Pramogos", `Keturračių turas × ${input.atvRiders}`, fixed(PRICES.atvTour * input.atvRiders));
    if (input.atvRiders < PRICES.atvMinRiders) warnings.push(`Keturračių turas – nuo ${PRICES.atvMinRiders} asm.`);
  }

  // Stay
  if (input.cabinGuests > 0) {
    push("Nakvynė", `Nameliai: ${input.cabinGuests} asm. × ${input.cabinNights} n.`, times(PRICES.cabinNight, input.cabinGuests * input.cabinNights));
    if (input.cabinGuests > PRICES.cabinBeds) warnings.push(`Nameliuose telpa ${PRICES.cabinBeds} svečiai.`);
  }

  const total = lines.reduce((sum, l) => add(sum, l.amount), ZERO);
  const perGuest = guests > 0 && total.max > 0 ? range(Math.round(total.min / guests), Math.round(total.max / guests)) : null;
  return { lines, total, perGuest, minSpendGap, warnings, available };
}

export function formatMoney(m: Money): string {
  const f = (n: number) => `${Math.round(n).toLocaleString("lt-LT")} €`;
  return m.min === m.max ? f(m.min) : `${Math.round(m.min).toLocaleString("lt-LT")}–${f(m.max)}`;
}
