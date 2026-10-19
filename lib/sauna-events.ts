import { dateKey } from "./sauna";

/** Recurring public sauna sessions: tickets are per person, not per group. */
interface EventTemplate {
  id: string;
  title: string;
  host: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  time: string;
  minutes: number;
  pricePerPerson: number;
  blurb: string;
}

const TEMPLATES: EventTemplate[] = [
  {
    id: "ritualas",
    title: "Pirties ritualas",
    host: "su pirtininku",
    weekday: 5,
    time: "19:00",
    minutes: 120,
    pricePerPerson: 25,
    blurb: "Trys garų ratai su vantomis, aromatais ir šaltu ežeru tarp jų.",
  },
  {
    id: "saulelydis",
    title: "Saulėlydžio garai",
    host: "atvira grupė",
    weekday: 6,
    time: "20:00",
    minutes: 90,
    pricePerPerson: 20,
    blurb: "Kaitinamės, kol saulė leidžiasi už trasos. Arbata po seanso.",
  },
  {
    id: "rytas",
    title: "Rytinis maudynių klubas",
    host: "atvira grupė",
    weekday: 0,
    time: "09:00",
    minutes: 60,
    pricePerPerson: 15,
    blurb: "Trumpi garai ir šaltas ežeras prieš pusryčius.",
  },
];

export const EVENT_CAPACITY = 8;
/** How far ahead public sessions are listed. */
export const EVENT_WINDOW_DAYS = 14;

export interface SaunaEvent extends EventTemplate {
  key: string;
  date: Date;
  spotsLeft: number;
}

/** Deterministic pseudo-occupancy so server and client render the same thing. */
function spotsLeft(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % (EVENT_CAPACITY + 1);
}

export function upcomingEvents(from: Date, days: number): SaunaEvent[] {
  const events: SaunaEvent[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(from);
    date.setDate(date.getDate() + i);
    for (const t of TEMPLATES) {
      if (t.weekday !== date.getDay()) continue;
      const key = `${dateKey(date)}-${t.id}`;
      events.push({ ...t, key, date, spotsLeft: spotsLeft(key) });
    }
  }
  return events;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sessions in the listing window that still have at least one spot. */
export function openEventCount(events: SaunaEvent[]): number {
  return events.filter((e) => e.spotsLeft > 0).length;
}

export function eventReference(key: string, people: number): string {
  const s = `${key}${people}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  return `PR-${(h % 9000) + 1000}`;
}
