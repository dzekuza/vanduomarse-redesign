import { stayTypesOf, type StayType } from "./cabin";
import { sessionPrice, type Sauna } from "./sauna";
import { durationLabel, programTotal, type SaunaProgram } from "./sauna-programs";
import { upsellTotal, type Upsell } from "./sauna-upsells";

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
export type EventTime = "daytime" | "evening";

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
  /** Rent per day when the event is a camp (stovykla); replaces `rent` for that space. */
  campRent?: number;
  /** "nuo" price headline on the calculator card when it should differ from the rent (the owner's wording); the estimate still uses `rent` and `minSpend`. */
  cardFrom?: number;
}

/** What the calculator offers to pick: four venues that can be combined (rents add up), and the whole park, which excludes them. */
export interface Venue {
  id: string;
  label: string;
  /** The priced spaces behind the venue; more than one means a variant the visitor switches between. */
  spaces: readonly SpaceId[];
}

export const VENUES: readonly Venue[] = [
  { id: "kupolas", label: "Kupolas", spaces: ["kupolas-svente", "kupolas-seminaras"] },
  { id: "terasa", label: "Įstiklinta terasa", spaces: ["terasa"] },
  { id: "corona", label: "Lauko terasa su baseinu", spaces: ["corona"] },
  { id: "restoranas", label: "Restoranas + terasa", spaces: ["restoranas"] },
];

