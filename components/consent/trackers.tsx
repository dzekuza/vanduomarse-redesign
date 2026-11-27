"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import type { ConsentChoice } from "@/lib/consent";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Mounted only after the visitor allowed analytics. GA4 reports route changes itself (enhanced measurement). */
export function GoogleAnalytics({ id }: { id: string }) {
  const init = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(id)},{anonymize_ip:true});`;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{init}</Script>
    </>
  );
}

const granted = (yes: boolean) => (yes ? "granted" : "denied");

/** Consent Mode v2 states for the visitor's choice: analytics drives measurement, marketing drives ads. */
function consentState({ analytics, marketing }: ConsentChoice) {
  return { analytics_storage: granted(analytics), ad_storage: granted(marketing), ad_user_data: granted(marketing), ad_personalization: granted(marketing) };
}

/**
 * Mounted only after the visitor allowed analytics or marketing. The container's tags see the choice through Google
 * Consent Mode: the default is set before gtm.js loads, and a later, wider choice is sent as an update (withdrawing
 * reloads the page, see `ConsentManager`).
 */
export function GoogleTagManager({ id, choice }: { id: string; choice: ConsentChoice }) {
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.gtag?.("consent", "update", consentState(choice));
  }, [choice]);

  const init = `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('consent','default',${JSON.stringify(consentState(choice))});dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`;
  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">{init}</Script>
      <Script src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
    </>
  );
}

/** Mounted only after the visitor allowed marketing. The App Router does not reload the page, so route changes send their own PageView. */
export function MetaPixel({ id }: { id: string }) {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  const init = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(id)});fbq('track','PageView');`;
  return <Script id="meta-pixel-init" strategy="afterInteractive">{init}</Script>;
}
