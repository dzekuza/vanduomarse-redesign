"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useConsent } from "@/hooks/use-consent";
import {
  ACCEPT_ALL,
  CONSENT_ENABLED,
  GA_ID,
  PIXEL_ID,
  REJECT_ALL,
  clearTrackerCookies,
  disallowedCategories,
  onOpenConsentSettings,
  withdrewConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";
import { ConsentBanner } from "./consent-banner";
import { ConsentSettings } from "./consent-settings";
import { GoogleAnalytics, MetaPixel } from "./trackers";

/** Staff screens and the framed booking widgets are never tracked and never ask. */
const UNTRACKED_PREFIXES = ["/admin", "/embed"];

/**
 * Owns the whole consent flow: the first-visit banner, the settings dialog (also opened from the
 * footer) and the tracker scripts, which are mounted only for what the visitor allowed.
 */
export function ConsentManager() {
  const pathname = usePathname();
  const { ready, choice } = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => onOpenConsentSettings(() => setSettingsOpen(true)), []);

  // Cookies of a tracker the visitor has not allowed (or has just withdrawn) are removed on every load.
  useEffect(() => {
    if (ready && CONSENT_ENABLED) clearTrackerCookies(disallowedCategories(choice));
  }, [ready, choice]);

  if (!CONSENT_ENABLED || UNTRACKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  function save(next: ConsentChoice) {
    writeConsent(next);
    // A script that already ran cannot be unloaded: reload so the page starts without it.
    if (withdrewConsent(choice, next)) window.location.reload();
  }

  return (
    <>
      {choice?.analytics && GA_ID ? <GoogleAnalytics id={GA_ID} /> : null}
      {choice?.marketing && PIXEL_ID ? <MetaPixel id={PIXEL_ID} /> : null}
      {ready && !choice ? <ConsentBanner onAcceptAll={() => save(ACCEPT_ALL)} onRejectAll={() => save(REJECT_ALL)} onCustomize={() => setSettingsOpen(true)} /> : null}
      <ConsentSettings open={settingsOpen} onOpenChange={setSettingsOpen} choice={choice} onSave={save} />
    </>
  );
}
