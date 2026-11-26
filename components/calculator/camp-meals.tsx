"use client";

import { Stepper } from "@/components/booking/stepper";
import { CAMP_MEALS, CAMP_WEEKEND_MEALS, formatMoney } from "@/lib/event-pricing";
import type { EventCalculatorState } from "./use-event-calculator";

const WEEKEND_PRICE = CAMP_MEALS.reduce((sum, meal) => sum + meal.price * CAMP_WEEKEND_MEALS[meal.id], 0);

/** Camp meals: how many of each kind over the whole stay, per guest. One button fills the usual Friday-to-Sunday set. */
export function CampMeals({ calc: { input, set } }: { calc: EventCalculatorState }) {
  const weekendChosen = CAMP_MEALS.every((meal) => input.campMeals[meal.id] === CAMP_WEEKEND_MEALS[meal.id]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        aria-pressed={weekendChosen}
        onClick={() => set("campMeals", { ...CAMP_WEEKEND_MEALS })}
        className={`flex min-h-11 w-full flex-col items-start border px-4 py-2 text-left text-xs transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-98 ${
          weekendChosen ? "border-ink bg-ink text-dust" : "border-line text-ink hover:border-ink"
        }`}
      >
        <span className="font-bold">Savaitgalio paketas · {formatMoney({ min: WEEKEND_PRICE, max: WEEKEND_PRICE })} / asm.</span>
        <span className={weekendChosen ? "text-dust/75" : "text-copy"}>Penktadienio vakarienė, šeštadienio pusryčiai, pietūs ir vakarienė, sekmadienio pusryčiai</span>
      </button>
      {CAMP_MEALS.map((meal) => (
        <Stepper
          key={meal.id}
          label={`${meal.label} (${meal.price} €/asm.)`}
          value={input.campMeals[meal.id]}
          onChange={(next) => set("campMeals", { ...input.campMeals, [meal.id]: next })}
          min={0}
          max={20}
          editable
        />
      ))}
      <p className="text-xs text-copy">Pusryčiai su gėrimais (vanduo, kava, arbata), sultys papildomai. Kaina vienam asmeniui už kiekvieną porciją.</p>
    </div>
  );
}
