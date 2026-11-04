"use client";

import type { ComponentType } from "react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
import { CATERING, COFFEE_BREAK, DRINKS, PRICES, formatMoney } from "@/lib/event-pricing";
import { EventDatePicker } from "./event-date-picker";
import { OptionToggle } from "./option-toggle";
import { PresetPicker } from "./preset-picker";
import { SpacePicker } from "./space-picker";
import { StaySection } from "./stay-section";
import type { EventCalculatorState } from "./use-event-calculator";

interface SectionProps {
  calc: EventCalculatorState;
}

function TypeSection({ calc: { input, set, applyPreset } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={1}>Renginio tipas</StepLabel>
      <PresetPicker selected={input.preset} onSelect={(id) => (input.preset === id ? set("preset", null) : applyPreset(id))} />
      <p className="mt-3 text-xs text-copy">Pagal renginio tipą parenkame įprastą svečių skaičių. Erdvę, datą ir kitus pasirinkimus gali keisti.</p>
    </section>
  );
}

function GuestsSection({ calc: { input, set, chooseDate, today } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={2}>Svečiai ir data</StepLabel>
      <EventDatePicker today={today} value={input.date} onChange={chooseDate} />
      <div className="grid gap-3 @xl:grid-cols-2">
        <Stepper label="Suaugę" value={input.adults} onChange={(v) => set("adults", v)} min={1} max={500} />
        <Stepper label="Vaikai 3–10 m." value={input.kids} onChange={(v) => set("kids", v)} min={0} max={200} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ChoiceTile primary="Darbo diena" secondary="I–IV, dienos metu" active={input.day === "weekday"} onClick={() => set("day", input.day === "weekday" ? null : "weekday")} />
        <ChoiceTile primary="Vakaras / savaitgalis" secondary="Po 17:00, V–VII" active={input.day === "weekend"} onClick={() => set("day", input.day === "weekend" ? null : "weekend")} />
      </div>
    </section>
  );
}

function SpaceSection({ calc: { input, set, guests, space } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={3}>Erdvė</StepLabel>
      <SpacePicker selected={input.space} day={input.day} guests={guests} onSelect={(id) => set("space", input.space === id ? null : id)} />
      {space?.extraHour ? (
        <div className="mt-3">
          <Stepper
            label={`${space.extraHour.label} (+${space.extraHour.rate} €/val.)`}
            value={input.extraHours}
            onChange={(v) => set("extraHours", v)}
            min={0}
            max={8}
          />
        </div>
      ) : null}
    </section>
  );
}

function CateringSection({ calc: { input, set } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={4}>Maitinimas</StepLabel>
      <div className="grid grid-cols-2 gap-2 @xl:grid-cols-3">
        {CATERING.map((c) => (
          <ChoiceTile key={c.id} primary={c.label} secondary={c.hint} active={input.catering === c.id} onClick={() => set("catering", input.catering === c.id ? null : c.id)} />
        ))}
      </div>
      <p className="mt-3 text-xs text-copy">Vaikams iki 3 m. švediškas stalas nemokamas. Vaikams 3–10 m. taikoma 50 % nuolaida.</p>
      <div className="mt-3">
        <OptionToggle label="Kavos pertrauka" hint={`${formatMoney(COFFEE_BREAK)} / asm.`} checked={input.coffeeBreak} onChange={(v) => set("coffeeBreak", v)} />
      </div>
    </section>
  );
}

function DrinksSection({ calc: { input, set } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={5}>Gėrimai</StepLabel>
      <div className="grid gap-3 @xl:grid-cols-2">
        {DRINKS.map((d) => (
          <Stepper
            key={d.id}
            label={`${d.label} (${formatMoney(d.price)})`}
            value={input.drinks[d.id]}
            onChange={(v) => set("drinks", { ...input.drinks, [d.id]: v })}
            min={0}
            max={200}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-copy">Už papildomus užsakymus renginio metu mokama pagal faktinį suvartojimą.</p>
    </section>
  );
}

export function ExtrasSection({ calc: { input, set }, category }: SectionProps & { category?: "hospitality" | "entertainment" }) {
  const hospitality = category !== "entertainment";
  const entertainment = category !== "hospitality";

  return (
    <section className="@container">
      <StepLabel step={6}>Paslaugos ir pramogos</StepLabel>
      <div className="grid gap-3 @xl:grid-cols-2">
        {hospitality ? <Stepper label={`Barmenai (${PRICES.bartender} €)`} value={input.bartenders} onChange={(v) => set("bartenders", v)} min={0} max={6} /> : null}
        {entertainment ? <Stepper label={`WAKE plaukimas (${PRICES.wakeRider} €/asm.)`} value={input.wakeRiders} onChange={(v) => set("wakeRiders", v)} min={0} max={500} /> : null}
        {hospitality ? (
          <>
            <OptionToggle label="Šventinis stalo dekoravimas" hint={formatMoney(PRICES.decor)} checked={input.decor} onChange={(v) => set("decor", v)} />
            <OptionToggle label="Stalų serviravimas" hint={`${PRICES.serving} €/asm.`} checked={input.serving} onChange={(v) => set("serving", v)} />
          </>
        ) : null}
        {entertainment ? <OptionToggle label="Privati WAKE trasa, 2 val." hint={`${PRICES.wakePrivate.toLocaleString("lt-LT")} €`} checked={input.wakePrivate} onChange={(v) => set("wakePrivate", v)} /> : null}
      </div>
    </section>
  );
}

/** Shared question sections in the drawer's step order. */
export const CALCULATOR_SECTIONS: { id: string; label: string; Section: ComponentType<SectionProps> }[] = [
  { id: "type", label: "Renginio tipas", Section: TypeSection },
  { id: "guests", label: "Svečiai ir data", Section: GuestsSection },
  { id: "space", label: "Erdvė", Section: SpaceSection },
  { id: "catering", label: "Maitinimas", Section: CateringSection },
  { id: "drinks", label: "Gėrimai", Section: DrinksSection },
  { id: "extras", label: "Paslaugos ir pramogos", Section: ExtrasSection },
  { id: "stay", label: "Pasiliekam Marse", Section: StaySection },
];
