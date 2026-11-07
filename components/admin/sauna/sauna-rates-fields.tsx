"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { RatesValues } from "./rates-schema";
import type { SaunaValues } from "./sauna-schema";
import { Input } from "@/components/ui/input";

type Field = { name: keyof RatesValues; label: string; unit: string };

const PRICE_FIELDS: Field[] = [
  { name: "smallGroupRate", label: "Maža grupė", unit: "€/val." },
  { name: "largeGroupRate", label: "Didelė grupė", unit: "€/val." },
  { name: "smallGroupMax", label: "Maža grupė iki", unit: "asm." },
  { name: "packageHours", label: "Paketo trukmė", unit: "val." },
  { name: "packagePrice", label: "Paketo kaina", unit: "€" },
];

const RULE_FIELDS: Field[] = [
  { name: "maxParty", label: "Daugiausia žmonių", unit: "asm." },
  { name: "minHours", label: "Minimali trukmė", unit: "val." },
  { name: "maxHours", label: "Maksimali trukmė", unit: "val." },
  { name: "openHour", label: "Atidaroma", unit: "val." },
  { name: "closeHour", label: "Uždaroma", unit: "val." },
];

interface SaunaRatesFieldsProps {
  register: UseFormRegister<SaunaValues>;
  errors: FieldErrors<SaunaValues>;
}

/** A sauna's hourly rates, package and booking rules (the `rates` part of the sauna form). */
export function SaunaRatesFields({ register, errors }: SaunaRatesFieldsProps) {
  const renderFields = (fields: Field[]) => (
    <div className="divide-y">
      {fields.map((f) => {
        const err = errors.rates?.[f.name]?.message;
        return (
          <div key={f.name} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <label htmlFor={`rate-${f.name}`} className="text-sm font-normal">
                {f.label}
              </label>
              <p className="text-xs text-muted-foreground">{f.unit}</p>
              {err ? <p className="text-xs text-destructive">{err}</p> : null}
            </div>
            <Input
              id={`rate-${f.name}`}
              type="number"
              inputMode="decimal"
              className="w-24 text-right tabular-nums"
              aria-invalid={!!err}
              {...register(`rates.${f.name}`, { valueAsNumber: true })}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-xs font-bold text-muted-foreground">Kainos</h3>
        {renderFields(PRICE_FIELDS)}
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold text-muted-foreground">Rezervacijos taisyklės</h3>
        {renderFields(RULE_FIELDS)}
      </section>
    </div>
  );
}
