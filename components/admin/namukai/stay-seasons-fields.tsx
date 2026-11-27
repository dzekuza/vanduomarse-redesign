"use client";

import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nightsLabel, seasonNights } from "@/lib/cabin";
import type { StayTypeValues } from "./stay-type-schema";

const SEASON_TIERS = [
  { name: "price", label: "1 naktis" },
  { name: "price2", label: "2 naktys" },
  { name: "price3", label: "3+" },
] as const;

const MAX_SEASONS = 24;

interface StaySeasonsFieldsProps {
  control: Control<StayTypeValues>;
  register: UseFormRegister<StayTypeValues>;
  setValue: UseFormSetValue<StayTypeValues>;
  getValues: UseFormGetValues<StayTypeValues>;
  errors: FieldErrors<StayTypeValues>;
}

type SeasonRow = StayTypeValues["seasons"][number];

/** Nights of a complete row, and whether it sits inside another row (then its prices win on its nights). */
function rowInfo(
  rows: readonly SeasonRow[],
  i: number,
): { nights: number; nested: boolean } | null {
  const s = rows[i];
  if (!s?.startsOn || !s.endsOn || s.endsOn < s.startsOn) return null;
  const nested = rows.some(
    (o, j) =>
      j !== i &&
      o.startsOn &&
      o.endsOn &&
      o.startsOn <= s.startsOn &&
      s.endsOn <= o.endsOn &&
      !(o.startsOn === s.startsOn && o.endsOn === s.endsOn),
  );
  return { nights: seasonNights(s), nested };
}

/**
 * Date ranges with their own nightly prices; nights outside every range use the base prices. A shorter season may sit
 * inside a longer one (Christmas inside winter): its prices then win on its nights. One compact row per season.
 */
export function StaySeasonsFields({
  control,
  register,
  setValue,
  getValues,
  errors,
}: StaySeasonsFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "seasons",
  });
  const rows = useWatch({ control, name: "seasons" }) ?? [];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">
        Sezoninės kainos € už naktį
      </legend>
      <p className="text-xs text-muted-foreground">
        Naktis kainuoja pagal sezoną, į kurį patenka. Trumpesnis sezonas gali
        būti ilgesniojo viduje (pvz. Kalėdos žiemos sezone): tada jo naktims
        taikoma jo kaina.
      </p>
      {fields.length ? (
        <div
          className="hidden grid-cols-12 gap-2 text-xs text-muted-foreground sm:grid"
          aria-hidden
        >
          <span className="col-span-3">Nuo</span>
          <span className="col-span-3">Iki (imtinai)</span>
          {SEASON_TIERS.map((t) => (
            <span key={t.name} className="col-span-2">
              {t.label}
            </span>
          ))}
        </div>
      ) : null}
      {fields.map((field, i) => {
        const rowErrors = errors.seasons?.[i];
        const info = rowInfo(rows, i);
        const startsOn = rows[i]?.startsOn ?? "";
        const message =
          rowErrors?.startsOn?.message ??
          rowErrors?.endsOn?.message ??
          rowErrors?.price?.message ??
          rowErrors?.price2?.message ??
          rowErrors?.price3?.message;
        return (
          <div key={field.id} className="space-y-1.5 border-b border-line pb-3">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              <div className="col-span-3 space-y-1">
                <Label
                  htmlFor={`${field.id}-startsOn`}
                  className="text-xs font-normal text-muted-foreground sm:sr-only"
                >
                  Nuo
                </Label>
                <Controller
                  control={control}
                  name={`seasons.${i}.startsOn`}
                  render={({ field: f }) => (
                    <DatePicker
                      id={`${field.id}-startsOn`}
                      value={f.value}
                      invalid={!!rowErrors?.startsOn}
                      onChange={(v) => {
                        f.onChange(v);
                        // A new start after the end clears the end, so "Iki" is picked again from the right month.
                        const end = getValues(`seasons.${i}.endsOn`);
                        if (v && end && end < v)
                          setValue(`seasons.${i}.endsOn`, "");
                      }}
                    />
                  )}
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label
                  htmlFor={`${field.id}-endsOn`}
                  className="text-xs font-normal text-muted-foreground sm:sr-only"
                >
                  Iki (imtinai)
                </Label>
                <Controller
                  control={control}
                  name={`seasons.${i}.endsOn`}
                  render={({ field: f }) => (
                    <DatePicker
                      id={`${field.id}-endsOn`}
                      value={f.value}
                      onChange={f.onChange}
                      min={startsOn || undefined}
                      openOn={startsOn}
                      invalid={!!rowErrors?.endsOn}
                    />
                  )}
                />
              </div>
              {SEASON_TIERS.map(({ name, label }) => (
                <div key={name} className="col-span-2 space-y-1">
                  <Label
                    htmlFor={`${field.id}-${name}`}
                    className="text-xs font-normal text-muted-foreground sm:sr-only"
                  >
                    {label}
                  </Label>
                  <Input
                    id={`${field.id}-${name}`}
                    inputMode="decimal"
                    className="h-11"
                    aria-invalid={!!rowErrors?.[name]}
                    {...register(`seasons.${i}.${name}`)}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {info
                  ? `${nightsLabel(info.nights)}${info.nested ? " · kito sezono viduje, taikoma ši kaina" : ""}`
                  : "Pasirinkite datas"}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(i)}
                className="min-h-11 text-destructive"
              >
                <TrashIcon size={16} /> Pašalinti
              </Button>
            </div>
            {message ? (
              <p className="text-xs text-destructive">{message}</p>
            ) : null}
          </div>
        );
      })}
      {(errors.seasons?.root?.message ?? errors.seasons?.message) ? (
        <p role="alert" className="text-xs text-destructive">
          {errors.seasons?.root?.message ?? errors.seasons?.message}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={fields.length >= MAX_SEASONS}
        onClick={() => {
          // Start from the base prices: usually only one or two of them change.
          const { price, price2, price3 } = getValues();
          append({
            id: crypto.randomUUID(),
            startsOn: "",
            endsOn: "",
            price,
            price2,
            price3,
          });
        }}
        className="min-h-11"
      >
        <PlusIcon size={18} /> Pridėti sezoną
      </Button>
    </fieldset>
  );
}
