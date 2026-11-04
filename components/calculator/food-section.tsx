"use client";

import { ChoiceTile } from "@/components/booking/choice-tile";
import { Stepper } from "@/components/booking/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATERING, COFFEE_BREAK, DRINKS, PRICES, formatMoney, type CateringId } from "@/lib/event-pricing";
import { OptionToggle } from "./option-toggle";
import type { EventCalculatorState } from "./use-event-calculator";

interface FoodSectionProps {
  calc: EventCalculatorState;
}

const BUFFET_OPTIONS = CATERING.filter(({ id }) => id.startsWith("bufetas-"));
const OTHER_OPTIONS = CATERING.filter(({ id }) => !id.startsWith("bufetas-"));

export function CateringSection({ calc: { input, set } }: FoodSectionProps) {
  const select = (id: CateringId) => set("catering", input.catering === id ? null : id);

  return (
    <div className="space-y-4">
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-bold">{BUFFET_OPTIONS[0].label}</legend>
        <div className="flex flex-wrap gap-2">
          {BUFFET_OPTIONS.map(({ id, hint }) => {
            const active = input.catering === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => select(id)}
                className={`min-h-11 flex-1 basis-32 border px-2 py-2 text-xs font-bold ${active ? "border-ink bg-ink text-dust" : "border-line hover:border-ink"}`}
              >
                {hint}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-copy">Vaikams iki 3 m. švediškas stalas nemokamas. Vaikams 3–10 m. taikoma 50 % nuolaida.</p>
      </fieldset>
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

const FOOD_TABS = [
  { id: "maitinimas", label: "Maitinimas", Section: CateringSection },
  { id: "gerimai", label: "Gėrimai", Section: DrinksSection },
  { id: "aptarnavimas", label: "Aptarnavimas", Section: HospitalitySection },
] as const;

export function FoodSection({ calc }: FoodSectionProps) {
  return (
    <Tabs defaultValue={FOOD_TABS[0].id} className="gap-4">
      <TabsList aria-label="Maisto pasirinkimai" className="grid w-full grid-cols-3 divide-x divide-line border border-line bg-transparent p-0 group-data-horizontal/tabs:h-auto">
        {FOOD_TABS.map(({ id, label }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="h-full min-h-11 min-w-0 rounded-none px-1 py-2 text-xs wrap-break-word whitespace-normal text-ink data-active:bg-ink data-active:text-dust"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {FOOD_TABS.map(({ id, Section }) => (
        <TabsContent key={id} value={id}>
          <Section calc={calc} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
