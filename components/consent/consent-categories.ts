import { GA_ID, PIXEL_ID, type ConsentChoice } from "@/lib/consent";

export interface ConsentCategory {
  key: keyof ConsentChoice;
  title: string;
  /** Used in the banner sentence: "įjungsime analitiką (Google Analytics)". */
  noun: string;
  description: string;
}

const ALL_CATEGORIES: readonly (ConsentCategory & { configured: boolean })[] = [
  {
    key: "analytics",
    title: "Analitika",
    noun: "analitiką (Google Analytics)",
    description: "Google Analytics rodo, kurie puslapiai lankomi ir kaip svetaine naudojama, kad ją tobulintume.",
    configured: Boolean(GA_ID),
  },
  {
    key: "marketing",
    title: "Rinkodara",
    noun: "rinkodarą (Meta Pixel)",
    description: "Meta Pixel padeda matyti, kaip veikia mūsų skelbimai Facebook ir Instagram, ir juos rodyti tinkamiems žmonėms.",
    configured: Boolean(PIXEL_ID),
  },
];

/** Only the categories that have a tracker configured; the rest are never offered. */
export const CONSENT_CATEGORIES: readonly ConsentCategory[] = ALL_CATEGORIES.filter(({ configured }) => configured);
