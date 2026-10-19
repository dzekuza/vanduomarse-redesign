import { CATERING, DRINKS, PRICES, SPACES } from "@/lib/event-pricing";
import { parkEvents } from "@/lib/park-events";
import {
  CLOSE_HOUR,
  MASTER_PRICE,
  OPEN_HOUR,
  VIHTA_PRICE,
  dateKey,
  sessionPrice,
} from "@/lib/sauna";
import { EVENT_CAPACITY } from "@/lib/sauna-events";
import { ROOM_TYPES } from "@/lib/cabin";
import type { Block, Booking, Customer, Inquiry, ManagedEvent, PriceItem } from "./types";

/**
 * Deterministic demo data, generated relative to `today` so the dashboard
 * always looks current. Replaced by Supabase queries later (see ADR-0005).
 */

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Agnė", "Tomas", "Rūta", "Mantas", "Eglė", "Lukas", "Ieva", "Darius", "Gabija", "Paulius", "Austėja", "Karolis"];
const LAST = ["Kazlauskienė", "Petrauskas", "Jankauskaitė", "Žukauskas", "Butkutė", "Stankevičius", "Vasiliauskaitė", "Navickas"];

function customer(r: () => number): Customer {
  const first = FIRST[Math.floor(r() * FIRST.length)];
  const last = LAST[Math.floor(r() * LAST.length)];
  const handle = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return { name: `${first} ${last}`, email: `${handle}@pastas.lt`, phone: `+370 6${Math.floor(r() * 9e6 + 1e6)}` };
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const pick = <T,>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)];

export function seedBookings(today: Date): Booking[] {
  const r = rng(7);
  const out: Booking[] = [];
  let n = 1000;
  for (let offset = -7; offset <= 13; offset++) {
    const date = addDays(today, offset);
    const key = dateKey(date);
    const past = offset < 0;

    // Sauna: up to three non-overlapping sessions.
    let hour = OPEN_HOUR + Math.floor(r() * 3);
    const sessions = 1 + Math.floor(r() * 3);
    for (let i = 0; i < sessions && hour + 2 <= CLOSE_HOUR; i++) {
      const hours = Math.min(2 + Math.floor(r() * 3), CLOSE_HOUR - hour);
      const guests = 2 + Math.floor(r() * 12);
      const master = r() < 0.25;
      const vihtas = r() < 0.4 ? Math.min(guests, 1 + Math.floor(r() * 4)) : 0;
      out.push({
        id: `b${n}`,
        reference: `PM-${n++}`,
        kind: "pirtis",
        customer: customer(r),
        date: key,
        startHour: hour,
        hours,
        guests,
        extras: [...(master ? ["Pirtininkas"] : []), ...(vihtas ? [`Vantos × ${vihtas}`] : [])],
        total: sessionPrice(hours, guests) + (master ? MASTER_PRICE : 0) + vihtas * VIHTA_PRICE,
        status: past ? (r() < 0.9 ? "ivykdyta" : "atsaukta") : r() < 0.35 ? "laukia" : "patvirtinta",
        createdAt: addDays(date, -1 - Math.floor(r() * 10)).toISOString(),
      });
      hour += hours + 1 + Math.floor(r() * 2);
    }

    // Cabins and camper pitches.
    const stays = Math.floor(r() * 3);
    for (let i = 0; i < stays; i++) {
      const room = pick(r, ROOM_TYPES);
      const nights = 1 + Math.floor(r() * 3);
      out.push({
        id: `b${n}`,
        reference: `MM-${n++}`,
        kind: room.id,
        customer: customer(r),
        date: key,
        nights,
        guests: room.id === "namelis" ? 2 + Math.floor(r() * 3) : 2,
        extras: [],
        total: room.pricePerNight * nights,
        status: past ? "ivykdyta" : r() < 0.3 ? "laukia" : "patvirtinta",
        createdAt: addDays(date, -2 - Math.floor(r() * 14)).toISOString(),
      });
    }
  }
  return out;
}

export function seedBlocks(today: Date): Block[] {
  const maintenance = dateKey(addDays(today, 3));
  return [20, 21].map((hour) => ({ id: `blk-${maintenance}-${hour}`, date: maintenance, hour, reason: "Krosnies priežiūra" }));
}

export function seedInquiries(today: Date): Inquiry[] {
  const r = rng(42);
  const rows: Omit<Inquiry, "id" | "customer" | "createdAt" | "notes">[] = [
    { source: "skaiciuokle", eventType: "Vestuvės", date: dateKey(addDays(today, 210)), guests: 120, space: "Kupolas + „Corona“", estimate: { min: 5750, max: 6100 }, message: "Norėtume aptarti meniu ir nakvynę svečiams.", status: "nauja" },
    { source: "skaiciuokle", eventType: "Komandos diena", date: dateKey(addDays(today, 32)), guests: 40, space: "Kupolas: seminaras", estimate: { min: 3037, max: 3407 }, message: "Ar galima WAKE perkelti į popietę?", status: "nauja" },
    { source: "renginys", eventType: "Vandenlenčių filmų vakaras", date: dateKey(addDays(today, 9)), guests: 4, space: "Skoniai Marse", estimate: null, message: "Registruojame 4 asmenis.", status: "susisiekta" },
    { source: "skaiciuokle", eventType: "Gimtadienis", date: dateKey(addDays(today, 18)), guests: 25, space: "Įstiklinta terasa", estimate: { min: 1220, max: 1470 }, message: "Jubiliejus, 50 m.", status: "pasiulymas" },
    { source: "kontaktai", eventType: "Konferencija", date: dateKey(addDays(today, 45)), guests: 60, space: "Kupolas: seminaras", estimate: { min: 1483, max: 1913 }, message: "Reikia ekrano ir mikrofonų.", status: "pasiulymas" },
    { source: "skaiciuokle", eventType: "Bernvakaris / mergvakaris", date: dateKey(addDays(today, 12)), guests: 15, space: "Įstiklinta terasa", estimate: { min: 2930, max: 3330 }, message: "Su nakvyne ir keturračiais.", status: "laimeta" },
    { source: "skaiciuokle", eventType: "Krikštynos", date: dateKey(addDays(today, 6)), guests: 25, space: "Įstiklinta terasa", estimate: { min: 1000, max: 1250 }, message: "Data netiko, ieškos kitur.", status: "prarasta" },
  ];
  return rows.map((row, i) => ({
    ...row,
    id: `inq${i + 1}`,
    customer: customer(r),
    createdAt: addDays(today, -i - Math.floor(r() * 3)).toISOString(),
    notes: row.status === "nauja" ? [] : [{ at: addDays(today, -i).toISOString(), text: "Paskambinta, išsiųstas el. laiškas." }],
  }));
}

