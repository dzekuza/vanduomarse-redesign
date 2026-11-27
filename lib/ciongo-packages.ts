import type { Money } from "@/lib/event-pricing";
import { quadTourUnitPrice, type QuadTourRoute } from "@/lib/quads";
import { guestSurcharge, isWeekendDay, type PriceTable, type SaunaRates } from "@/lib/sauna";

/**
 * CIONGO x Vanduo Marse packages (ADR-0142), from the offer sheet the owner sent on 2026-11-27.
 * Quads are priced from the live tour route (`quad_tour_routes`) and the Finnish sauna from its `saunas` row;
 * the sheet's own figures (food, dome, cabins, the wood-fired sauna with a sauna master) live here, the one place.
 * Every package is a request to the team (`create_inquiry`), never a booking. All prices include 21% PVM.
 */

export type CiongoSaunaChoice = "suomiska" | "malkine";

/** `saunas.id` of each sauna choice. */
export const CIONGO_SAUNA_IDS: Record<CiongoSaunaChoice, string> = { suomiska: "suomiska-sauna", malkine: "pirtis-marse" };

/** Hours of sauna in every package. */
export const CIONGO_SAUNA_HOURS = 3;

/** The wood-fired sauna with a sauna master for 3 hours, Mon-Thu / Fri-Sun, per group (offer sheet). */
export const CIONGO_WOOD_SAUNA_PRICE = { weekday: 530, weekend: 600 } as const;

/** Cabins for the whole group, EUR per person per night (offer sheet). */
export const CIONGO_OVERNIGHT_PER_PERSON: Money = { min: 50, max: 60 };

/** The group the sheet prices: one person per quad. */
export const CIONGO_DEFAULT_PEOPLE = 10;

type PackageItem =
  | { kind: "quads" }
  | { kind: "sauna" }
  | { kind: "overnight" }
  | { kind: "group" | "perPerson"; id: string; title: string; note: string; price: Money };

export interface CiongoProgramStep {
  time: string;
  title: string;
  note?: string;
}

export interface CiongoPackage {
  id: string;
  tag: string;
  title: string;
  /** One line on the booking tile: what the package holds. */
  summary: string;
  items: PackageItem[];
  /** Cabins for everyone: part of the package, a choice, or not offered. */
  overnight: "included" | "optional" | "none";
  /** Sauna start in the suggested day, so staff can book it from the request; null = agreed later. */
  saunaStart: number | null;
  program: CiongoProgramStep[];
  photos: { src: string; alt: string }[];
}

const range = (min: number, max: number): Money => ({ min, max });

const SAUNA_STEP = "Suomiška pirtis arba malkinė pirtis su pirtininku";

