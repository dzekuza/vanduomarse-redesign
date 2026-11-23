"use client";

import type { ReactNode } from "react";
import { formatMoney, type CalculatorCatalog } from "@/lib/event-pricing";
import { CalculatorGroups } from "./calculator-groups";
import { EstimateSummary } from "./estimate-summary";
import type { StayAvailability } from "./stay-fit-details";
import { useEventCalculator } from "./use-event-calculator";

/** Standalone calculator page: every choice on the left, the live price and estimate sticky on the right. */
export function CalculatorPage({ header, today, catalog, stay }: { header: ReactNode; today: string; catalog: CalculatorCatalog; stay: StayAvailability }) {
  const calc = useEventCalculator(today, catalog, stay);
  const { result, input, guests, spaceLabel, preset } = calc;

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
      <div className="min-w-0 space-y-10 lg:col-span-2">
        {header}
        <CalculatorGroups calc={calc} />
      </div>

      <div id="samata" className="min-w-0 scroll-mt-28 lg:sticky lg:top-32 lg:self-start">
        <EstimateSummary estimate={result} input={input} guests={guests} spaceLabel={spaceLabel} typical={preset ? { label: preset.label, perGuest: preset.perGuest } : null} />
      </div>

      <MobileTotalBar total={formatMoney(result.total)} />
    </div>
  );
}

/** On small screens the estimate sits below a long form: keep the total in view. */
function MobileTotalBar({ total }: { total: string }) {
  return (
    <a href="#samata" className="fixed inset-x-0 bottom-0 z-30 flex min-h-11 items-center justify-between border-t border-ink bg-ink px-6 py-3 text-dust lg:hidden">
      <span className="text-xs uppercase text-dust/70">Preliminari kaina</span>
      <span className="font-display text-figure font-bold">{total}</span>
    </a>
  );
}
