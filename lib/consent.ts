/**
 * Cookie consent for the optional trackers (Google Analytics, Meta Pixel).
 *
 * Nothing optional loads until the visitor says yes, and nothing is shown or loaded at all
 * while no tracker ID is configured. The choice lives in this browser's localStorage (it is
 * a record of the choice, not a tracker) and is asked again after a year or when
 * CONSENT_VERSION changes (new tracker or purpose).
 */

export const CONSENT_STORAGE_KEY = "vm_consent";
export const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const OPEN_SETTINGS_EVENT = "vm:consent-settings";
const CHANGE_EVENT = "vm:consent-change";

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
}

interface StoredConsent extends ConsentChoice {
  v: number;
  at: number;
}

/** The IDs come from the environment; anything that is not the expected shape is ignored, so it is safe to inline. */
function readId(value: string | undefined, shape: RegExp): string | undefined {
  const id = value?.trim();
  return id && shape.test(id) ? id : undefined;
}

export const GA_ID = readId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, /^G-[A-Z0-9]{4,20}$/);
export const PIXEL_ID = readId(process.env.NEXT_PUBLIC_META_PIXEL_ID, /^\d{6,20}$/);
/** No tracker configured means no banner and no footer link. */
export const CONSENT_ENABLED = Boolean(GA_ID || PIXEL_ID);

export const REJECT_ALL: ConsentChoice = { analytics: false, marketing: false };
export const ACCEPT_ALL: ConsentChoice = { analytics: Boolean(GA_ID), marketing: Boolean(PIXEL_ID) };

/** Raw stored string (null = no choice yet), the stable value `useSyncExternalStore` compares. */
export function readRawConsent(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseConsent(raw: string | null): ConsentChoice | null {
  if (!raw) return null;
  try {
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null) return null;
    const { v, at, analytics, marketing } = stored as Partial<StoredConsent>;
    if (v !== CONSENT_VERSION || typeof at !== "number" || Date.now() - at > CONSENT_MAX_AGE_MS) return null;
    return { analytics: analytics === true, marketing: marketing === true };
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  const stored: StoredConsent = { ...choice, v: CONSENT_VERSION, at: Date.now() };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage blocked: the choice only lasts for this page view; the banner returns next time.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeConsent(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** True when the new choice takes back something that was allowed: trackers already running must be stopped. */
export function withdrewConsent(prev: ConsentChoice | null, next: ConsentChoice): boolean {
  return Boolean(prev && ((prev.analytics && !next.analytics) || (prev.marketing && !next.marketing)));
}

const TRACKER_COOKIES: Record<keyof ConsentChoice, RegExp> = {
  analytics: /^(_ga|_gid|_gat)/,
  marketing: /^(_fbp|_fbc)/,
};

/** Categories the visitor has not allowed: whatever cookies their trackers left behind must go. */
export function disallowedCategories(choice: ConsentChoice | null): (keyof ConsentChoice)[] {
  return (Object.keys(TRACKER_COOKIES) as (keyof ConsentChoice)[]).filter((key) => !choice?.[key]);
}

/** Removes the cookies of the given categories, on this host and its parent domain. */
export function clearTrackerCookies(categories: (keyof ConsentChoice)[]): void {
  const host = window.location.hostname;
  const parent = host.replace(/^www\./, "");
  const domains = [undefined, host, `.${host}`, `.${parent}`];
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (!name || !categories.some((key) => TRACKER_COOKIES[key].test(name))) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; path=/; max-age=0${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

export function onOpenConsentSettings(handler: () => void): () => void {
  window.addEventListener(OPEN_SETTINGS_EVENT, handler);
  return () => window.removeEventListener(OPEN_SETTINGS_EVENT, handler);
}
