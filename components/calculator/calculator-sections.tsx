"use client";

import { ClockIcon, UsersIcon } from "@phosphor-icons/react";
import { useId, type ComponentType } from "react";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { FieldHeading } from "@/components/booking/field-heading";
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

function TypeSection({ calc: { input, set, applyPreset } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={1}>Renginio tipas</StepLabel>
      <PresetPicker selected={input.preset} onSelect={(id) => (input.preset === id ? set("preset", null) : applyPreset(id))} />
      <p className="mt-3 text-xs text-copy">Pagal renginio tipą parenkame įprastą asmenų skaičių. Erdvę, datą ir kitus pasirinkimus gali keisti.</p>
    </section>
  );
}

function DateTimeFields({ calc: { input, chooseDate, chooseEnd, chooseTime, today, stayDetails, guests } }: SectionProps) {
  return (
    <div className="space-y-3">
      <EventDatePicker today={today} value={input.date} end={input.endDate} onChange={chooseDate} onEnd={chooseEnd} stayDetails={stayDetails} />
      {stayDetails ? <p className="text-xs text-copy">Po kiekviena diena rodome laisvus namelius iš visų (žalia, kai jų pakanka {guests} asm. grupei; pasirinkus pabaigos datą, skaičiuojamos visos naktys).</p> : null}
      {input.date ? (
        <fieldset>
          <FieldHeading as="legend" icon={ClockIcon} className="mb-2">Renginio laikas</FieldHeading>
          <div className="grid grid-cols-2 gap-2">
            <ChoiceTile primary="Dienos metu" secondary="Iki 17:00" active={input.eventTime === "daytime"} onClick={() => chooseTime("daytime")} />
            <ChoiceTile primary="Vakare" secondary="Nuo 17:00" active={input.eventTime === "evening"} onClick={() => chooseTime("evening")} />
          </div>
        </fieldset>
      ) : null}
      {input.preset === "stovykla" && input.endDate ? <p className="text-xs text-copy">Stovykla trunka {input.campDays} d. ({input.campDays - 1} n.).</p> : null}
    </div>
  );
}

function GuestSlider({ calc: { set, guests, guestLimit, input } }: SectionProps) {
  const guestsId = useId();

  return (
    <div className="border border-line p-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={guestsId} className="flex items-center gap-2 text-sm font-bold"><UsersIcon size={18} aria-hidden /> Asmenų skaičius</label>
        <span className="bg-ink px-2 py-1 text-xs font-bold text-dust">{guests} asm.</span>
      </div>
      <input
        id={guestsId}
        type="range"
        min={1}
        max={guestLimit}
        value={guests}
        onChange={(event) => set("adults", event.currentTarget.valueAsNumber)}
        className="block h-11 w-full accent-ink"
      />
      <div className="flex justify-between text-xs text-copy"><span>1 asm.</span><span>{guestLimit} asm.</span></div>
      {input.preset === "stovykla" ? <p className="mt-2 text-xs text-copy">Stovyklos asmenų skaičius ribojamas miegamų vietų namelių skaičiumi.</p> : null}
    </div>
  );
}

function GuestsSection({ calc }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={2}>Asmenys ir data</StepLabel>
      <DateTimeFields calc={calc} />
      <div className="mt-8"><GuestSlider calc={calc} /></div>
    </section>
  );
}

/** Standalone-page pieces: the group size first (it decides which spaces fit), then the date with its calendar already open. */
export function PartySection({ calc }: SectionProps) {
  return <section className="@container"><GuestSlider calc={calc} /></section>;
}

export function WhenSection({ calc }: SectionProps) {
  return <section className="@container"><DateTimeFields calc={calc} /></section>;
}

function SpaceSection({ calc: { input, set, guests, extraHour } }: SectionProps) {
  return (
    <section className="@container">
      <StepLabel step={3}>Erdvė</StepLabel>
      <SpacePicker selected={input.spaces} day={input.day} guests={guests} camp={input.preset === "stovykla"} onChange={(spaces) => set("spaces", spaces)} />
      {extraHour ? (
        <div className="mt-3">
          <Stepper
            label={`${extraHour.label} (+${extraHour.rate} €/val.)`}
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
  { id: "guests", label: "Asmenys ir data", Section: GuestsSection },
  { id: "space", label: "Erdvė", Section: SpaceSection },
  { id: "catering", label: "Maitinimas", Section: CateringSection },
  { id: "drinks", label: "Gėrimai", Section: DrinksSection },
  { id: "extras", label: "Paslaugos ir pramogos", Section: ExtrasSection },
  { id: "stay", label: "Pasiliekam Marse", Section: StaySection },
];
