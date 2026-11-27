import { GA_ID, GTM_ID, PIXEL_ID, type ConsentChoice } from "@/lib/consent";

const tools = (...names: (string | false)[]) => names.filter(Boolean).join(", ");

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
    noun: `analitiką (${tools(Boolean(GA_ID) && "Google Analytics", Boolean(GTM_ID) && "Google Tag Manager")})`,
    description: "Google Analytics (taip pat per Google Tag Manager) rodo, kurie puslapiai lankomi ir kaip svetaine naudojama, kad ją tobulintume.",
    configured: Boolean(GA_ID || GTM_ID),
  },
  {
    key: "marketing",
    title: "Rinkodara",
    noun: `rinkodarą (${tools(Boolean(PIXEL_ID) && "Meta Pixel", Boolean(GTM_ID) && "Google žymos")})`,
    description: "Meta Pixel ir Google žymos (per Google Tag Manager) padeda matyti, kaip veikia mūsų skelbimai Facebook, Instagram ir Google, ir juos rodyti tinkamiems žmonėms.",
    configured: Boolean(PIXEL_ID || GTM_ID),
  },
];

/** Only the categories that have a tracker configured; the rest are never offered. */
export const CONSENT_CATEGORIES: readonly ConsentCategory[] = ALL_CATEGORIES.filter(({ configured }) => configured);
