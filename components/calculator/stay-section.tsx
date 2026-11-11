"use client";

import { StepLabel } from "@/components/booking/step-label";
import { CompactStepper } from "@/components/booking/stepper";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { guestsLabel, stayTypesOf } from "@/lib/cabin";
import { PRICES } from "@/lib/event-pricing";
import { nextDays } from "@/lib/sauna";
import { CalculatorQuantityCard } from "./calculator-option-card";
import { CalculatorSaunaCard } from "./calculator-sauna-card";
import type { EventCalculatorState } from "./use-event-calculator";

const STAY_DATE = new Intl.DateTimeFormat("lt-LT", { weekday: "long", month: "long", day: "numeric" });

export function SaunaAndQuadCards({ calc: { input, set, setSauna, catalog, guests } }: { calc: EventCalculatorState }) {
  return (
    <>
      {catalog.saunas.map((sauna) => (
        <CalculatorSaunaCard key={sauna.id} sauna={sauna} guests={guests} programs={catalog.programs.filter((p) => p.saunaId === sauna.id)} upsells={catalog.upsells.filter((u) => sauna.upsellIds.includes(u.id))} pick={input.saunas[sauna.id]} onChange={(pick) => setSauna(sauna.id, pick)} />
      ))}
      <CalculatorQuantityCard
        title="Keturračiai"
        description="Žygis keturračiais po Marso apylinkes su instruktoriumi."
        price={`${PRICES.atvTour} € / asm.`}
        label="Dalyviai"
        value={input.atvRiders}
        max={100}
        onChange={(riders) => set("atvRiders", riders)}
      />
    </>
  );
}

function CabinOptions({ calc: { input, set, setCabinUnits, stayTypes } }: { calc: EventCalculatorState }) {
  const nights = input.cabinNights;
  const dates = input.date ? nextDays(input.date, nights + 1) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <CompactStepper label="Naktys" value={nights} onChange={(next) => set("cabinNights", next)} min={1} max={14} editable />
        <div aria-live="polite" className="space-y-1 text-xs text-copy">
          {dates ? (
            <>
              <p>Atvykimas · {STAY_DATE.format(dates[0])}</p>
              <p>Išvykimas · {STAY_DATE.format(dates[nights])}</p>
            </>
          ) : (
            <p>Nakvynė prasideda pasirinktą šventės dieną.</p>
          )}
        </div>
      </div>
      <div>
        <OptionGroupLabel>Namelio tipas</OptionGroupLabel>
        <div className="grid gap-3 lg:grid-cols-2">
          {stayTypesOf(stayTypes, "namelis").map(({ id, label, maxGuests, pricePerNight, units }) => (
            <CalculatorQuantityCard
              key={id}
              eyebrow={guestsLabel(maxGuests)}
              title={label}
              price={`${pricePerNight} € už namelį per naktį`}
              label="Kiekis"
              value={input.cabinUnits[id] ?? 0}
              max={units ?? 20}
              onChange={(count) => setCabinUnits(id, count)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-copy">Jei planuoji apsistoti 3 naktims ar ilgiau, susisiek dėl individualaus pasiūlymo.</p>
      </div>
    </div>
  );
}

/** The page and the drawer share the cabin options and the live estimate. */
export function StaySection({ calc, category }: { calc: EventCalculatorState; category?: "overnight" }) {
  return (
    <section className="@container">
      <StepLabel step={7}>Pasiliekam Marse</StepLabel>
      {category === "overnight" ? null : (
        <div className="mb-6 grid gap-3 lg:grid-cols-2">
          <SaunaAndQuadCards calc={calc} />
        </div>
      )}
      <CabinOptions calc={calc} />
    </section>
  );
}
