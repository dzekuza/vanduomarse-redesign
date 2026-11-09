"use client";

import { Stepper } from "@/components/booking/stepper";
import type { QuadTourAccessory } from "@/lib/quads";
import { QUAD_TOUR_MAX_ACCESSORIES, quadTourAccessories } from "./quad-tour-plan";

interface QuadAccessoriesProps {
  /** The gear the database offers with a tour. */
  catalogue: readonly QuadTourAccessory[];
  title: string;
  selected: boolean;
  quantities: Record<string, number>;
  onChange: (quantities: Record<string, number>) => void;
}

/** Optional gear of a tour; priced from the database and filed with the tour request. */
export function QuadAccessories({ catalogue, title, selected, quantities, onChange }: QuadAccessoriesProps) {
  if (catalogue.length === 0) return null;
  const accessories = quadTourAccessories(catalogue, quantities);
  const copy = selected ? "text-dust/80" : "text-copy";
  const line = selected ? "border-line-on-ink" : "border-line";

  return (
    <section aria-label={`Priedai: ${title}`} className={`space-y-4 border-t pt-3 ${line}`}>
      <div className="space-y-2">
        <h4 className="text-sm font-bold">Priedai</h4>
        <p className={`text-xs leading-relaxed ${copy}`}>Vienu keturračiu gali važiuoti 2 asmenys. Priedų kiekį pasirink kiekvienam važiuojančiajam.</p>
      </div>
      <div className="space-y-4">
        {catalogue.map((accessory) => (
          <Stepper
            key={accessory.id}
            label={`${accessory.name} (${accessory.price} € / vnt.)`}
            value={quantities[accessory.id] ?? 0}
            min={0}
            max={QUAD_TOUR_MAX_ACCESSORIES}
            onChange={(units) => onChange({ ...quantities, [accessory.id]: units })}
            editable
            compact
          />
        ))}
      </div>
      {accessories.count > 0 ? (
        <p aria-live="polite" className={`text-xs ${copy}`}>Priedai, su PVM: <span className="font-bold">{accessories.total} €</span></p>
      ) : null}
    </section>
  );
}
