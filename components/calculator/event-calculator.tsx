"use client";

import { EstimateSummary } from "./estimate-summary";
import { CALCULATOR_SECTIONS } from "./calculator-sections";
import { useEventCalculator } from "./use-event-calculator";
import { formatMoney } from "@/lib/event-pricing";

/** Event price calculator page: every question on one screen with the live estimate beside it. */
export function EventCalculator() {
  const calc = useEventCalculator();
  const { result, input, guests, space, preset } = calc;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-12">
      <div className="min-w-0 space-y-10">
        {CALCULATOR_SECTIONS.map(({ id, Section }) => (
          <Section key={id} calc={calc} />
        ))}
      </div>

      <div id="samata" className="min-w-0 scroll-mt-28 lg:sticky lg:top-28">
        <EstimateSummary estimate={result} input={input} guests={guests} spaceLabel={space.label} typical={preset ? { label: preset.label, perGuest: preset.perGuest } : null} />
      </div>

      <MobileTotalBar total={formatMoney(result.total)} />
    </div>
  );
}

/** On small screens the summary sits below a long form: keep the total in view. */
function MobileTotalBar({ total }: { total: string }) {
  return (
    <a
      href="#samata"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-ink bg-ink px-6 py-3 text-foam lg:hidden"
    >
      <span className="text-xs uppercase text-foam/70">Preliminari kaina</span>
      <span className="font-display text-lg font-bold">{total}</span>
    </a>
  );
}
