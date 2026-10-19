import { dateKey } from "./sauna";
import { upcomingEvents as upcomingSaunaEvents } from "./sauna-events";

/** One feed for the Renginiai page: park events plus public sauna sessions. */
export const EVENT_CATEGORIES = [
  { id: "pirtis", label: "Pirtis" },
  { id: "vakarai", label: "Vakarai" },
  { id: "akademija", label: "Akademija" },
  { id: "sventes", label: "Šventės" },
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["id"];

export interface ParkEvent {
  key: string;
  title: string;
  category: EventCategory;
  date: Date;
  time: string;
  place: string;
  blurb: string;
  /** null = free entry */
  price: number | null;
  /** Spots left, when the event is capacity-limited. */
  spotsLeft?: number;
  cta: { label: string; href: string };
}

/** One-off park events, placed by day offset from today until a real CMS exists. */
interface OneOff {
  id: string;
  offset: number;
  title: string;
  category: EventCategory;
  time: string;
  place: string;
  blurb: string;
  price: number | null;
}

const ONE_OFFS: OneOff[] = [
  {
    id: "uzdarymas",
    offset: 5,
    title: "Sezono uždarymo vakarėlis",
    category: "sventes",
    time: "18:00",
    place: "Skoniai Marse",
    blurb: "Paskutinis sezono vakaras prie trasos: DJ, laužas ir sezono vaizdo įrašai.",
    price: null,
  },
  {
    id: "filmai",
    offset: 9,
    title: "Vandenlenčių filmų vakaras",
    category: "vakarai",
    time: "19:30",
    place: "Skoniai Marse",
    blurb: "Geriausi kabelio ir boat filmai dideliame ekrane. Popkornas įskaičiuotas.",
    price: 8,
  },
  {
    id: "akademija-sausuma",
    offset: 12,
    title: "Marso Akademija: žiemos treniruotės",
    category: "akademija",
    time: "11:00",
    place: "Marso Akademija",
    blurb: "Balanso lentos, batutas ir triukų technika sausumoje. Vaikams nuo 8 m. ir suaugusiems.",
    price: 20,
  },
  {
    id: "muzika",
    offset: 16,
    title: "Gyva muzika prie ežero",
    category: "vakarai",
    time: "20:00",
    place: "Skoniai Marse",
    blurb: "Akustinis vakaras su vietos atlikėjais. Staliukus verta rezervuoti iš anksto.",
    price: null,
  },
  {
    id: "rookie",
    offset: 23,
    title: "Rookie Challenge 2027: registracijos startas",
    category: "akademija",
    time: "12:00",
    place: "Vanduo Marse",
    blurb: "Pristatome kitų metų naujokų varžybas, taisykles ir treniruočių planą.",
    price: null,
  },
  {
    id: "kaledos",
    offset: 27,
    title: "Kalėdinė mugė Marse",
    category: "sventes",
    time: "14:00",
    place: "Vanduo Marse",
    blurb: "Vietinių gamintojų mugė, karštas vynas ir dovanų kuponai su nuolaida.",
    price: null,
  },
];

export const EVENTS_WINDOW_DAYS = 30;

const MONTHS_NOMINATIVE = [
  "Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis",
  "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis",
];

/** "Spalis 2026": month heading for grouping the feed. */
export function monthHeading(date: Date): string {
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}

const CONTACT = "info@vanduomarse.lt";

export function parkEvents(from: Date, days: number = EVENTS_WINDOW_DAYS): ParkEvent[] {
  const oneOffs: ParkEvent[] = ONE_OFFS.filter((e) => e.offset < days).map((e) => {
    const date = new Date(from);
    date.setDate(date.getDate() + e.offset);
    return {
      key: `${dateKey(date)}-${e.id}`,
      title: e.title,
      category: e.category,
      date,
      time: e.time,
      place: e.place,
      blurb: e.blurb,
      price: e.price,
      cta: { label: "Registruotis", href: `mailto:${CONTACT}?subject=${encodeURIComponent(e.title)}` },
    };
  });

  const sauna: ParkEvent[] = upcomingSaunaEvents(from, days).map((e) => ({
    key: e.key,
    title: e.title,
    category: "pirtis",
    date: e.date,
    time: e.time,
    place: `Pirtis Marse · ${e.host}`,
    blurb: e.blurb,
    price: e.pricePerPerson,
    spotsLeft: e.spotsLeft,
    cta: { label: "Pirkti bilietą", href: "/pirtis?skirtukas=renginiai" },
  }));

  return [...oneOffs, ...sauna].sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time));
}
