"use client";

import { StepLabel } from "@/components/booking/step-label";
import { Stepper } from "@/components/booking/stepper";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { CABIN_SIZES } from "@/lib/cabin";
import { PRICES, formatMoney } from "@/lib/event-pricing";
import { DEFAULT_SAUNA_RATES, nextDays, sessionPrice } from "@/lib/sauna";
import { CalculatorQuantityCard } from "./calculator-option-card";
import { OptionToggle } from "./option-toggle";
import type { EventCalculatorState } from "./use-event-calculator";

const STAY_DATE = new Intl.DateTimeFormat("lt-LT", { weekday: "long", month: "long", day: "numeric" });

export function SaunaAndQuadCards({ calc: { input, set, guests } }: { calc: EventCalculatorState }) {
  const minSaunaHours = DEFAULT_SAUNA_RATES.minHours;

  return (
    <>
      <CalculatorQuantityCard
        title="Pirtis"
        description={`Privati malkomis kūrenama pirtis prie ežero jūsų svečiams, nuo ${minSaunaHours} val.`}
        price={`Nuo ${sessionPrice(minSaunaHours, guests).toLocaleString("lt-LT")} €`}
        label="Valandos"
        value={input.saunaHours}
        min={minSaunaHours}
        max={8}
        onChange={(hours) => set("saunaHours", hours)}
      >
        <div className="min-w-0 grow basis-40 bg-dust">
          <OptionToggle label="Pirtininkas" hint={`+${formatMoney(PRICES.saunaMaster)}`} checked={input.saunaMaster} onChange={(selected) => set("saunaMaster", selected)} />
        </div>
      </CalculatorQuantityCard>
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

function CabinOptions({ calc: { input, set, setCabinUnits } }: { calc: EventCalculatorState }) {
  const nights = input.cabinNights;
  const dates = input.date ? nextDays(input.date, nights + 1) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Stepper label="Naktys" value={nights} onChange={(next) => set("cabinNights", next)} min={1} max={14} editable compact />
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
          {CABIN_SIZES.map(({ id, label, name, pricePerNight, count }) => (
            <CalculatorQuantityCard
              key={id}
              eyebrow={label}
              title={name}
              price={`${pricePerNight} € / naktį`}
              label="Kiekis"
              value={input.cabinUnits[id]}
              max={count}
              onChange={(units) => setCabinUnits(id, units)}
            />
          ))}
        </div>
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
