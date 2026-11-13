"use client";

import { CONSENT_ENABLED, openConsentSettings } from "@/lib/consent";

/** Footer entry that reopens the consent settings, so a choice can be changed or withdrawn at any time. Hidden while no tracker is configured. */
export function CookieSettingsLink({ className }: { className?: string }) {
  if (!CONSENT_ENABLED) return null;
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      Slapukų nustatymai
    </button>
  );
}
