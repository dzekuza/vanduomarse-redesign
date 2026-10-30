import type { CabinAvailability } from "@/lib/cabin";
import type { QuadSettings, QuadTaken, QuadTourData, QuadType } from "@/lib/quads";
import type { Sauna } from "@/lib/sauna";
import type { SaunaEventData } from "@/lib/sauna-events";
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
  /** Sauna id -> yyyy-mm-dd -> hours that are booked or closed. */
  takenBySauna: Record<string, Record<string, number[]>>;
  events: SaunaEventData[];
}

export interface CabinPageData {
  today: string;
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
  tours: QuadTourData[];
}
