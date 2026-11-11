"use client";

import type { ReactNode } from "react";
import { EstimateSummary } from "./estimate-summary";
import { CalculatorGroups } from "./calculator-groups";
import { useEventCalculator } from "./use-event-calculator";
import { formatMoney, type CalculatorCatalog } from "@/lib/event-pricing";

/** Event price calculator page: question groups on the left, sticky live estimate on the right. */
export function EventCalculator({ header, today, catalog }: { header: ReactNode; today: string; catalog: CalculatorCatalog }) {
  const calc = useEventCalculator(today, catalog);
  const { result, input, guests, space, preset } = calc;

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
      <div className="min-w-0 space-y-10 lg:col-span-2">
        {header}
        <CalculatorGroups calc={calc} />
      </div>

      <div id="samata" className="min-w-0 scroll-mt-28 lg:sticky lg:top-32 lg:self-start">
        <EstimateSummary estimate={result} input={input} guests={guests} spaceLabel={space?.label ?? ""} typical={preset ? { label: preset.label, perGuest: preset.perGuest } : null} />
      </div>

      <MobileTotalBar total={formatMoney(result.total)} />
    </div>
  );
}

/** On small screens the summary sits below a long form: keep the total in view. */
function MobileTotalBar({ total }: { total: string }) {
  return (
    <a href="#samata" className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-ink bg-ink px-6 py-3 text-dust lg:hidden">
      <span className="text-xs uppercase text-dust/70">Preliminari kaina</span>
      <span className="font-display text-figure font-bold">{total}</span>
    </a>
  );
}
