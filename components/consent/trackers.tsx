"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

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
