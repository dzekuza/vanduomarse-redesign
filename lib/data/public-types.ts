import type { CabinAvailability, StayType } from "@/lib/cabin";
import type { QuadDeparture, QuadSettings, QuadTaken, QuadTourAccessory, QuadTourData, QuadTourRoute, QuadType } from "@/lib/quads";
import type { Sauna } from "@/lib/sauna";
import type { SaunaProgram } from "@/lib/sauna-programs";
import type { SaunaEventData } from "@/lib/sauna-events";
import type { SaunaMaster } from "@/lib/sauna-masters";
import type { Upsell } from "@/lib/sauna-upsells";

/** Props the public pages hand to their Client Components (see `lib/data/public.ts`). */

export interface SaunaPageData {
  /** Park date, yyyy-mm-dd. */
  today: string;
  /** Park hour (0-23) when the page was rendered; today's starts at or before it are gone. */
  nowHour: number;
  /** Active saunas in display order; `upsellIds` only lists active extras. */
  saunas: Sauna[];
  /** Active extras catalogue; each sauna offers a subset. */
  upsells: Upsell[];
  /** Active sauna masters (pirtininkai) a booking can add. */
  masters: SaunaMaster[];
  /** Active sauna programs in display order. */
  programs: SaunaProgram[];
  /** Sauna id -> yyyy-mm-dd -> hours that are booked or closed. */
  takenBySauna: Record<string, Record<string, number[]>>;
  events: SaunaEventData[];
}

export interface CabinPageData {
  today: string;
  /** Active cabin sizes and camper pitches in display order, with their live prices and stock. */
  stayTypes: StayType[];
  availability: CabinAvailability;
}

export interface QuadPageData {
  /** Park date, yyyy-mm-dd. */
  today: string;
  /** Current hour at the park (0-23), so today's past hours can be greyed out. */
  nowHour: number;
  types: QuadType[];
  settings: QuadSettings;
  taken: QuadTaken;
  /** Scheduled guided rides (events); not the bookable tour products below. */
  tours: QuadTourData[];
  /** Mini / Midi / Maxi, active only, in display order. */
  tourRoutes: QuadTourRoute[];
  tourAccessories: QuadTourAccessory[];
  /** Dated departures of the tour products; a tour is booked on one of these. */
  departures: QuadDeparture[];
}
