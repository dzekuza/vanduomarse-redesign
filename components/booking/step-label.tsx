"use client";

import { useInStep } from "./stepped";

/** Numbered section title of a booking form. Hidden inside a stepper, whose header already names the step. */
export function StepLabel({ step, children }: { step: number; children: React.ReactNode }) {
  if (useInStep()) return null;
  return (
    <p className="mb-5 flex items-baseline gap-3 text-heading font-bold uppercase tracking-tight">
      <span className="font-display text-rust">{String(step).padStart(2, "0")}</span>
      <span>{children}</span>
    </p>
  );
}
