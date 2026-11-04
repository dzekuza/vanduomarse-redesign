"use client";

import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { TextCtaArrow, ctaClass } from "@/components/cta";
import { Panel } from "@/components/panel";
import { DurationGrid, StartGrid } from "@/components/quads/quad-time-pickers";
import type { QuadPageData } from "@/lib/data/public-types";
import { MAX_QUAD_RENTAL_UNITS, type QuadType } from "@/lib/quads";
import type { QuadPick, QuadPlan, When } from "@/lib/reservation";
import { pastHourOn } from "@/lib/sauna";
import { OptionGroupLabel } from "./option-card";

interface QuadOptionsProps {
  plan: QuadPlan;
  data: QuadPageData;
  when: When;
  /** Already in the plan: only then are the time pickers shown. */
  included: boolean;
  /** Hours the sauna holds in the plan: the rental can't overlap them. */
  busy: readonly number[];
  onChange: (pick: QuadPick) => void;
}

/** Separate quantities for each quad type, with one time and duration for the rental. */
export function QuadOptions({ plan, data, when, included, busy, onChange }: QuadOptionsProps) {
  const { quantities, items, units: totalUnits, startHour, hours } = plan;
  const pick: QuadPick = { quantities, startHour, hours };

  function changeQuantity(id: string, units: number) {
    const next = { ...quantities };
    if (units === 0) delete next[id];
    else next[id] = units;
    onChange({ ...pick, quantities: next });
  }

  return (
    <>
      <div>
        <OptionGroupLabel>Keturračiai</OptionGroupLabel>
        <div role="group" aria-label="Keturračių tipai ir kiekiai" className="grid gap-3 lg:grid-cols-2">
          {data.types.map((type) => {
            const count = quantities[type.id] ?? 0;
            const max = Math.max(0, Math.min(type.units, MAX_QUAD_RENTAL_UNITS - (totalUnits - count)));
            return (
              <QuadQuantityCard
                key={type.id}
                type={type}
                count={count}
                max={max}
                onChange={(units) => changeQuantity(type.id, units)}
              />
            );
          })}
        </div>
      </div>
      {included && items.length > 0 ? (
        <>
          <div>
            <OptionGroupLabel>Pradžios laikas</OptionGroupLabel>
            <StartGrid
              items={items}
              settings={data.settings}
              taken={data.taken}
              day={when.day}
              busy={busy}
              pastHour={pastHourOn(when.day, data.today, data.nowHour)}
              selected={startHour}
              onSelect={(next) => onChange({ ...pick, startHour: next })}
            />
          </div>
          {startHour !== null && plan.maxHours > 0 ? (
            <div>
              <OptionGroupLabel>Trukmė</OptionGroupLabel>
              <DurationGrid
                items={items}
                settings={data.settings}
                taken={data.taken}
                day={when.day}
                busy={busy}
                startHour={startHour}
                selected={hours}
                onSelect={(next) => onChange({ ...pick, hours: next })}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

interface QuadQuantityCardProps {
  type: QuadType;
  count: number;
  max: number;
  onChange: (count: number) => void;
}

function QuadQuantityCard({ type, count, max, onChange }: QuadQuantityCardProps) {
  const [draft, setDraft] = useState(1);
  const selected = count > 0;
  const quantity = selected ? count : Math.min(draft, max);
  const copy = selected ? "text-dust/80" : "text-copy";
  const line = selected ? "border-line-on-ink" : "border-line";

  return (
    <Panel
      as="article"
      aria-label={type.name}
      className={`flex min-w-0 flex-col gap-4 transition-colors duration-150 ease-out-strong ${selected ? "border-ink bg-ink text-dust" : ""}`}
    >
      <div className="space-y-2">
        <div className={`flex flex-wrap justify-between gap-2 text-micro uppercase ${copy}`}>
          <span>{type.seats === 1 ? "1 vieta" : `${type.seats} vietos`}</span>
          {type.units > 0 && <span>Parke yra {type.units}</span>}
        </div>
        <h3 className="text-item font-bold">{type.name}</h3>
        {type.description ? <p className={`text-xs leading-relaxed ${copy}`}>{type.description}</p> : null}
        <p className="text-xs font-bold">{type.pricePerHour} € / val.</p>
      </div>
      <div className={`mt-auto space-y-4 border-t pt-3 ${line}`}>
        {max > 0 && (
          <Stepper label="Kiekis" value={quantity} onChange={selected ? onChange : setDraft} min={1} max={max} editable compact />
        )}
        {type.units === 0 && (
          <p className="text-xs text-copy">Šio tipo keturračių šiuo metu nėra.</p>
        )}
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${selected ? "Pašalinti" : "Pasirinkti"}: ${type.name}`}
          disabled={!selected && max === 0}
          onClick={() => onChange(selected ? 0 : quantity)}
          className={ctaClass({ tone: selected ? "cream" : "dark", small: true, className: "inline-flex items-center disabled:pointer-events-none disabled:opacity-50" })}
        >
          {selected ? "Pašalinti" : "Pasirinkti"}
          <TextCtaArrow />
        </button>
      </div>
    </Panel>
  );
}
