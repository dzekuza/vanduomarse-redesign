"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseConsent, readRawConsent, subscribeConsent, type ConsentChoice } from "@/lib/consent";

/** The server and the first client render report `undefined`, so the banner never causes a hydration mismatch. */
const serverSnapshot = (): string | null | undefined => undefined;

export function useConsent(): { ready: boolean; choice: ConsentChoice | null } {
  const raw = useSyncExternalStore<string | null | undefined>(subscribeConsent, readRawConsent, serverSnapshot);
  return useMemo(() => ({ ready: raw !== undefined, choice: parseConsent(raw ?? null) }), [raw]);
}
