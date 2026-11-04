"use client";

import type { ComponentType } from "react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { WakeCards } from "./entertainment-section";
import { EventDatePicker } from "./event-date-picker";
import { CateringSection, DrinksSection, HospitalitySection } from "./food-section";
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
      <div className="space-y-3">
        <EventDatePicker today={today} value={input.date} onChange={chooseDate} />
        <div className="grid grid-cols-2 gap-2">
          <ChoiceTile primary="Darbo diena" secondary="I–IV, dienos metu" active={input.day === "weekday"} onClick={() => set("day", input.day === "weekday" ? null : "weekday")} />
          <ChoiceTile primary="Vakaras / savaitgalis" secondary="Po 17:00, V–VII" active={input.day === "weekend"} onClick={() => set("day", input.day === "weekend" ? null : "weekend")} />
        </div>
      </div>
      <div className="mt-8">
        <OptionGroupLabel>Svečiai</OptionGroupLabel>
        <div className="grid gap-3 @xl:grid-cols-2">
          <Stepper label="Suaugę" value={input.adults} onChange={(v) => set("adults", v)} min={1} max={500} editable />
          <Stepper label="Vaikai 3–10 m." value={input.kids} onChange={(v) => set("kids", v)} min={0} max={200} editable />
        </div>
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
            editable
          />
        </div>
      ) : null}
    </section>
  );
}

function ExtrasSection({ calc }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={6}>Paslaugos ir pramogos</StepLabel>
      <HospitalitySection calc={calc} />
      <div className="mt-3 grid gap-3 @xl:grid-cols-2"><WakeCards calc={calc} /></div>
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
