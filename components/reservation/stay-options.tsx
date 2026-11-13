"use client";

import { ListBulletsIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { CompactStepper } from "@/components/booking/stepper";
import { TextCtaArrow, ctaClass } from "@/components/cta";
import { MAX_STAY_UNITS, type StayType } from "@/lib/cabin";
import type { StayPick, StayPlan } from "@/lib/reservation";
import { BookingDetailCard } from "./booking-detail-card";
import { StayTypeDialog } from "./stay-type-dialog";

interface StayOptionsProps {
  plan: StayPlan;
  /** Active stay types in display order. */
  stayTypes: StayType[];
  datesSelected: boolean;
  included: boolean;
  onChange: (pick: StayPick) => void;
  onRemove: () => void;
}

/** One unit type for the chosen dates, with a count independent of the activity group size. */
export function StayOptions({ plan, stayTypes, datesSelected, included, onChange, onRemove }: StayOptionsProps) {
  const { nights, units } = plan;

  return (
    <>
      <fieldset disabled={!datesSelected} className="@container min-w-0 disabled:pointer-events-none disabled:opacity-50">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <ListBulletsIcon size={18} aria-hidden /> Paslauga
        </legend>
        <div className="grid gap-3 lg:@md:grid-cols-3">
          {stayTypes.map((type) => {
            const selected = included && type.id === plan.typeId;
            const choice: StayPick = { typeId: type.id, nights, units };
            return (
              <StayUnitCard
                key={type.id}
                type={type}
                free={datesSelected ? plan.free(type) : null}
                selected={selected}
                units={units}
                onChange={(next) => onChange({ ...choice, units: next })}
                onRemove={onRemove}
              />
            );
          })}
        </div>
      </fieldset>
      {datesSelected && included && !plan.ok && (
        <p role="status" className="text-sm text-rust-ink">
          Šioms naktims pasirinkto kiekio nebeliko. Pakeisk datas, kiekį arba tipą.
        </p>
      )}
    </>
  );
}

function StayUnitCard({ type, free, selected, units, onChange, onRemove }: {
  type: StayType;
  free: number | null;
  selected: boolean;
  units: number;
  onChange: (units: number) => void;
  onRemove: () => void;
}) {
  const { label: title, pricePerNight: price } = type;
  const [draft, setDraft] = useState(1);
  const max = free === null ? 0 : Math.min(MAX_STAY_UNITS, free);
  const count = selected ? units : Math.min(draft, max);
  return (
    <BookingDetailCard
      eyebrow={free === null ? "Nakvynė" : free === 0 ? "Užimta" : Number.isFinite(free) ? `Liko: ${free}` : "Nakvynė"}
      title={title}
      description={type.note}
      price={`${price} € / naktį`}
      selected={selected}
      details={free !== null ? <StayTypeDialog type={type} /> : undefined}
    >
      {free !== null ? <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
        {max > 0 && (
          <CompactStepper
            label={type.kind === "namelis" ? "Namelių kiekis" : "Kemperių kiekis"}
            value={count}
            onChange={(next) => (selected ? onChange : setDraft)(Math.min(next, max))}
            min={1}
            max={max}
            editable
          />
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
    </BookingDetailCard>
  );
}
