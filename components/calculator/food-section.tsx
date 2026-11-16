"use client";

import { useId } from "react";
import { Stepper } from "@/components/booking/stepper";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { BUFFET_OPTIONS, CATERING, COFFEE_BREAK, DRINKS, PRICES, formatMoney } from "@/lib/event-pricing";
import { cn } from "@/lib/utils";
import { OptionToggle } from "./option-toggle";
import type { EventCalculatorState } from "./use-event-calculator";

interface FoodSectionProps {
  calc: EventCalculatorState;
}

const MEAL_OPTIONS = [...CATERING].sort((a, b) => a.perAdult - b.perAdult);

export function CateringSection({ calc: { input, set } }: FoodSectionProps) {
  const sliderId = useId();
  const index = Math.max(0, MEAL_OPTIONS.findIndex(({ id }) => id === input.catering));
  const meal = MEAL_OPTIONS[index];
  const buffet = BUFFET_OPTIONS.find(({ id }) => id === meal.id);
  const description = buffet ? `${buffet.hotDishes} karštieji patiekalai` : meal.hint.split(" · ")[0];

  return (
    <div className="space-y-4">
      <div className="space-y-2 border border-line p-4">
        <label htmlFor={sliderId} className="text-micro uppercase">Kaina vienam svečiui</label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={MEAL_OPTIONS.length - 1}
          value={index}
          aria-valuetext={`${meal.label}, ${meal.perAdult} eurų asmeniui. ${description}`}
          onChange={(event) => set("catering", MEAL_OPTIONS[event.currentTarget.valueAsNumber].id)}
          className="block h-11 w-full accent-ink"
        />
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
          {MEAL_OPTIONS.map(({ id, label, perAdult }, position) => (
            <button
              key={id}
              type="button"
              aria-label={`${perAdult} €, ${label}`}
              aria-pressed={position === index}
              onClick={() => set("catering", id)}
              className={cn(
                "min-h-11 border px-1 text-xs font-bold",
                position === index ? "border-ink bg-ink text-dust" : "border-line hover:border-ink",
              )}
            >
              {perAdult} €
            </button>
          ))}
        </div>
        <div aria-live="polite" className="space-y-1 pt-2">
          <p className="text-sm font-bold">{meal.label}</p>
          <p className="text-xs text-copy">{description}</p>
        </div>
      </div>
      <OptionToggle label="Kavos pertrauka" hint={`${formatMoney(COFFEE_BREAK)} / asm.`} checked={input.coffeeBreak} onChange={(next) => set("coffeeBreak", next)} />
    </div>
  );
}

export function DrinksSection({ calc: { input, set } }: FoodSectionProps) {
  return (
    <div className="space-y-2">
      {DRINKS.map((drink) => (
        <Stepper
          key={drink.id}
          label={`${drink.label} (${formatMoney(drink.price)})`}
          value={input.drinks[drink.id]}
          onChange={(next) => set("drinks", { ...input.drinks, [drink.id]: next })}
          min={0}
          max={200}
          editable
        />
      ))}
      <p className="pt-1 text-xs text-copy">Už papildomus užsakymus renginio metu mokama pagal faktinį suvartojimą.</p>
    </div>
  );
}

export function HospitalitySection({ calc: { input, set } }: FoodSectionProps) {
  return (
    <div className="space-y-2">
      <Stepper label={`Barmenai (${PRICES.bartender} €)`} value={input.bartenders} onChange={(next) => set("bartenders", next)} min={0} max={6} editable />
      <OptionToggle label="Šventinis stalo dekoravimas" hint={formatMoney(PRICES.decor)} checked={input.decor} onChange={(next) => set("decor", next)} />
      <OptionToggle label="Stalų serviravimas" hint={`${PRICES.serving} €/asm.`} checked={input.serving} onChange={(next) => set("serving", next)} />
    </div>
  );
}

const FOOD_SECTIONS = [
  { id: "maitinimas", label: "Maitinimas", Section: CateringSection },
  { id: "gerimai", label: "Gėrimai", Section: DrinksSection },
  { id: "aptarnavimas", label: "Aptarnavimas", Section: HospitalitySection },
] as const;

export function FoodSection({ calc }: FoodSectionProps) {
  return (
    <div className="space-y-8">
      {FOOD_SECTIONS.map(({ id, label, Section }) => (
        <section key={id} aria-label={label}>
          <OptionGroupLabel>{label}</OptionGroupLabel>
          <Section calc={calc} />
        </section>
      ))}
    </div>
  );
}
