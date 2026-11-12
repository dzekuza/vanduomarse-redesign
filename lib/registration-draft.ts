import type { RegistrationInput } from "@/lib/registration-schema";

const KEY = "vm:registration-draft";

/** The text fields kept between page visits (never the honeypot, photo or signature). */
export type RegistrationDraft = Partial<Pick<RegistrationInput, "name" | "surname" | "email" | "phone" | "phone2" | "birthdate">>;

const FIELDS = ["name", "surname", "email", "phone", "phone2", "birthdate"] as const;

/** The stored draft as a string (`""` when none), a stable value for `useSyncExternalStore`. */
export function readRegistrationDraftRaw(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function parseRegistrationDraft(raw: string): RegistrationDraft {
  const draft: RegistrationDraft = {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return draft;
    for (const field of FIELDS) {
      const value = (parsed as Record<string, unknown>)[field];
      if (typeof value === "string" && value) draft[field] = value;
    }
  } catch {
    // empty or corrupt draft
  }
  return draft;
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
