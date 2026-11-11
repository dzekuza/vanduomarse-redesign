"use client";

import { Stepper } from "@/components/booking/stepper";
import { QUAD_PREVIEW_ACCESSORIES } from "./quad-preview-content";
import { QUAD_PREVIEW_MAX_ACCESSORIES, quadPreviewAccessories } from "./quad-preview-plan";

interface QuadAccessoriesProps {
  title: string;
  selected: boolean;
  quantities: Record<string, number>;
  onChange: (quantities: Record<string, number>) => void;
}

/** Expanded optional gear shares the route draft and never creates a real booking. */
export function QuadAccessories({ title, selected, quantities, onChange }: QuadAccessoriesProps) {
  const accessories = quadPreviewAccessories(quantities);
  const copy = selected ? "text-dust/80" : "text-copy";
  const line = selected ? "border-line-on-ink" : "border-line";

  return (
    <section aria-label={`Priedai: ${title}`} className={`space-y-4 border-t pt-3 ${line}`}>
      <div className="space-y-2">
        <h4 className="text-sm font-bold">Priedai</h4>
        <p className={`text-xs leading-relaxed ${copy}`}>Vienu keturračiu gali važiuoti 2 asmenys. Priedų kiekį pasirink kiekvienam važiuojančiajam.</p>
      </div>
      <div className="space-y-4">
        {QUAD_PREVIEW_ACCESSORIES.map((accessory) => (
          <Stepper
            key={accessory.id}
            label={`${accessory.name} (${accessory.price} € / vnt.)`}
            value={quantities[accessory.id] ?? 0}
            min={0}
            max={QUAD_PREVIEW_MAX_ACCESSORIES}
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
