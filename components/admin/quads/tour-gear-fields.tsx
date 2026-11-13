"use client";

import { formatEur } from "@/lib/admin/format";
import type { QuadTourAccessory } from "@/lib/quads";
import { Stepper } from "@/components/booking/stepper";

interface TourGearFieldsProps {
  accessories: readonly QuadTourAccessory[];
  quantities: Record<string, number>;
  onChange: (id: string, units: number) => void;
  /** Most items in total (two per quad, like the website). */
  maxTotal: number;
}

/** Optional gear sold with a tour (helmets, suits): a quantity per item, at most two per quad. */
export function TourGearFields({ accessories, quantities, onChange, maxTotal }: TourGearFieldsProps) {
  if (accessories.length === 0) return null;
  const total = Object.values(quantities).reduce((sum, n) => sum + n, 0);
  return (
    <div className="col-span-2 space-y-2">
      <p className="text-sm font-medium">Įranga</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {accessories.map((a) => (
          <Stepper
            key={a.id}
            label={`${a.name} · ${formatEur(a.price)}`}
            value={quantities[a.id] ?? 0}
            min={0}
            max={Math.max(0, maxTotal - total + (quantities[a.id] ?? 0))}
            stacked
            editable
            updateOnInput
            onChange={(units) => onChange(a.id, units)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Iki {maxTotal} vnt. (2 vienam keturračiui).</p>
    </div>
  );
}
