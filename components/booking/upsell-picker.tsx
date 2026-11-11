"use client";

import { Stepper } from "./stepper";
import { OptionToggle } from "@/components/calculator/option-toggle";
import { UPSELL_UNIT_SHORT, upsellMax, upsellTotal, type Upsell } from "@/lib/sauna-upsells";

interface UpsellPickerProps {
  upsells: Upsell[];
  quantities: Record<string, number>;
  onChange: (id: string, qty: number) => void;
  partySize: number;
  hours: number;
}

/** Active extras, one per row (stacked): counted items get a stepper, the rest an on/off row with the current cost. */
export function UpsellPicker({ upsells, quantities, onChange, partySize, hours }: UpsellPickerProps) {
  const ctx = { partySize, hours };
  return (
    <div className="grid grid-cols-1 gap-3">
      {upsells
        .filter((u) => u.active)
        .map((u) =>
          u.unit === "vienetui" ? (
            <Stepper
              key={u.id}
              label={`${u.name} (+${u.price} ${UPSELL_UNIT_SHORT[u.unit]})`}
              value={quantities[u.id] ?? 0}
              onChange={(v) => onChange(u.id, v)}
              min={0}
              max={upsellMax(u, partySize)}
            />
          ) : (
            <OptionToggle
              key={u.id}
              label={u.name}
              hint={`${u.description} +${upsellTotal(u, 1, ctx)} €`}
              checked={(quantities[u.id] ?? 0) > 0}
              onChange={(on) => onChange(u.id, on ? 1 : 0)}
            />
          ),
        )}
    </div>
  );
}
