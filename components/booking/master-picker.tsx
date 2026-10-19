"use client";

import { ChoiceTile } from "./choice-tile";
import { MASTER_RATE } from "@/lib/sauna";

interface MasterPickerProps {
  value: boolean;
  onChange: (withMaster: boolean) => void;
  /** Session length, to show the add-on total; null until a start is chosen. */
  hours: number | null;
}

/** Whether a pirtininkas leads the session (vantos, aromas, rounds) or the group goes alone. */
export function MasterPicker({ value, onChange, hours }: MasterPickerProps) {
  const extra = hours ? `+${MASTER_RATE * hours} €` : `+${MASTER_RATE} €/val.`;
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChoiceTile primary="Nereikalingas" secondary="Kaitinatės patys" active={!value} onClick={() => onChange(false)} />
      <ChoiceTile primary="Su pirtininku" secondary={`Veda seansą, ${extra}`} active={value} onClick={() => onChange(true)} />
    </div>
  );
}
