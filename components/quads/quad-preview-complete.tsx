"use client";

import { useEffect, useRef } from "react";
import { Cta } from "@/components/cta";
import { PlanSummary } from "@/components/reservation/plan-summary";
import type { PlanLine } from "@/lib/reservation";

/** Preview completion has no booking reference because no reservation was submitted. */
export function QuadPreviewComplete({ lines, total, onReset }: { lines: PlanLine[]; total: number; onReset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start" });
  }, []);
  return (
    <section aria-labelledby="quad-preview-complete-title" className="space-y-6 border border-line bg-dust p-5 sm:p-8">
      <header className="space-y-3">
        <h2 ref={heading} id="quad-preview-complete-title" tabIndex={-1} className="scroll-mt-32 text-heading font-bold outline-none">Planas paruoštas.</h2>
        <p role="status" className="text-sm text-copy">Tai dizaino peržiūra. Rezervacija nepateikta.</p>
      </header>
      <PlanSummary lines={lines} total={total} />
      <div className="flex justify-end"><Cta tone="dark" small onClick={onReset}>Keisti planą</Cta></div>
    </section>
  );
}
