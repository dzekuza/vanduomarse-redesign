/**
 * Country dial codes for the phone inputs. Lithuania first and the default; the Baltics and Poland (the countries the site
 * sends SMS to, see `smsDestinationAllowed`) come next, then the neighbours and the usual foreign guests.
 */
export interface PhoneCountry {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** Lithuanian name. */
  name: string;
  /** Digits of the international prefix, without "+". */
  dial: string;
}

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: "LT", name: "Lietuva", dial: "370" },
  { code: "LV", name: "Latvija", dial: "371" },
  { code: "EE", name: "Estija", dial: "372" },
  { code: "PL", name: "Lenkija", dial: "48" },
  { code: "DE", name: "Vokietija", dial: "49" },
  { code: "GB", name: "Jungtinė Karalystė", dial: "44" },
  { code: "IE", name: "Airija", dial: "353" },
  { code: "NO", name: "Norvegija", dial: "47" },
  { code: "SE", name: "Švedija", dial: "46" },
  { code: "FI", name: "Suomija", dial: "358" },
  { code: "DK", name: "Danija", dial: "45" },
  { code: "NL", name: "Nyderlandai", dial: "31" },
  { code: "BE", name: "Belgija", dial: "32" },
  { code: "FR", name: "Prancūzija", dial: "33" },
  { code: "ES", name: "Ispanija", dial: "34" },
  { code: "IT", name: "Italija", dial: "39" },
  { code: "PT", name: "Portugalija", dial: "351" },
  { code: "UA", name: "Ukraina", dial: "380" },
  { code: "BY", name: "Baltarusija", dial: "375" },
  { code: "US", name: "JAV ir Kanada", dial: "1" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

/** The longest dial prefix first, so "+3706…" is Lithuania and "+358…" is Finland, not "+3". */
const BY_LONGEST_DIAL = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

export interface SplitPhone {
  country: PhoneCountry;
  /** What follows the prefix, exactly as typed or stored. */
  national: string;
  /** The value started with "+" or "00" but its prefix is not in the list: shown whole, in the number field. */
  foreign: boolean;
}

/**
 * Reads a stored or typed number into a country and the rest. International numbers ("+370 612 34567", "0037061234567")
 * are matched by their prefix; anything else (a local number like "8 612 34567") is taken as Lithuanian and kept as is.
 */
export function splitPhone(value: string): SplitPhone {
  const trimmed = value.trim();
  const international = trimmed.startsWith("+") || trimmed.startsWith("00");
  if (!international) return { country: DEFAULT_PHONE_COUNTRY, national: trimmed, foreign: false };
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  const country = BY_LONGEST_DIAL.find((c) => digits.startsWith(c.dial));
  if (!country) return { country: DEFAULT_PHONE_COUNTRY, national: trimmed, foreign: true };
  return { country, national: digits.slice(country.dial.length), foreign: false };
}

/**
 * The value to store for a country and the number typed after it: "+370 61234567". Empty stays empty, so an optional field
 * is not left holding just a prefix. A leading 0 (or a Lithuanian 8) is the national trunk digit and is dropped.
 */
export function joinPhone(country: PhoneCountry, national: string): string {
  let digits = national.replace(/\D/g, "");
  if (country.code === "LT" && digits.length === 9 && digits.startsWith("8")) digits = digits.slice(1);
  else if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  return digits ? `+${country.dial} ${digits}` : "";
}

/** Digits in a number, for the length checks the schemas share. */
export const phoneDigits = (value: string) => value.replace(/\D/g, "").length;
