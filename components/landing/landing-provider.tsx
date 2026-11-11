"use client";

import dynamic from "next/dynamic";
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ServiceId } from "./content";

// The drawers are closed on load, so their code (forms, calculator, booking flows) loads once the browser is idle instead of with the page.
// This also keeps that code out of the chunks other routes share.
const ServiceDrawer = dynamic(() => import("./service-drawer").then((m) => m.ServiceDrawer), { ssr: false });
const CalculatorDrawer = dynamic(() => import("./calculator-drawer").then((m) => m.CalculatorDrawer), { ssr: false });

interface LandingContextValue {
  /** Opens an activity's drawer (details + booking form). */
  openService: (id: ServiceId) => void;
  /** Opens the event price calculator drawer (closes the activity drawer). */
  openCalculator: () => void;
}

const LandingContext = createContext<LandingContextValue | null>(null);

export function useLanding(): LandingContextValue {
  const ctx = use(LandingContext);
  if (!ctx) throw new Error("useLanding must be used inside <LandingProvider>");
  return ctx;
}

/** Owns the activity drawer of the home page; sections open it through `useLanding()`. */
export function LandingProvider({ children }: { children: ReactNode }) {
  const [service, setService] = useState<ServiceId | null>(null);
  const [open, setOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [drawersReady, setDrawersReady] = useState(false);

  useEffect(() => {
    // Mount when idle so the first tap on "Rezervuok" opens an already-loaded drawer.
    const ready = () => setDrawersReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(ready, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(ready, 1500);
    return () => window.clearTimeout(id);
  }, []);

  const openService = useCallback((id: ServiceId) => {
    setService(id);
    setOpen(true);
  }, []);
  const openCalculator = useCallback(() => {
    setOpen(false);
    setCalculatorOpen(true);
  }, []);
  const value = useMemo(() => ({ openService, openCalculator }), [openService, openCalculator]);

  return (
    <LandingContext value={value}>
      {children}
      {drawersReady || open || calculatorOpen ? (
        <>
          <ServiceDrawer open={open} serviceId={service} onClose={() => setOpen(false)} />
          <CalculatorDrawer open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
        </>
      ) : null}
    </LandingContext>
  );
}
