import { useSyncExternalStore } from "react";

/** What the phone gate hands to the booking forms once the SMS code checks out. */
export interface PhoneVerification {
  /** E.164, e.g. +37061234567. */
  phone: string;
  /** Signed proof for the server actions. */
  token: string;
  /** ms since epoch. */
  expiresAt: number;
}

/**
 * One store for the whole tab, so every gate and contact form on a page agrees.
 * Kept in sessionStorage (not a cookie) because the /embed widgets run in a
 * third-party iframe; storage can throw there or in private windows, so it is
 * only a convenience and the in-memory value is what counts.
 */
const KEY = "vm-phone-verification";
const listeners = new Set<() => void>();
let current: PhoneVerification | null = null;
let loaded = false;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function isVerification(v: unknown): v is PhoneVerification {
  const o = v as Partial<PhoneVerification> | null;
  return typeof o?.phone === "string" && typeof o.token === "string" && typeof o.expiresAt === "number";
}

function publish(next: PhoneVerification | null) {
  current = next && next.expiresAt > Date.now() ? next : null;
  clearTimeout(expiryTimer);
  // Drop it a minute early so a form is never submitted with a token about to lapse.
  if (current) expiryTimer = setTimeout(() => setPhoneVerification(null), current.expiresAt - Date.now() - 60_000);
  listeners.forEach((l) => l());
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (isVerification(parsed)) publish(parsed);
  } catch {
    // No storage: the visitor verifies again after a reload.
  }
}

export function setPhoneVerification(next: PhoneVerification | null) {
  try {
    if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Same as above.
  }
  publish(next);
}

function subscribe(onChange: () => void) {
  load();
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** The verified phone for this tab, or null (always null on the server). */
export function usePhoneVerification(): PhoneVerification | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