export const CIONGO_PACKAGES: readonly CiongoPackage[] = [
  {
    id: "adrenalinas-ir-pirtis",
    tag: "Bernvakariams / mergvakariams",
    title: "Adrenalinas ir pirtis",
    summary: "Keturračiai, privati pirtis ir vaišės terasoje.",
    items: [
      { kind: "quads" },
      { kind: "sauna" },
      { kind: "group", id: "terasa", title: "Maistas, gėrimai ir terasa", note: "Terasos minimalus maisto ir gėrimų užsakymas. Atskiros nuomos nėra.", price: range(600, 600) },
    ],
    overnight: "none",
    saunaStart: null,
    program: [],
    photos: [
      { src: "/quads/marse/forest-mud-pair.webp", alt: "Du keturračiai brenda per purvą miške" },
      { src: "/landing/pirtis-02.webp", alt: "Pirties panoraminiai langai su vaizdu į ežerą" },
      { src: "/landing/food.webp", alt: "Užkandžiai šventės stalui" },
    ],
  },
  {
    id: "vakarelis-su-nakvyne",
    tag: "Bernvakariams / mergvakariams",
    title: "Vakarėlis su nakvyne",
    summary: "Keturračiai, pirtis, šventinė vakarienė ir nakvynė nameliuose.",
    items: [
      { kind: "quads" },
      { kind: "sauna" },
      { kind: "perPerson", id: "vakariene", title: "Šventinė vakarienė", note: "Pasitikimo užkandžiai, karštasis patiekalas ir gėrimų paketas.", price: range(60, 85) },
      { kind: "overnight" },
    ],
    overnight: "included",
    saunaStart: null,
    program: [],
    photos: [
      { src: "/quads/marse/instructor-back.webp", alt: "CIONGO komandos instruktorius ant keturračio" },
      { src: "/landing/nameliai-miegamasis.webp", alt: "Dvigulė lova šviesiame namelio miegamajame" },
      { src: "/landing/pirtis-03.webp", alt: "Pirties gultai ir krosnis prie lango į ežerą" },
    ],
  },
  {
    id: "svesk-su-veiksmu",
    tag: "Gimtadieniams",
    title: "Švęsk su veiksmu",
    summary: "Keturračiai, pirtis ir vakarienė; nakvynė pasirinktinai.",
    items: [
      { kind: "quads" },
      { kind: "sauna" },
      { kind: "perPerson", id: "vakariene", title: "Vakarienė ir erdvė", note: "Užkandžiai, karštasis patiekalas, gaivieji gėrimai / kava.", price: range(35, 50) },
      { kind: "overnight" },
    ],
    overnight: "optional",
    saunaStart: 16,
    program: [
      { time: "14:00–16:00", title: "Keturračiai", note: "Visa grupė, po vieną keturratyje" },
      { time: "16:00–19:00", title: "Pirtis", note: SAUNA_STEP },
      { time: "Nuo 19:00", title: "Vakarienė terasoje", note: "Maisto minimumas derinamas" },
      { time: "Po vakarėlio", title: "Nakvynė · pasirinktinai", note: "Nameliuose visiems dalyviams" },
    ],
    photos: [
      { src: "/quads/marse/dust-headlights.webp", alt: "Keturratis įjungtais žibintais kelia dulkes miške" },
      { src: "/landing/pirtis-01.webp", alt: "Apšviesta Vanduo Marse pirtis vakare" },
      { src: "/landing/food.webp", alt: "Užkandžiai šventės stalui" },
    ],
  },
  {
    id: "komandos-diena",
    tag: "Komandos diena įmonėms",
    title: "Nuo idėjų prie veiksmo",
    summary: "Darbinė sesija kupole, pietūs, keturračiai ir pirtis.",
    items: [
      { kind: "quads" },
      { kind: "group", id: "kupolas", title: "Kupolas darbinei sesijai", note: "Erdvė pristatymui ar mokymams.", price: range(300, 500) },
      { kind: "perPerson", id: "pietus", title: "Pietūs komandai", note: "Karštasis patiekalas, salotos, kava / arbata, stalo vanduo.", price: range(15, 25) },
      { kind: "sauna" },
    ],
    overnight: "none",
    saunaStart: 15,
    program: [
      { time: "09:30–12:00", title: "Atvykimas ir darbinė sesija", note: "Kava, pristatymas arba mokymai kupole" },
      { time: "12:00–13:00", title: "Pietūs komandai", note: "Sotūs pietūs restorane arba terasoje" },
      { time: "13:00–15:00", title: "CIONGO keturračių programa", note: "Instruktažas ir aktyvus laikas komandai" },
      { time: "15:00–18:00", title: "Pirtis ir poilsis", note: SAUNA_STEP },
    ],
    photos: [
      { src: "/quads/marse/field-drift.webp", alt: "Keturratis pievoje taško žemes" },
      { src: "/landing/dome.webp", alt: "Kupolas, paruoštas renginiui" },
      { src: "/landing/pirtis-05.webp", alt: "Įkaitę pirties krosnies akmenys" },
    ],
  },
  {
    id: "komandos-vakaras",
    tag: "Įmonėms · iki 250 žmonių erdvė",
    title: "Komandos vakaras. Iki ryto.",
    summary: "Kupolas iki 250 asm., keturračiai, pirtis, vakarienė ir DJ.",
    items: [
      { kind: "group", id: "kupolas", title: "Šildomas kupolas · iki 250 asm.", note: "Scena ir erdvė be garso apribojimų. 500 € + 21 % PVM.", price: range(605, 605) },
      { kind: "quads" },
      { kind: "sauna" },
      { kind: "perPerson", id: "vakariene", title: "Šventinė vakarienė ir gėrimai", note: "Užkandžiai, karštasis patiekalas, gaivieji gėrimai ir pasitikimo gėrimas.", price: range(55, 80) },
      { kind: "overnight" },
    ],
    overnight: "optional",
    saunaStart: 15,
    program: [
      { time: "13:00–15:00", title: "Atvykimas ir keturračiai", note: "1,5–2 val. išvyka miške" },
      { time: "15:00–18:00", title: "Pirtis", note: SAUNA_STEP },
      { time: "18:00–22:00", title: "Šventinė vakarienė kupole", note: "Vakaro programa su vedėju arba gyva muzika" },
      { time: "Nuo 22:00", title: "Šokiai ir DJ programa", note: "Be garso ir laiko apribojimų" },
    ],
    photos: [
      { src: "/landing/night.webp", alt: "Vakarėlio muzika ir šviesos Vanduo Marse" },
      { src: "/landing/dome.webp", alt: "Kupolas, paruoštas renginiui" },
      { src: "/landing/food.webp", alt: "Užkandžiai šventės stalui" },
    ],
  },
];

export function ciongoPackage(id: string | null | undefined): CiongoPackage | null {
  return CIONGO_PACKAGES.find((pkg) => pkg.id === id) ?? null;
}

/** What prices a package live: the tour route and the two saunas (null when not offered right now). */
export interface CiongoPriceSources {
  route: QuadTourRoute | null;
  saunas: Partial<Record<CiongoSaunaChoice, SaunaRates>>;
}

export interface CiongoChoice {
  people: number;
  sauna: CiongoSaunaChoice;
  /** Cabins for an "optional" package; ignored otherwise. */
  overnight: boolean;
  /** yyyy-mm-dd, or null: the sauna is then a weekday-weekend range. */
  day: string | null;
}

