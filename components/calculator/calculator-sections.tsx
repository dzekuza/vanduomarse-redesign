"use client";

import type { ComponentType } from "react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
import { CATERING, COFFEE_BREAK, DRINKS, PRICES, formatMoney } from "@/lib/event-pricing";
import { OptionToggle } from "./option-toggle";
import { PresetPicker } from "./preset-picker";
import { SpacePicker } from "./space-picker";
import type { EventCalculatorState } from "./use-event-calculator";

interface SectionProps {
  calc: EventCalculatorState;
}

function TypeSection({ calc: { input, applyPreset } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={1}>Renginio tipas</StepLabel>
      <PresetPicker selected={input.preset} onSelect={applyPreset} />
      <p className="mt-2 text-sm text-ink/60">Pasirinkus tipą užpildome tipinį variantą – viską galima keisti.</p>
    </section>
  );
}

function GuestsSection({ calc: { input, set } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={2}>Svečiai ir laikas</StepLabel>
      <div className="grid gap-3 @xl:grid-cols-2">
        <Stepper label="Suaugę" value={input.adults} onChange={(v) => set("adults", v)} min={1} max={500} />
        <Stepper label="Vaikai 3–10 m." value={input.kids} onChange={(v) => set("kids", v)} min={0} max={200} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ChoiceTile primary="Darbo diena" secondary="I–IV, dienos metu" active={input.day === "weekday"} onClick={() => set("day", "weekday")} />
        <ChoiceTile primary="Vakaras / savaitgalis" secondary="Po 17:00, V–VII" active={input.day === "weekend"} onClick={() => set("day", "weekend")} />
      </div>
    </section>
  );
}

function SpaceSection({ calc: { input, set, guests, space } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={3}>Erdvė</StepLabel>
      <SpacePicker selected={input.space} day={input.day} guests={guests} onSelect={(id) => set("space", id)} />
      {space.extraHour ? (
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
          <ChoiceTile key={c.id} primary={c.label} secondary={c.hint} active={input.catering === c.id} onClick={() => set("catering", c.id)} />
        ))}
      </div>
      <p className="mt-2 text-sm text-ink/60">Vaikams 3–10 m. švediškas stalas –50%, iki 3 m. nemokamai.</p>
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
      <p className="mt-2 text-sm text-ink/60">Papildomi užsakymai renginio metu – pagal faktinį suvartojimą.</p>
    </section>
  );
}

function ExtrasSection({ calc: { input, set } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={6}>Paslaugos ir pramogos</StepLabel>
      <div className="grid gap-3 @xl:grid-cols-2">
        <Stepper label={`Barmenai (${PRICES.bartender} €)`} value={input.bartenders} onChange={(v) => set("bartenders", v)} min={0} max={6} />
        <Stepper label="Pirtis, val. (min. 2)" value={input.saunaHours} onChange={(v) => set("saunaHours", v === 1 ? (input.saunaHours > 1 ? 0 : 2) : v)} min={0} max={8} />
        <Stepper label={`WAKE plaukimas (${PRICES.wakeRider} €/asm.)`} value={input.wakeRiders} onChange={(v) => set("wakeRiders", v)} min={0} max={500} />
        <Stepper label={`Keturračių turas (${PRICES.atvTour} €/asm.)`} value={input.atvRiders} onChange={(v) => set("atvRiders", v)} min={0} max={100} />
        <Stepper label={`Nakvynė, asm. (${formatMoney(PRICES.cabinNight)})`} value={input.cabinGuests} onChange={(v) => set("cabinGuests", v)} min={0} max={PRICES.cabinBeds} />
        {input.cabinGuests > 0 ? <Stepper label="Naktys" value={input.cabinNights} onChange={(v) => set("cabinNights", v)} min={1} max={7} /> : null}
      </div>
      <div className="mt-3 grid gap-3 @xl:grid-cols-2">
        <OptionToggle label="Šventinis stalo dekoravimas" hint={formatMoney(PRICES.decor)} checked={input.decor} onChange={(v) => set("decor", v)} />
        <OptionToggle label="Stalų serviravimas" hint={`${PRICES.serving} €/asm.`} checked={input.serving} onChange={(v) => set("serving", v)} />
        <OptionToggle label="Privati WAKE trasa, 2 val." hint={`${PRICES.wakePrivate.toLocaleString("lt-LT")} €`} checked={input.wakePrivate} onChange={(v) => set("wakePrivate", v)} />
        {input.saunaHours > 0 ? <OptionToggle label="Pirtininkas" hint={formatMoney(PRICES.saunaMaster)} checked={input.saunaMaster} onChange={(v) => set("saunaMaster", v)} /> : null}
      </div>
    </section>
  );
}

/** The calculator's questions in order: the page shows them all, the drawer one per step. */
export const CALCULATOR_SECTIONS: { id: string; label: string; Section: ComponentType<SectionProps> }[] = [
  { id: "type", label: "Renginio tipas", Section: TypeSection },
  { id: "guests", label: "Svečiai ir laikas", Section: GuestsSection },
  { id: "space", label: "Erdvė", Section: SpaceSection },
  { id: "catering", label: "Maitinimas", Section: CateringSection },
  { id: "drinks", label: "Gėrimai", Section: DrinksSection },
  { id: "extras", label: "Paslaugos ir pramogos", Section: ExtrasSection },
];
