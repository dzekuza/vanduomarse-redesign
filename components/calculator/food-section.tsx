"use client";

import { useId, useState } from "react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { Stepper } from "@/components/booking/stepper";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { BUFFET_OPTIONS, CATERING, COFFEE_BREAK, DRINKS, PRICES, formatMoney, type CateringId } from "@/lib/event-pricing";
import { CalculatorOptionCard } from "./calculator-option-card";
import { OptionToggle } from "./option-toggle";
import type { EventCalculatorState } from "./use-event-calculator";

interface FoodSectionProps {
  calc: EventCalculatorState;
}

const OTHER_OPTIONS = CATERING.filter(({ id }) => !id.startsWith("bufetas-"));

export function CateringSection({ calc: { input, set } }: FoodSectionProps) {
  const sliderId = useId();
  const [previewIndex, setPreviewIndex] = useState(0);
  const selectedIndex = BUFFET_OPTIONS.findIndex(({ id }) => id === input.catering);
  const selected = selectedIndex >= 0;
  const index = selected ? selectedIndex : previewIndex;
  const buffet = BUFFET_OPTIONS[index];
  const packageLabel = `${index + 1} paketas`;
  const select = (id: CateringId) => set("catering", input.catering === id ? null : id);

  return (
    <div className="space-y-4">
      <CalculatorOptionCard
        title={buffet.label}
        price={`${buffet.perAdult} € / asm.`}
        selected={selected}
        onToggle={() => {
          setPreviewIndex(index);
          select(buffet.id);
        }}
      >
        <div>
          <label htmlFor={sliderId} className="text-micro uppercase">Kaina vienam suaugusiajam</label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={BUFFET_OPTIONS.length - 1}
            step={1}
            value={index}
            aria-valuetext={`${packageLabel}, ${buffet.perAdult} eurų vienam asmeniui, ${buffet.hotDishes} karštieji patiekalai`}
            onChange={(event) => {
              const nextIndex = event.currentTarget.valueAsNumber;
              setPreviewIndex(nextIndex);
              if (selected) set("catering", BUFFET_OPTIONS[nextIndex].id);
            }}
            className={`block h-11 w-full cursor-pointer ${selected ? "accent-dust" : "accent-ink"}`}
          />
          <div aria-hidden className="flex justify-between text-xs">
            {BUFFET_OPTIONS.map(({ id, perAdult }, position) => (
              <span key={id} className={index === position ? "font-bold" : selected ? "text-dust/80" : "text-copy"}>{perAdult} €</span>
            ))}
          </div>
        </div>
        <p className="text-sm"><span className="font-bold">{packageLabel}</span> · {buffet.hotDishes} karštieji patiekalai</p>
      </CalculatorOptionCard>
      <p className="text-xs text-copy">Vaikams iki 3 m. švediškas stalas nemokamas. Vaikams 3–10 m. taikoma 50 % nuolaida.</p>
      <div className="flex flex-wrap gap-2 [&>*]:flex-1 [&>*]:basis-32">
        {OTHER_OPTIONS.map(({ id, label, hint }) => (
          <ChoiceTile key={id} primary={label} secondary={hint} active={input.catering === id} onClick={() => select(id)} />
        ))}
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