export interface CiongoLine {
  id: string;
  title: string;
  detail: string;
  amount: Money;
}

export interface CiongoEstimate {
  lines: CiongoLine[];
  total: Money;
  perPerson: Money;
}

/** The table price for `hours`, or the next longer length on offer. */
function tablePrice(table: PriceTable, hours: number): number | null {
  const length = Object.keys(table).map(Number).sort((a, b) => a - b).find((h) => h >= hours);
  return length === undefined ? null : table[length];
}

/** The 3-hour sauna for the group: Mon-Thu and Fri-Sun prices (equal once the day is known). Null when that sauna is not offered. */
export function ciongoSaunaPrice(choice: CiongoSaunaChoice, people: number, sources: CiongoPriceSources, day: string | null): Money | null {
  const rates = sources.saunas[choice];
  if (!rates) return null;
  const extra = guestSurcharge(people, rates);
  const weekday = choice === "malkine" ? CIONGO_WOOD_SAUNA_PRICE.weekday : tablePrice(rates.weekdayPrices, CIONGO_SAUNA_HOURS);
  const weekend = choice === "malkine" ? CIONGO_WOOD_SAUNA_PRICE.weekend : tablePrice(rates.weekendPrices, CIONGO_SAUNA_HOURS);
  if (weekday === null || weekend === null) return null;
  if (day) return isWeekendDay(day) ? range(weekend + extra, weekend + extra) : range(weekday + extra, weekday + extra);
  return range(Math.min(weekday, weekend) + extra, Math.max(weekday, weekend) + extra);
}

export const CIONGO_SAUNA_LABEL: Record<CiongoSaunaChoice, { title: string; note: string }> = {
  suomiska: { title: "Privati suomiška pirtis · 3 val.", note: "Be pirtininko." },
  malkine: { title: "Malkinė pirtis su pirtininku · 3 val.", note: "Pirtininkas veda programą." },
};

const sum = (lines: readonly CiongoLine[]): Money => lines.reduce((total, line) => range(total.min + line.amount.min, total.max + line.amount.max), range(0, 0));

/** The price of a package for a group. Quads need the live route; a sauna not offered right now leaves its line out. */
export function ciongoEstimate(pkg: CiongoPackage, choice: CiongoChoice, sources: CiongoPriceSources): CiongoEstimate {
  const people = choice.people;
  const lines = pkg.items.flatMap((item): CiongoLine[] => {
    switch (item.kind) {
      case "quads": {
        if (!sources.route) return [];
        const unit = quadTourUnitPrice(sources.route, people);
        return [{ id: "keturraciai", title: "CIONGO keturračiai", detail: `${people} keturr. × ${unit} € · po 1 žmogų`, amount: range(unit * people, unit * people) }];
      }
      case "sauna": {
        const price = ciongoSaunaPrice(choice.sauna, people, sources, choice.day);
        const label = CIONGO_SAUNA_LABEL[choice.sauna];
        return price ? [{ id: "pirtis", title: label.title, detail: label.note, amount: price }] : [];
      }
      case "overnight": {
        if (pkg.overnight === "none" || (pkg.overnight === "optional" && !choice.overnight)) return [];
        return [{
          id: "nakvyne",
          title: "Nakvynė nameliuose",
          detail: `${people} žm. × ${CIONGO_OVERNIGHT_PER_PERSON.min}–${CIONGO_OVERNIGHT_PER_PERSON.max} €`,
          amount: range(CIONGO_OVERNIGHT_PER_PERSON.min * people, CIONGO_OVERNIGHT_PER_PERSON.max * people),
        }];
      }
      case "perPerson":
        return [{ id: item.id, title: item.title, detail: `${people} žm. × ${item.price.min === item.price.max ? item.price.min : `${item.price.min}–${item.price.max}`} €`, amount: range(item.price.min * people, item.price.max * people) }];
      case "group":
        return [{ id: item.id, title: item.title, detail: item.note, amount: item.price }];
    }
  });
  const total = sum(lines);
  return { lines, total, perPerson: range(Math.round(total.min / people), Math.round(total.max / people)) };
}

/** The lowest price of a package for the sheet's group of 10: Finnish sauna on a weekday, no optional cabins. */
export function ciongoFromPrice(pkg: CiongoPackage, sources: CiongoPriceSources): Money {
  return ciongoEstimate(pkg, { people: CIONGO_DEFAULT_PEOPLE, sauna: "suomiska", overnight: false, day: null }, sources).total;
}

/** The packages from the cheapest to the dearest ("nuo" price for 10 people); ties keep the sheet's order. */
export function ciongoPackagesByPrice(sources: CiongoPriceSources): CiongoPackage[] {
  return CIONGO_PACKAGES.map((pkg, index) => ({ pkg, index, from: ciongoFromPrice(pkg, sources).min }))
    .toSorted((a, b) => a.from - b.from || a.index - b.index)
    .map(({ pkg }) => pkg);
}
