"use client";

import { PRICES } from "@/lib/event-pricing";
import { CalculatorOptionCard, CalculatorQuantityCard } from "./calculator-option-card";
import { SaunaAndQuadCards } from "./stay-section";
import type { EventCalculatorState } from "./use-event-calculator";

export function WakeCards({ calc: { input, set } }: { calc: EventCalculatorState }) {
  return (
    <>
      <CalculatorQuantityCard
        title="WAKE plaukimas"
        description="Plaukimas vandenlente kabeline trasa Marso parke."
        price={`${PRICES.wakeRider} € / asm.`}
        label="Dalyviai"
        value={input.wakeRiders}
        max={500}
        onChange={(riders) => set("wakeRiders", riders)}
      />
      <CalculatorOptionCard
        title="Privati WAKE trasa, 2 val."
        description="Visa trasa dviem valandoms tik jūsų grupei."
        price={`${PRICES.wakePrivate.toLocaleString("lt-LT")} €`}
        selected={input.wakePrivate}
        onToggle={() => set("wakePrivate", !input.wakePrivate)}
      />
    </>
  );
}

export function EntertainmentSection({ calc }: { calc: EventCalculatorState }) {
  return (
    <section aria-label="Pramogos" className="@container">
      <div className="grid gap-3 lg:grid-cols-2">
        <WakeCards calc={calc} />
        <SaunaAndQuadCards calc={calc} />
      </div>
    </section>
  );
}
