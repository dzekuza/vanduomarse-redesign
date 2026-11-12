"use client";

import { useEffect, useRef } from "react";
import { releaseMyUnpaidPayments } from "@/app/actions/payments";

/**
 * The visitor is back from Stripe Checkout through the browser's Back button (ADR-0078): the page was reloaded
 * (`back_forward` navigation) or restored from the back/forward cache (`pageshow` with `persisted`). Their unpaid
 * payments are cancelled so no slot stays held, then `onBack` runs with how many were released, so the page can
 * leave its "redirecting" state and say so.
 */
export function useReleaseOnBrowserBack(onBack: (released: number) => void) {
  const callback = useRef(onBack);
  useEffect(() => {
    callback.current = onBack;
  });

  useEffect(() => {
    let running = false;
    async function run() {
      if (running) return;
      running = true;
      const result = await releaseMyUnpaidPayments().catch(() => null);
      running = false;
      callback.current(result && "data" in result ? result.data.released : 0);
    }

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "back_forward") void run();

    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) void run();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
}
