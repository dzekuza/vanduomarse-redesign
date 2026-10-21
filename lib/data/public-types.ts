import type { CabinAvailability } from "@/lib/cabin";
import type { SaunaRates } from "@/lib/sauna";
import type { SaunaEventData } from "@/lib/sauna-events";
import type { Upsell } from "@/lib/sauna-upsells";

/** Props the public pages hand to their Client Components (see `lib/data/public.ts`). */

export interface SaunaPageData {
  /** Park date, yyyy-mm-dd. */
  today: string;
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
