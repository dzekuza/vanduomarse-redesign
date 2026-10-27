"use client";

import { ChoiceTile } from "@/components/booking/choice-tile";
import { Stepper } from "@/components/booking/stepper";
import { maxRiders, type QuadType } from "@/lib/quads";

interface QuadTypeStepProps {
  types: QuadType[];
  typeId: string;
  onType: (id: string) => void;
  units: number;
  onUnits: (n: number) => void;
  riders: number;
  onRiders: (n: number) => void;
}

/** Which quad, how many of them and how many riders. */
export function QuadTypeStep({ types, typeId, onType, units, onUnits, riders, onRiders }: QuadTypeStepProps) {
  const type = types.find((t) => t.id === typeId) ?? types[0];
  return (
    <div className="space-y-3">
      <div role="group" aria-label="Keturračio tipas" className="grid gap-2 sm:grid-cols-2">
        {types.map((t) => (
          <ChoiceTile
            key={t.id}
            primary={t.name}
            secondary={`${t.pricePerHour} €/val. · ${t.seats === 1 ? "1 vieta" : `${t.seats} vietos`}`}
            active={t.id === type.id}
            disabled={t.units === 0}
            onClick={() => onType(t.id)}
          />
        ))}
      </div>
      <p className="text-sm text-ink/60">{type.description}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stepper label="Keturračių" value={units} onChange={onUnits} min={1} max={Math.max(1, Math.min(type.units, 20))} />
        <Stepper label="Važiuotojų" value={riders} onChange={onRiders} min={1} max={maxRiders(type, units)} />
      </div>
    </div>
  );
}
