"use client";

import { useId, type ComponentType } from "react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
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

function TypeSection({ calc: { input, set, applyPreset, catalog } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={1}>Renginio tipas</StepLabel>
      <PresetPicker presets={catalog.presets} selected={input.preset} onSelect={(id) => (input.preset === id ? set("preset", null) : applyPreset(id))} />
      <p className="mt-3 text-xs text-copy">Pagal renginio tipą parenkame įprastą svečių skaičių. Erdvę, datą ir kitus pasirinkimus gali keisti.</p>
    </section>
  );
}

function GuestsSection({ calc: { input, set, chooseDate, chooseTime, guests, today } }: SectionProps) {
  const guestsId = useId();

  return (
    <section className="@container">
      <StepLabel step={2}>Svečiai ir data</StepLabel>
      <div className="space-y-3">
        <EventDatePicker today={today} value={input.date} onChange={chooseDate} />
        {input.date ? (
          <fieldset>
            <legend className="mb-2 text-micro uppercase">Renginio laikas</legend>
            <div className="grid grid-cols-2 gap-2">
              <ChoiceTile primary="Dienos metu" secondary="Iki 17:00" active={input.eventTime === "daytime"} onClick={() => chooseTime("daytime")} />
              <ChoiceTile primary="Vakare" secondary="Nuo 17:00" active={input.eventTime === "evening"} onClick={() => chooseTime("evening")} />
            </div>
          </fieldset>
        ) : null}
      </div>
      <div className="mt-8 border border-line p-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={guestsId} className="text-sm font-bold">Svečių skaičius</label>
          <span className="bg-ink px-2 py-1 text-xs font-bold text-dust">{guests} asm.</span>
        </div>
        <input
          id={guestsId}
          type="range"
          min={1}
          max={500}
          value={guests}
          onChange={(event) => set("adults", event.currentTarget.valueAsNumber)}
          className="block h-11 w-full accent-ink"
        />
        <div className="flex justify-between text-xs text-copy"><span>1 asm.</span><span>500 asm.</span></div>
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
