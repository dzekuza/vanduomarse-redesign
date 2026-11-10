"use client";

import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { TextCtaArrow, ctaClass } from "@/components/cta";
import { MAX_STAY_UNITS, STAY_TYPES, roomLabel, roomPrice } from "@/lib/cabin";
import type { StayPick, StayPlan } from "@/lib/reservation";
import { OptionGroupLabel } from "./option-card";

interface StayOptionsProps {
  plan: StayPlan;
  datesSelected: boolean;
  included: boolean;
  onChange: (pick: StayPick) => void;
  onRemove: () => void;
}

/** One unit type for the chosen dates, with a count independent of the activity group size. */
export function StayOptions({ plan, datesSelected, included, onChange, onRemove }: StayOptionsProps) {
  const { roomId, size, nights, units } = plan;
  const selectedType = roomId === "kemperis" ? roomId : size;

  return (
    <>
      <div className="@container">
        <OptionGroupLabel>Tipas</OptionGroupLabel>
        <div className="grid gap-3 lg:@2xl:grid-cols-3">
          {STAY_TYPES.map((type) => {
            const selected = included && type === selectedType;
            const camper = type === "kemperis";
            const choice: StayPick = { roomId: camper ? "kemperis" : "namelis", size: camper ? size : type, nights, units };
            return (
              <StayUnitCard
                key={type}
                title={roomLabel(choice.roomId, choice.size)}
                price={roomPrice(choice.roomId, choice.size)}
                camper={camper}
                free={datesSelected ? plan.free(type) : null}
                selected={selected}
                units={units}
                onChange={(next) => onChange({ ...choice, units: next })}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      </div>
      {datesSelected && included && !plan.ok && (
        <p role="status" className="text-sm text-rust-ink">
          Šioms naktims pasirinkto kiekio nebeliko. Pakeisk datas, kiekį arba tipą.
        </p>
      )}
    </>
  );
}

function StayUnitCard({ title, price, camper, free, selected, units, onChange, onRemove }: {
  title: string;
  price: number;
  camper: boolean;
  free: number | null;
  selected: boolean;
  units: number;
  onChange: (units: number) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState(1);
  const max = free === null ? 0 : Math.min(MAX_STAY_UNITS, free);
  const count = selected ? units : Math.min(draft, max);
  const line = selected ? "border-line-on-ink" : "border-line";
  const copy = selected ? "text-dust/80" : "text-copy";

  return (
    <article aria-label={title} className={`flex flex-col gap-4 border p-5 transition-colors duration-150 ease-out-strong ${selected ? "border-ink bg-ink text-dust" : "border-line bg-card"}`}>
      <div className="space-y-2">
        <p className={`text-micro uppercase ${copy}`}>{free === null ? "Nakvynė" : free === 0 ? "Užimta" : Number.isFinite(free) ? `Liko: ${free}` : "Nakvynė"}</p>
        <h3 className="text-item font-bold">{title}</h3>
        {camper && <p className={`text-xs leading-relaxed ${copy}`}>Viena vieta vienai transporto priemonei, su elektra.</p>}
        <p className="text-xs font-bold">{price} € / naktį</p>
      </div>
      {free !== null ? <div className="mt-auto space-y-4">
        {max > 0 && (
          <div className={`border-t pt-3 ${line}`}>
            <Stepper
              label="Kiekis"
              value={count}
              onChange={(next) => (selected ? onChange : setDraft)(Math.min(next, max))}
              min={1}
              max={max}
              editable
              compact
            />
          </div>
        )}
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${selected ? "Pašalinti" : "Pasirinkti"}: ${title}`}
          disabled={!selected && max === 0}
          onClick={selected ? onRemove : () => onChange(count)}
          className={ctaClass({ tone: selected ? "cream" : "dark", small: true, className: "inline-flex items-center" })}
        >
          {selected ? "Pašalinti" : "Pasirinkti"}
          <TextCtaArrow />
        </button>
      </div> : null}
    </article>
  );
}
