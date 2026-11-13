import { normPhone } from "@/lib/admin/customer-match";
import type { Rider } from "@/lib/admin/types";
import { splitPhone } from "@/lib/phone-countries";

/** Lower case without diacritics, so "zilvinas" finds "Žilvinas". */
const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const fullName = (r: Pick<Rider, "name" | "surname">) => `${r.name} ${r.surname}`.trim();

/** The digits a typed phone value stands for, for matching against stored numbers (370…): the national part for a country-prefixed value. */
function typedDigits(value: string): string {
  const { national, foreign } = splitPhone(value);
  let digits = (foreign ? value : national).replace(/\D/g, "").replace(/^00/, "");
  if (!foreign && digits.length > 1 && digits.startsWith("8")) digits = digits.slice(1);
  return digits;
}

export type CustomerField = "name" | "phone";

/** Fewest characters (letters / digits) before a typed value suggests anyone. */
const MIN_CHARS: Record<CustomerField, number> = { name: 2, phone: 3 };

/**
 * Existing customers (Klientai) that match what staff are typing into a booking form, best first, at most `limit`.
 * Name: every typed word is found in "name surname" (diacritics ignored). Phone: the typed digits are found in either stored
 * number. A customer whose name and phone already equal the form's values is left out (they are already chosen).
 */
export function searchCustomers(
  riders: readonly Rider[],
  field: CustomerField,
  typed: { name: string; phone: string },
  limit = 5,
): Rider[] {
  const query = typed[field];
  const words = field === "name" ? fold(query).split(/\s+/).filter(Boolean) : [];
  const digits = field === "phone" ? typedDigits(query) : "";
  if (field === "name" ? words.join("").length < MIN_CHARS.name : digits.length < MIN_CHARS.phone) return [];

  const chosenName = fold(typed.name.trim());
  const chosenPhone = typedDigits(typed.phone);

  const matches = riders.filter((r) => {
    if (field === "name") {
      const hay = fold(fullName(r));
      return words.every((w) => hay.includes(w));
    }
    return [r.phone, r.phone2].some((p) => p && normPhone(p).includes(digits));
  });

  return matches
    .filter((r) => !(fold(fullName(r)) === chosenName && chosenPhone !== "" && !!r.phone && normPhone(r.phone).endsWith(chosenPhone)))
    .sort((a, b) => {
      const starts = (r: Rider) => (field === "name" ? Number(fold(fullName(r)).startsWith(words[0] ?? "")) : Number(normPhone(r.phone ?? "").includes(`370${digits}`)));
      return starts(b) - starts(a) || Number(Boolean(b.avatarPath)) - Number(Boolean(a.avatarPath)) || fullName(a).localeCompare(fullName(b), "lt");
    })
    .slice(0, limit);
}

/** A stored number as the booking form's phone field takes it: "+370 61234567" for a Lithuanian number, otherwise as stored. */
export function phoneForForm(phone: string | null): string {
  if (!phone) return "";
  const n = normPhone(phone);
  return n.startsWith("370") && n.length === 11 ? `+370 ${n.slice(3)}` : phone;
}
