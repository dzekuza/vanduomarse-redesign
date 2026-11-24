"use client";

import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import {
  Controller,
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StayTypeValues } from "./stay-type-schema";

const SEASON_TIERS = [
  { name: "price", label: "1 naktis" },
  { name: "price2", label: "2 naktys" },
  { name: "price3", label: "3 ir daugiau" },
] as const;

interface StaySeasonsFieldsProps {
  control: Control<StayTypeValues>;
  register: UseFormRegister<StayTypeValues>;
  errors: FieldErrors<StayTypeValues>;
}

/** Date ranges with their own nightly prices; nights outside every range use the base prices above. */
export function StaySeasonsFields({
  control,
  register,
  errors,
}: StaySeasonsFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "seasons",
  });

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Sezoninės kainos</legend>
      <p className="text-xs text-muted-foreground">
        Pvz. nuo liepos 1 d. iki rugpjūčio 31 d. kita kaina. Kiekviena naktis
        kainuoja pagal sezoną, į kurį patenka; už sezono ribų taikoma kaina
        viršuje.
      </p>
      {fields.map((field, i) => {
        const rowErrors = errors.seasons?.[i];
        return (
          <div key={field.id} className="space-y-3 border border-line p-3">
            <div className="grid grid-cols-2 gap-3">
              {(["startsOn", "endsOn"] as const).map((name) => (
                <div key={name} className="space-y-1.5">
                  <Label
                    htmlFor={`${field.id}-${name}`}
                    className="text-xs font-normal text-muted-foreground"
                  >
                    {name === "startsOn" ? "Nuo" : "Iki (imtinai)"}
                  </Label>
                  <Controller
                    control={control}
                    name={`seasons.${i}.${name}`}
                    render={({ field: f }) => (
                      <DatePicker
                        id={`${field.id}-${name}`}
                        value={f.value}
                        onChange={f.onChange}
                        invalid={!!rowErrors?.[name]}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SEASON_TIERS.map(({ name, label }) => (
                <div key={name} className="space-y-1.5">
                  <Label
                    htmlFor={`${field.id}-${name}`}
                    className="text-xs font-normal text-muted-foreground"
                  >
                    {label}
                  </Label>
                  <Input
                    id={`${field.id}-${name}`}
                    inputMode="decimal"
                    aria-invalid={!!rowErrors?.[name]}
                    {...register(`seasons.${i}.${name}`)}
                  />
                </div>
              ))}
            </div>
            {rowErrors ? (
              <p className="text-xs text-destructive">
                {rowErrors.startsOn?.message ??
                  rowErrors.endsOn?.message ??
                  rowErrors.price?.message ??
                  rowErrors.price2?.message ??
                  rowErrors.price3?.message}
              </p>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => remove(i)}
              className="min-h-11 text-destructive"
            >
              <TrashIcon size={18} /> Pašalinti sezoną
            </Button>
          </div>
        );
      })}
      {errors.seasons?.root?.message ? (
        <p className="text-xs text-destructive">
          {errors.seasons.root.message}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            startsOn: "",
            endsOn: "",
            price: "",
            price2: "",
            price3: "",
          })
        }
        className="min-h-11"
      >
        <PlusIcon size={18} /> Pridėti sezoną
      </Button>
    </fieldset>
  );
}
