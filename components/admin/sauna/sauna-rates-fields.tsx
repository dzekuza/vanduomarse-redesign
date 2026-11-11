"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { LENGTH_SLOTS, type RatesValues } from "./rates-schema";
import type { SaunaValues } from "./sauna-schema";
import { UnitAmountInput } from "../unit-amount-input";
import { hoursLabel } from "@/lib/sauna";

type ScalarField = Exclude<keyof RatesValues, "weekdayPrices" | "weekendPrices">;
type Field = { name: ScalarField; label: string; unit: string };

const GUEST_FIELDS: Field[] = [
  { name: "includedGuests", label: "Kaina apima iki", unit: "asm." },
  { name: "extraGuestFee", label: "Kiekvienas svečias virš to", unit: "€/asm." },
  { name: "maxParty", label: "Daugiausia žmonių", unit: "asm." },
];

const RULE_FIELDS: Field[] = [
  { name: "turnaroundHours", label: "Tarpas tarp seansų", unit: "val." },
  { name: "openHour", label: "Atidaroma", unit: "val." },
  { name: "closeHour", label: "Uždaroma", unit: "val." },
];

/** Empty box = null = that length is not sold. */
const emptyToNull = (v: unknown) => (v === "" || v == null ? null : Number(v));

interface SaunaRatesFieldsProps {
  register: UseFormRegister<SaunaValues>;
  errors: FieldErrors<SaunaValues>;
}

/** A sauna's prices per session length (weekday and Fri-Sun), guest fee and booking rules (the `rates` part of the sauna form). */
export function SaunaRatesFields({ register, errors }: SaunaRatesFieldsProps) {
  const renderFields = (fields: Field[]) => (
    <div className="divide-y">
      {fields.map((f) => {
        const err = errors.rates?.[f.name]?.message;
        return (
          <div key={f.name} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <label htmlFor={`rate-${f.name}`} className="text-sm font-medium">
                {f.label}
              </label>
              {err ? <p className="text-xs text-destructive">{err}</p> : null}
            </div>
            <UnitAmountInput
              id={`rate-${f.name}`}
              type="number"
              unit={f.unit}
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
        <h3 className="mb-1 text-xs font-bold text-muted-foreground">Kaina pagal trukmę</h3>
        <p className="mb-3 text-xs text-muted-foreground">Visai pirčiai. Palikite tuščią, jei tokios trukmės nepardavinėjate (pvz., 2 val. savaitgalį). „Visa diena“ – visa darbo diena (12 val., 10:00–22:00), pradedama atidarymo valandą.</p>
        <div className="grid grid-cols-[5rem_1fr_1fr] items-center gap-x-3 gap-y-2">
          <span />
          <span className="text-xs font-medium">Pr–Kt</span>
          <span className="text-xs font-medium">Pn–Sk</span>
          {LENGTH_SLOTS.map((hours, i) => (
            <div key={hours} className="contents">
              <span className="text-sm">{hoursLabel(hours)}</span>
              <UnitAmountInput
                type="number"
                unit="€"
                aria-label={`${hoursLabel(hours)} darbo dienomis`}
                aria-invalid={!!errors.rates?.weekdayPrices?.[i]}
                {...register(`rates.weekdayPrices.${i}`, { setValueAs: emptyToNull })}
              />
              <UnitAmountInput
                type="number"
                unit="€"
                aria-label={`${hoursLabel(hours)} savaitgalį`}
                aria-invalid={!!errors.rates?.weekendPrices?.[i]}
                {...register(`rates.weekendPrices.${i}`, { setValueAs: emptyToNull })}
              />
            </div>
          ))}
        </div>
        {errors.rates?.weekdayPrices?.message ? <p className="mt-2 text-xs text-destructive">Darbo dienos: {errors.rates.weekdayPrices.message}</p> : null}
        {errors.rates?.weekendPrices?.message ? <p className="mt-1 text-xs text-destructive">Savaitgalis: {errors.rates.weekendPrices.message}</p> : null}
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold text-muted-foreground">Svečiai</h3>
        {renderFields(GUEST_FIELDS)}
      </section>
      <section>
        <h3 className="mb-2 text-xs font-bold text-muted-foreground">Rezervacijos taisyklės</h3>
        {renderFields(RULE_FIELDS)}
      </section>
    </div>
  );
}
