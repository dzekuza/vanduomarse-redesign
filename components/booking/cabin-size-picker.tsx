"use client";

import { ChoiceTile } from "./choice-tile";
import { CABIN_SIZES, type CabinSize } from "@/lib/cabin";

/** Double or quad cabin, with the nightly price and how many are free for the stay. */
export function CabinSizePicker({
  selected,
  onSelect,
  free,
}: {
  selected: CabinSize;
  onSelect: (size: CabinSize) => void;
  free: (size: CabinSize) => number;
}) {
  return (
    <fieldset className="grid grid-cols-2 gap-2 pt-2">
      <legend className="mb-2 text-sm text-ink/70">Namelio dydis</legend>
      {CABIN_SIZES.map((s) => {
        const left = free(s.id);
        return (
          <ChoiceTile
            key={s.id}
            primary={s.label}
            secondary={left > 0 ? `${s.pricePerNight} € · liko ${left}` : "Užimta"}
            active={selected === s.id}
            disabled={left === 0}
            onClick={() => onSelect(s.id)}
          />
        );
      })}
    </fieldset>
  );
}
