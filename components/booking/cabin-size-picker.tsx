"use client";

import { ChoiceTile } from "./choice-tile";
import type { StayType } from "@/lib/cabin";

/** The cabin types, with the nightly price and how many are free for the stay. */
export function CabinSizePicker({
  types,
  selected,
  onSelect,
  free,
  legend,
}: {
  types: StayType[];
  selected: string;
  onSelect: (id: string) => void;
  free: (type: StayType) => number;
  legend: string;
}) {
  return (
    <fieldset className="grid grid-cols-2 gap-2 pt-2">
      <legend className="mb-2 text-sm text-ink/70">{legend}</legend>
      {types.map((type) => {
        const left = free(type);
        return (
          <ChoiceTile
            key={type.id}
            primary={type.label}
            secondary={left > 0 ? `${type.pricePerNight} €${Number.isFinite(left) ? ` · liko ${left}` : ""}` : "Užimta"}
            active={selected === type.id}
            disabled={left === 0}
            onClick={() => onSelect(type.id)}
          />
        );
      })}
    </fieldset>
  );
}
