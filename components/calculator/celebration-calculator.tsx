"use client";

import type { ReactNode } from "react";
import { formatMoney, type CalculatorCatalog } from "@/lib/event-pricing";
import { CalculatorGroups } from "./calculator-groups";
import { EstimateBreakdown } from "./estimate-summary";
import { useEventCalculator } from "./use-event-calculator";

export function CelebrationCalculator({ today, catalog, header }: { today: string; catalog: CalculatorCatalog; header: ReactNode }) {
  const calc = useEventCalculator(today, catalog);
  const { result, input, guests, space, preset } = calc;
  return (
    <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div className="shrink-0 border-b border-line bg-foam p-4 sm:p-6">
        {header}
        <div aria-live="polite" aria-atomic="true" className="border-t border-line pt-4">
          <p className="text-micro uppercase text-copy">Preliminari kaina, su PVM</p>
          <p className="font-display text-total font-bold">{formatMoney(result.total)}</p>
        </div>
      </div>
      <div className="min-w-0 space-y-5 px-4 pb-4 sm:px-6 sm:pb-6 lg:min-h-0 lg:overflow-y-auto">
        <CalculatorGroups calc={calc} compact />
        <EstimateBreakdown estimate={result} input={input} guests={guests} spaceLabel={space?.label ?? ""}
          typical={preset ? { label: preset.label, perGuest: preset.perGuest } : null} compact />
      </div>
    </div>
  );
}
