"use client";

import { useState } from "react";
import { EstimateSummary } from "./estimate-summary";
import { OptionToggle } from "./option-toggle";
import { PresetPicker } from "./preset-picker";
import { SpacePicker } from "./space-picker";
import { ChoiceTile } from "@/components/booking/choice-tile";
import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
import {
  CATERING,
  COFFEE_BREAK,
  DEFAULT_INPUT,
  DRINKS,
  PRESETS,
  PRICES,
  SPACES,
  estimate,
  formatMoney,
  type EstimateInput,
  type PresetId,
} from "@/lib/event-pricing";

/** Event price calculator: pick a type, guests, space, catering and extras; see a live range. */
export function EventCalculator() {
  const [input, setInput] = useState<EstimateInput>(DEFAULT_INPUT);
  const set = <K extends keyof EstimateInput>(key: K, value: EstimateInput[K]) => setInput((s) => ({ ...s, [key]: value }));

  const result = estimate(input);
  const guests = input.adults + input.kids;
  const space = SPACES.find((s) => s.id === input.space)!;
  const preset = PRESETS.find((p) => p.id === input.preset) ?? null;

  function applyPreset(id: PresetId) {
    const p = PRESETS.find((x) => x.id === id)!;
    setInput({ ...DEFAULT_INPUT, ...p.apply, preset: id });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-12">
      <div className="min-w-0 space-y-10">
        <section>
          <StepLabel step={1}>Renginio tipas</StepLabel>
          <PresetPicker selected={input.preset} onSelect={applyPreset} />
          <p className="mt-2 text-sm text-ink/60">Pasirinkus tipą užpildome tipinį variantą – viską galima keisti.</p>
        </section>

        <section>
          <StepLabel step={2}>Svečiai ir laikas</StepLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stepper label="Suaugę" value={input.adults} onChange={(v) => set("adults", v)} min={1} max={500} />
            <Stepper label="Vaikai 3–10 m." value={input.kids} onChange={(v) => set("kids", v)} min={0} max={200} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ChoiceTile primary="Darbo diena" secondary="I–IV, dienos metu" active={input.day === "weekday"} onClick={() => set("day", "weekday")} />
            <ChoiceTile primary="Vakaras / savaitgalis" secondary="Po 17:00, V–VII" active={input.day === "weekend"} onClick={() => set("day", "weekend")} />
          </div>
        </section>

        <section>
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

        <section>
          <StepLabel step={4}>Maitinimas</StepLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATERING.map((c) => (
              <ChoiceTile key={c.id} primary={c.label} secondary={c.hint} active={input.catering === c.id} onClick={() => set("catering", c.id)} />
            ))}
          </div>
          <p className="mt-2 text-sm text-ink/60">Vaikams 3–10 m. švediškas stalas –50%, iki 3 m. nemokamai.</p>
          <div className="mt-3">
            <OptionToggle
              label="Kavos pertrauka"
              hint={`${formatMoney(COFFEE_BREAK)} / asm.`}
              checked={input.coffeeBreak}
              onChange={(v) => set("coffeeBreak", v)}
            />
          </div>
        </section>

        <section>
          <StepLabel step={5}>Gėrimai</StepLabel>
          <div className="grid gap-3 sm:grid-cols-2">
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

        <section>
          <StepLabel step={6}>Paslaugos ir pramogos</StepLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stepper label={`Barmenai (${PRICES.bartender} €)`} value={input.bartenders} onChange={(v) => set("bartenders", v)} min={0} max={6} />
            <Stepper label="Pirtis, val. (min. 2)" value={input.saunaHours} onChange={(v) => set("saunaHours", v === 1 ? (input.saunaHours > 1 ? 0 : 2) : v)} min={0} max={8} />
            <Stepper label={`WAKE plaukimas (${PRICES.wakeRider} €/asm.)`} value={input.wakeRiders} onChange={(v) => set("wakeRiders", v)} min={0} max={500} />
            <Stepper label={`Keturračių turas (${PRICES.atvTour} €/asm.)`} value={input.atvRiders} onChange={(v) => set("atvRiders", v)} min={0} max={100} />
            <Stepper label={`Nakvynė, asm. (${formatMoney(PRICES.cabinNight)})`} value={input.cabinGuests} onChange={(v) => set("cabinGuests", v)} min={0} max={PRICES.cabinBeds} />
            {input.cabinGuests > 0 ? (
              <Stepper label="Naktys" value={input.cabinNights} onChange={(v) => set("cabinNights", v)} min={1} max={7} />
            ) : null}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <OptionToggle label="Šventinis stalo dekoravimas" hint={formatMoney(PRICES.decor)} checked={input.decor} onChange={(v) => set("decor", v)} />
            <OptionToggle label="Stalų serviravimas" hint={`${PRICES.serving} €/asm.`} checked={input.serving} onChange={(v) => set("serving", v)} />
            <OptionToggle label="Privati WAKE trasa, 2 val." hint={`${PRICES.wakePrivate.toLocaleString("lt-LT")} €`} checked={input.wakePrivate} onChange={(v) => set("wakePrivate", v)} />
            {input.saunaHours > 0 ? (
              <OptionToggle label="Pirtininkas" hint={formatMoney(PRICES.saunaMaster)} checked={input.saunaMaster} onChange={(v) => set("saunaMaster", v)} />
            ) : null}
          </div>
        </section>
      </div>

      <div id="samata" className="min-w-0 scroll-mt-28 lg:sticky lg:top-28">
        <EstimateSummary estimate={result} guests={guests} typical={preset ? { label: preset.label, perGuest: preset.perGuest } : null} />
      </div>

      <MobileTotalBar total={formatMoney(result.total)} />
    </div>
  );
}

/** On small screens the summary sits below a long form: keep the total in view. */
function MobileTotalBar({ total }: { total: string }) {
  return (
    <a
      href="#samata"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-ink bg-ink px-6 py-3 text-foam lg:hidden"
    >
      <span className="text-xs uppercase text-foam/70">Preliminari kaina</span>
      <span className="font-display text-lg font-bold">{total}</span>
    </a>
  );
}