export function seedEvents(today: Date): ManagedEvent[] {
  return parkEvents(today).map((e) => ({
    id: e.key,
    title: e.title,
    category: e.category,
    date: dateKey(e.date),
    time: e.time,
    place: e.place,
    blurb: e.blurb,
    price: e.price,
    capacity: e.spotsLeft === undefined ? null : EVENT_CAPACITY,
    sold: e.spotsLeft === undefined ? 0 : EVENT_CAPACITY - e.spotsLeft,
    published: true,
  }));
}

/** Current price list (spaces, catering, services, stays), read from the same constants the public site uses. */
export function seedPrices(): PriceItem[] {
  // Sauna rates and extras are managed separately in /admin/pirtis.
  const items: PriceItem[] = [];

  for (const s of SPACES) {
    if (s.id === "terasa") {
      for (const g of [20, 25, 30]) {
        items.push({ id: `terasa-${g}-wd`, group: "Erdvės", label: `Terasa iki ${g} asm., darbo d.`, unit: "min. sąsk. €", value: s.minSpend("weekday", g) });
        items.push({ id: `terasa-${g}-we`, group: "Erdvės", label: `Terasa iki ${g} asm., vakaras / savaitg.`, unit: "min. sąsk. €", value: s.minSpend("weekend", g) });
      }
      continue;
    }
    const wd = s.rent("weekday", 10);
    const we = s.rent("weekend", 10);
    if (wd !== null && we !== null && wd !== we) {
      items.push({ id: `${s.id}-wd`, group: "Erdvės", label: `${s.label}, darbo d.`, unit: "€", value: wd });
      items.push({ id: `${s.id}-we`, group: "Erdvės", label: `${s.label}, savaitgalis`, unit: "€", value: we });
    } else {
      items.push({ id: s.id, group: "Erdvės", label: s.label, unit: "€", value: (wd ?? we)! });
    }
    const min = s.minSpend("weekend", 10);
    if (min > 0) items.push({ id: `${s.id}-min`, group: "Erdvės", label: `${s.label}: min. sąskaita`, unit: "€", value: min });
  }

  // Buffets share a name in the sheet, so number them as packages to tell rows apart.
  let buffet = 0;
  for (const c of CATERING) {
    if (c.perAdult === 0) continue;
    const label = c.id.startsWith("bufetas") ? `${c.label}, ${++buffet} paketas (${c.hint.split(" · ")[0]})` : c.label;
    items.push({ id: `cat-${c.id}`, group: "Maitinimas", label, unit: "€/asm.", value: c.perAdult });
  }
  for (const d of DRINKS) {
    items.push({ id: `drink-${d.id}`, group: "Maitinimas", label: d.label, unit: "€", value: d.price.min, max: d.price.max > d.price.min ? d.price.max : undefined });
  }

  items.push(
    { id: "bartender", group: "Paslaugos", label: "Barmenas", unit: "€/vakarui", value: PRICES.bartender },
    { id: "decor", group: "Paslaugos", label: "Stalo dekoravimas", unit: "€", value: PRICES.decor.min, max: PRICES.decor.max },
    { id: "serving", group: "Paslaugos", label: "Serviravimas", unit: "€/asm.", value: PRICES.serving },
    { id: "team", group: "Paslaugos", label: "Aptarnavimo mokestis", unit: "€", value: 100, max: 350 },
    { id: "overtime", group: "Paslaugos", label: "Viršvalandžiai po 24:00", unit: "€/val.", value: 150 },
    { id: "wake-private", group: "Pramogos", label: "Privati WAKE trasa, 2 val.", unit: "€", value: PRICES.wakePrivate },
    { id: "wake-rider", group: "Pramogos", label: "WAKE plaukimas", unit: "€/asm.", value: PRICES.wakeRider },
    { id: "atv", group: "Pramogos", label: "Keturračių turas", unit: "€/asm.", value: PRICES.atvTour },
    { id: "cabin-night", group: "Nakvynė", label: "Nameliai", unit: "€/asm./naktis", value: PRICES.cabinNight.min, max: PRICES.cabinNight.max },
    ...ROOM_TYPES.map((room) => ({ id: `room-${room.id}`, group: "Nakvynė" as const, label: `${room.label} (svetainės rezervacija)`, unit: "€/naktis", value: room.pricePerNight })),
  );
  return items;
}