/** Whole-park hire (without or with WAKE); it replaces every single venue. */
export const WHOLE_PARK: Venue = { id: "parkas", label: "Visas parkas", spaces: ["parkas", "parkas-wake"] };

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
    blurb: "Šildomas kupolas su scena ir vieta didžėjui.",
    maxGuests: 250,
    includedTime: "Šventinis vakaras",
    rent: () => 700,
    minSpend: () => 0,
    extraHour: OVERTIME,
    serviceFee: TEAM_FEE,
    campRent: 100,
  },
  {
    id: "kupolas-seminaras",
    label: "Kupolas: seminaras",
    blurb: "Konferencinis išdėstymas. I–V, 9:00–15:00.",
    maxGuests: 250,
    includedTime: "Iki 6 val.",
    rent: (day) => (day === "weekday" ? 363 : null),
    minSpend: () => 0,
    extraHour: null,
    serviceFee: TEAM_FEE,
    campRent: 100,
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
    label: "Lauko terasa su baseinu („Corona“)",
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
    cardFrom: 1500,
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

export const BUFFET_OPTIONS = ([
  { id: "bufetas-20", perAdult: 20, hotDishes: 2 },
  { id: "bufetas-25", perAdult: 25, hotDishes: 2 },
  { id: "bufetas-30", perAdult: 30, hotDishes: 3 },
  { id: "bufetas-35", perAdult: 35, hotDishes: 3 },
] as const).map((option) => ({
  ...option,
  label: "Švediškas stalas",
  hint: `${option.hotDishes} karštieji · ${option.perAdult} €/asm.`,
}));

export const CATERING: { id: CateringId; label: string; hint: string; perAdult: number }[] = [
  { id: "none", label: "Be maitinimo", hint: "Arba užsakysite vietoje", perAdult: 0 },
  ...BUFFET_OPTIONS,
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
  wakePrivate: 1694,
  wakeRider: 20,
  atvTour: 72,
  atvMinRiders: 10,
} as const;

/** Camp (stovykla) meals, per person; breakfast includes water, coffee and tea (juice is extra). */
export type CampMealId = "breakfast" | "lunch" | "dinner";

export const CAMP_MEALS: readonly { id: CampMealId; label: string; price: number; hint?: string }[] = [
  { id: "breakfast", label: "Pusryčiai", price: 15, hint: "su gėrimais (vanduo, kava, arbata), sultys papildomai" },
  { id: "lunch", label: "Pietūs", price: 15 },
  { id: "dinner", label: "Vakarienė", price: 18 },
];

/** Things a camp can include besides the priced parts (sauna, quads, meals); the price is agreed with the team. */
export const CAMP_ACTIVITIES = [
  { id: "film", label: "Filmų vakaras" },
  { id: "yoga", label: "Joga" },
  { id: "table-tennis", label: "Stalo tenisas" },
  { id: "breathing", label: "Kvėpavimo seansas" },
  { id: "gongs", label: "Gongai" },
  { id: "other", label: "Kita veikla (parašysi komentare)" },
] as const;

export type CampActivityId = (typeof CAMP_ACTIVITIES)[number]["id"];

/** Days of a weekend camp on which the sauna is booked. */
export type CampDay = "sat" | "sun";

export const CAMP_DAY_LABEL: Record<CampDay, string> = { sat: "Šeštadienis", sun: "Sekmadienis" };

/** The usual Friday evening to Sunday morning stay: Fri dinner, Sat breakfast, lunch and dinner, Sun breakfast. */
export const CAMP_WEEKEND_MEALS: Record<CampMealId, number> = { breakfast: 2, lunch: 1, dinner: 2 };

/* ---------- Event presets (sheet section 3) ---------- */

export type PresetId =
  | "vestuves"
  | "vestuves-kamerines"
  | "krikstynos"
  | "gimtadienis"
  | "teambuilding"
  | "imones-svente"
  | "konferencija"
  | "bernvakaris"
  | "stovykla";

export interface EventPreset {
  id: PresetId;
  label: string;
  /** Typical price per guest from the sheet; null when there is none (camps are priced by their parts). */
  perGuest: Money | null;
  /** Only the typical group size: venue, day, catering and services are always the visitor's own choice. */
  apply: Pick<Partial<EstimateInput>, "adults" | "kids">;
}

export const PRESETS: EventPreset[] = [
  { id: "stovykla", label: "Stovykla", perGuest: null, apply: { adults: 30 } },
  { id: "vestuves", label: "Vestuvės", perGuest: range(55, 95), apply: { adults: 120 } },
  { id: "vestuves-kamerines", label: "Kamerinės vestuvės", perGuest: range(45, 70), apply: { adults: 30 } },
  { id: "krikstynos", label: "Krikštynos", perGuest: range(25, 45), apply: { adults: 20, kids: 5 } },
  { id: "gimtadienis", label: "Gimtadienis", perGuest: range(35, 65), apply: { adults: 25 } },
  { id: "teambuilding", label: "Komandos diena", perGuest: range(45, 85), apply: { adults: 40 } },
  { id: "imones-svente", label: "Įmonės šventė", perGuest: range(60, 120), apply: { adults: 300 } },
  { id: "konferencija", label: "Konferencija", perGuest: range(15, 35), apply: { adults: 60 } },
  { id: "bernvakaris", label: "Bernvakaris / mergvakaris", perGuest: range(153, 238), apply: { adults: 15 } },
];

/* ---------- Estimate ---------- */

/** One sauna in the quote: session length, start hour (null until chosen) and the Pirtininkas add-on. */
export interface SaunaPick {
  hours: number;
  startHour: number | null;
  /** Extras (priedai) from `sauna_upsells`: upsell id -> item count, or 1 for an on / off extra. */
  extras: Record<string, number>;
  /** A private program of this sauna (flat price and length) instead of hourly rates; null = by the hour. */
  programId: string | null;
}

/** Whole hours a private program blocks (a 2.5 h program holds 3). */
export const programHours = (program: Pick<SaunaProgram, "durationMinutes">) => Math.ceil(program.durationMinutes / 60);

/** Live prices the estimate needs from the database: cabin sizes (`stay_types`) and the active saunas. */
export interface CalculatorCatalog {
  stayTypes: readonly StayType[];
  saunas: readonly Sauna[];
  /** Active private programs; each belongs to one sauna (`saunaId`). */
  programs: readonly SaunaProgram[];
  /** Active extras; each sauna offers the ones in its `upsellIds`. */
  upsells: readonly Upsell[];
}

export const EMPTY_CATALOG: CalculatorCatalog = { stayTypes: [], saunas: [], programs: [], upsells: [] };

export interface EstimateInput {
  preset: PresetId | null;
  /** yyyy-mm-dd of the event, null until chosen. */
  date: string | null;
  /** yyyy-mm-dd of the last day of a multi-day event; null for a single day. Camp days and cabin nights follow it. */
  endDate: string | null;
  /** Spaces hired together (empty until the visitor picks): rents add up, the minimum bill is the highest one and one service fee applies. */
  spaces: SpaceId[];
  day: DayType | null;
  eventTime?: EventTime | null;
  adults: number;
  /** Children 3-10 y.: 50% of the buffet price; under 3 eat free and are not counted. */
  kids: number;
  extraHours: number;
  /** Days of a camp (preset "stovykla"): the dome is charged per day. */
  campDays: number;
  /** Camp meals over the whole stay, by kind; each is priced per guest. */
  campMeals: Record<CampMealId, number>;
  /** Activities the camp wants (priced by agreement). */
  campActivities: CampActivityId[];
  /** Camp days with the sauna; the sauna price is charged once per day (one when none is ticked). */
  campSaunaDays: CampDay[];
  /** null = not chosen yet; "none" is the explicit "Be maitinimo". */
  catering: CateringId | null;
  coffeeBreak: boolean;
  drinks: Record<DrinkId, number>;
  bartenders: number;
  decor: boolean;
  serving: boolean;
  /** Saunas picked for the event, by sauna id; a sauna with a start hour is held when staff accept the inquiry. */
  saunas: Record<string, SaunaPick>;
  wakePrivate: boolean;
  wakeRiders: number;
  atvRiders: number;
  /** Cabins wanted per stay type id. */
  cabinUnits: Record<string, number>;
  cabinNights: number;
}

export const DEFAULT_INPUT: EstimateInput = {
  preset: null,
  date: null,
  endDate: null,
  spaces: [],
  day: null,
  adults: 20,
  kids: 0,
  extraHours: 0,
  campDays: 1,
  campMeals: { breakfast: 0, lunch: 0, dinner: 0 },
  campActivities: [],
  campSaunaDays: [],
  catering: null,
  coffeeBreak: false,
  drinks: { keg: 0, wine: 0, sparkling: 0, cocktail: 0, juice: 0 },
  bartenders: 0,
  decor: false,
  serving: false,
  saunas: {},
  wakePrivate: false,
  wakeRiders: 0,
  atvRiders: 0,
  cabinUnits: {},
  cabinNights: 1,
};

/** Mon–Thu daytime uses workday rates; evenings and Fri–Sun use the other rate. */
export function dayTypeOf(isoDate: string, time: EventTime = "daytime"): DayType {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return time === "daytime" && dow >= 1 && dow <= 4 ? "weekday" : "weekend";
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
  /** Plain remarks shown with the estimate, e.g. the activities whose price is agreed. */
  notes: string[];
  available: boolean;
}


/** `catalog` supplies the cabin and sauna prices (they live in `public.stay_types` and `public.saunas`). */
export function estimate(input: EstimateInput, { stayTypes, saunas, programs, upsells }: CalculatorCatalog = EMPTY_CATALOG): Estimate {
  const spaces = SPACES.filter((s) => input.spaces.includes(s.id));
  const guests = input.adults + input.kids;
  const lines: EstimateLine[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];
  const push = (group: EstimateLine["group"], label: string, amount: Money) => {
    if (amount.max > 0) lines.push({ group, label, amount });
  };

  // Spaces: each one's rent is a line and the rents add up (Kupolas + Corona is 700 + 1200, as in the sheet).
  // Before the date is chosen the rent is a range over both kinds of day, matching the "nuo" price on the venue cards.
  const dayTypes: DayType[] = input.day ? [input.day] : ["weekday", "weekend"];
  const camp = input.preset === "stovykla";
  const campDays = Math.max(1, input.campDays);
  const rents = spaces.map((space) => {
    if (camp && space.campRent !== undefined) return fixed(space.campRent * campDays);
    const values = dayTypes.map((day) => space.rent(day, guests)).filter((rent): rent is number => rent !== null);
    return values.length ? range(Math.min(...values), Math.max(...values)) : null;
  });
  const available = input.day !== null && spaces.length > 0 && rents.every((rent) => rent !== null) && spaces.every((space) => guests <= space.maxGuests);
  if (spaces.length > 0 && !input.day) warnings.push("Pasirink renginio datą ir laiką, kad matytum tikslią erdvės kainą.");
  spaces.forEach((space, i) => {
    const rent = rents[i];
    if (guests > space.maxGuests) warnings.push(`${space.label}: daugiausia ${space.maxGuests} asmenų.`);
    if (input.day && rent === null && guests <= space.maxGuests)
      warnings.push(space.id === "kupolas-seminaras" ? "Seminarams kupolas nuomojamas tik darbo dienomis." : `${space.label}: šiai datai netaikoma.`);
    const campRate = camp && space.campRent !== undefined;
    push("Erdvė", campRate ? `${space.label} (stovykla, ${campDays} d. × ${space.campRent} €)` : `${space.label} (${space.includedTime})`, rent ?? ZERO);
    if (space.note) warnings.push(space.note);
  });
  const extraHour = spaces.find((space) => space.extraHour)?.extraHour;
  if (extraHour && input.extraHours > 0) push("Erdvė", `${extraHour.label} × ${input.extraHours}`, fixed(extraHour.rate * input.extraHours));

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
  if (camp) {
    for (const meal of CAMP_MEALS) {
      const count = input.campMeals[meal.id];
      if (count <= 0) continue;
      const amount = fixed(meal.price * count * guests);
      push("Maistas ir gėrimai", `${meal.label} × ${count} (${guests} asm.)`, amount);
      fnb = add(fnb, amount);
    }
  }
  if (input.coffeeBreak && !camp) {
    const coffee = times(COFFEE_BREAK, guests);
    push("Maistas ir gėrimai", "Kavos pertrauka", coffee);
    fnb = add(fnb, coffee);
  }
  for (const d of camp ? [] : DRINKS) {
    const qty = input.drinks[d.id];
    if (qty > 0) {
      const amount = times(d.price, qty);
      push("Maistas ir gėrimai", `${d.label} × ${qty}`, amount);
      fnb = add(fnb, amount);
    }
  }
  const minSpend = Math.max(0, ...spaces.flatMap((space) => dayTypes.map((day) => space.minSpend(day, guests))));
  const minSpendGap = range(Math.max(0, minSpend - fnb.max), Math.max(0, minSpend - fnb.min));
  push("Maistas ir gėrimai", `Iki minimalios sąskaitos (${minSpend} €)`, minSpendGap);

  // Services
  if (spaces.length > 0 && !camp) push("Paslaugos", "Aptarnavimo mokestis", spaces.reduce((fee, space) => (space.serviceFee.max > fee.max ? space.serviceFee : fee), spaces[0].serviceFee));
  if (input.bartenders > 0 && !camp) push("Paslaugos", `Barmenai × ${input.bartenders}`, fixed(PRICES.bartender * input.bartenders));
  if (input.decor && !camp) push("Paslaugos", "Šventinis stalo dekoravimas", PRICES.decor);
  if (input.serving && !camp) push("Paslaugos", "Stalų serviravimas", fixed(PRICES.serving * guests));

  // Activities
  const saunaDays = camp ? Math.max(1, input.campSaunaDays.length) : 1;
  const perDay = saunaDays > 1 ? ` × ${saunaDays} d.` : "";
  for (const sauna of saunas) {
    const pick = input.saunas[sauna.id];
    if (!pick || pick.hours <= 0) continue;
    const program = pick.programId ? programs.find((p) => p.id === pick.programId && p.saunaId === sauna.id) : undefined;
    if (program) {
      push("Pramogos", `${sauna.name}: ${program.name}, ${durationLabel(program.durationMinutes)}${perDay}`, fixed(programTotal(program, guests, 0) * saunaDays));
    } else {
      push("Pramogos", `${sauna.name}, ${Math.max(sauna.rates.minHours, pick.hours)} val.${perDay}`, fixed(sessionPrice(pick.hours, guests, sauna.rates, input.date ?? undefined) * saunaDays));
    }
    const hours = program ? programHours(program) : Math.max(sauna.rates.minHours, pick.hours);
    for (const upsell of upsells) {
      const qty = pick.extras[upsell.id] ?? 0;
      if (qty <= 0 || !sauna.upsellIds.includes(upsell.id)) continue;
      push("Pramogos", `${upsell.name}${upsell.unit === "vienetui" ? ` × ${qty}` : ""} (${sauna.name})${perDay}`, fixed(upsellTotal(upsell, qty, { partySize: guests, hours }) * saunaDays));
    }
    if (guests > sauna.rates.maxParty) warnings.push(`${sauna.name}: telpa iki ${sauna.rates.maxParty} asm., didesnė grupė keičiasi.`);
  }
  if (camp && input.campSaunaDays.length > 0 && saunas.some((sauna) => (input.saunas[sauna.id]?.hours ?? 0) > 0))
    notes.push(`Pirtis: ${input.campSaunaDays.map((day) => CAMP_DAY_LABEL[day].toLowerCase()).join(", ")}.`);
  if (camp && input.campActivities.length > 0)
    notes.push(`Veiklos (kaina aptariama): ${CAMP_ACTIVITIES.filter((activity) => input.campActivities.includes(activity.id)).map((activity) => activity.label.replace(/ \(.*\)$/, "")).join(", ")}.`);
  if (input.wakePrivate) push("Pramogos", "Privati WAKE trasa, 2 val.", fixed(PRICES.wakePrivate));
  if (input.wakeRiders > 0) push("Pramogos", `WAKE plaukimas × ${input.wakeRiders}`, fixed(PRICES.wakeRider * input.wakeRiders));
  if (input.atvRiders > 0) {
    push("Pramogos", `Keturračių turas × ${input.atvRiders}`, fixed(PRICES.atvTour * input.atvRiders));
    if (input.atvRiders < PRICES.atvMinRiders) warnings.push(`Keturračių turas – nuo ${PRICES.atvMinRiders} asm.`);
  }

  // Stay
  for (const cabin of stayTypesOf(stayTypes, "namelis")) {
    const units = input.cabinUnits[cabin.id] ?? 0;
    if (units > 0) {
      push("Nakvynė", `${cabin.label} · ${units} vnt. × ${input.cabinNights} n.`, fixed(cabin.pricePerNight * units * input.cabinNights));
    }
  }

  const total = lines.reduce((sum, l) => add(sum, l.amount), ZERO);
  const perGuest = guests > 0 && total.max > 0 ? range(Math.round(total.min / guests), Math.round(total.max / guests)) : null;
  return { lines, total, perGuest, minSpendGap, warnings, notes, available };
}

export function formatMoney(m: Money): string {
  const f = (n: number) => `${Math.round(n).toLocaleString("lt-LT")} €`;
  return m.min === m.max ? f(m.min) : `${Math.round(m.min).toLocaleString("lt-LT")}–${f(m.max)}`;
}
