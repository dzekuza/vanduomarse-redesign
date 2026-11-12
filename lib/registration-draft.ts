import type { RegistrationInput } from "@/lib/registration-schema";

const KEY = "vm:registration-draft";

/** The text fields kept between page visits (never the honeypot, photo or signature). */
export type RegistrationDraft = Partial<Pick<RegistrationInput, "name" | "surname" | "email" | "phone" | "phone2" | "birthdate">>;

const FIELDS = ["name", "surname", "email", "phone", "phone2", "birthdate"] as const;

export function loadRegistrationDraft(): RegistrationDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const draft: RegistrationDraft = {};
    for (const field of FIELDS) {
      const value = (parsed as Record<string, unknown>)[field];
      if (typeof value === "string" && value) draft[field] = value;
    }
    return Object.keys(draft).length ? draft : null;
  } catch {
    return null;
  }
}

export function saveRegistrationDraft(values: Partial<RegistrationInput>): void {
  try {
    const draft: RegistrationDraft = {};
    for (const field of FIELDS) {
      const value = values[field];
      if (typeof value === "string" && value) draft[field] = value;
    }
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode, blocked): the form simply isn't remembered.
  }
}

export function clearRegistrationDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
