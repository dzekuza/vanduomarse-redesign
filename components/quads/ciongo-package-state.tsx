"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";

interface CiongoPackageState {
  packageId: string | null;
  setPackageId: (id: string) => void;
  /** From a package card: choose this package in the booking panel and bring the panel into view. */
  choose: (id: string) => void;
}

const Context = createContext<CiongoPackageState | null>(null);

/** Shares the chosen CIONGO package between the package cards and the booking panel of the quads page. */
export function CiongoPackageProvider({ children }: { children: ReactNode }) {
  const [packageId, setPackageId] = useState<string | null>(null);
  const value = useMemo<CiongoPackageState>(() => ({
    packageId,
    setPackageId,
    choose: (id) => {
      setPackageId(id);
      document.getElementById("rezervuoti")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  }), [packageId]);
  return <Context value={value}>{children}</Context>;
}

export function useCiongoPackage(): CiongoPackageState {
  const state = use(Context);
  if (!state) throw new Error("useCiongoPackage must sit inside CiongoPackageProvider.");
  return state;
}
