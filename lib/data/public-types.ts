import type { CabinAvailability } from "@/lib/cabin";
import type { QuadSettings, QuadTaken, QuadTourData, QuadType } from "@/lib/quads";
import type { SaunaRates } from "@/lib/sauna";
import type { SaunaEventData } from "@/lib/sauna-events";
import type { Upsell } from "@/lib/sauna-upsells";

/** Props the public pages hand to their Client Components (see `lib/data/public.ts`). */

export interface SaunaPageData {
  /** Park date, yyyy-mm-dd. */
  today: string;
  /** Park hour (0-23) when the page was rendered; today's starts at or before it are gone. */
  nowHour: number;
  rates: SaunaRates;
  upsells: Upsell[];
  /** yyyy-mm-dd -> hours that are booked or closed. */
  takenByDay: Record<string, number[]>;
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
