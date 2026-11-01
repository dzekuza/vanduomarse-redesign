"use client";

import { createContext, useContext, type ReactNode } from "react";

const SteppedContext = createContext(false);
const InStepContext = createContext(false);

/** Wrap booking flows in this to show them one step at a time (used inside the home page drawer). */
export function SteppedBooking({ children }: { children: ReactNode }) {
  return <SteppedContext value>{children}</SteppedContext>;
}

/** True when booking flows should run as a stepper instead of one long form. */
export const useSteppedBooking = () => useContext(SteppedContext);

/** Marks the content of the current step, so its own numbered `StepLabel` hides (the stepper header shows it). */
export function StepFrame({ children }: { children: ReactNode }) {
  return <InStepContext value>{children}</InStepContext>;
}

export const useInStep = () => useContext(InStepContext);
