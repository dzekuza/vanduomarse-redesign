"use client";

import { WavesIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { FilterChip } from "@/components/events/filter-chip";
import type { ActivityId } from "@/lib/reservation";
import { RESERVATION_TYPE_LABEL, type ReservationType } from "@/lib/reservation-links";

/** What /rezervacija books: an activity, or the WAKE coupon order. */
export type ReservationTab = ActivityId | "wake";

/** One chip each: the sauna splits into shared sessions and private hire. */
export type { ReservationType };

const LABEL = RESERVATION_TYPE_LABEL;

interface ReservationTypeChipsProps {
  types: ReservationType[];
  active: ReservationType;
  /** Types already in the plan get a coral dot. */
  included: ReservationType[];
  disabled?: boolean;
  /** The "about this activity" trigger, shown at the end of the row. */
  details?: ReactNode;
  onChange: (type: ReservationType) => void;
}

/** "Tipas" chip row at the top of the reservation panel; each chip opens that activity's booking form. */
export function ReservationTypeChips({ types, active, included, disabled, details, onChange }: ReservationTypeChipsProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><WavesIcon size={18} aria-hidden /> Tipas</legend>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {types.map((id) => (
            <FilterChip key={id} active={id === active} onClick={() => id !== active && onChange(id)} className="relative">
              {LABEL[id]}
              {included.includes(id) ? <span aria-label="Įtraukta" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-rust" /> : null}
            </FilterChip>
          ))}
        </div>
        {details}
      </div>
    </fieldset>
  );
}
