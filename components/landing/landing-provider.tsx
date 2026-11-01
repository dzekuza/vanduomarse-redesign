"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ServiceId } from "./content";
import { CalculatorDrawer } from "./calculator-drawer";
import { ServiceDrawer } from "./service-drawer";

interface LandingContextValue {
  /** Opens an activity's drawer (details + booking form). */
  openService: (id: ServiceId) => void;
  /** Opens the event price calculator drawer (closes the activity drawer). */
  openCalculator: () => void;
}

const LandingContext = createContext<LandingContextValue | null>(null);

export function useLanding(): LandingContextValue {
  const ctx = useContext(LandingContext);
  if (!ctx) throw new Error("useLanding must be used inside <LandingProvider>");
  return ctx;
}

/** Owns the activity drawer of the home page; sections open it through `useLanding()`. */
export function LandingProvider({ children }: { children: ReactNode }) {
  const [service, setService] = useState<ServiceId | null>(null);
  const [open, setOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

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
      <ServiceDrawer open={open} serviceId={service} onClose={() => setOpen(false)} />
      <CalculatorDrawer open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </LandingContext>
  );
}
