"use client";

import { ChoiceTile } from "./choice-tile";
import { MASTER_PRICE } from "@/lib/sauna";

interface MasterPickerProps {
  value: boolean;
  onChange: (withMaster: boolean) => void;
}

/** Whether a pirtininkas leads the session (vantos, aromas, rounds) or the group goes alone. */
export function MasterPicker({ value, onChange }: MasterPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChoiceTile primary="Nereikalingas" secondary="Kaitinatės patys" active={!value} onClick={() => onChange(false)} />
      <ChoiceTile primary="Su pirtininku" secondary={`Veda seansą, +${MASTER_PRICE} €`} active={value} onClick={() => onChange(true)} />
    </div>
  );
}
