"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { FormField } from "../form-field";
import type { NewBookingValues } from "./new-booking-schema";
import { SaunaSelect } from "../sauna/sauna-select";
import { formatHour, todayKey } from "@/lib/sauna";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BookingWhenFieldsProps {
  control: Control<NewBookingValues>;
  register: UseFormRegister<NewBookingValues>;
  errors: FieldErrors<NewBookingValues>;
  kind: NewBookingValues["kind"];
  /** Free sauna starts for the chosen date. */
  starts: number[];
  /** Allowed lengths from the chosen start. */
  lengths: number[];
  maxGuests: number;
  /** Sauna, date or start changed: dependent selections must be re-picked. */
  onSaunaChange: () => void;
  onDateChange: () => void;
  onStartChange: () => void;
}

/** Date, then free sauna slot + length, or nights for a stay; plus guests. */
export function BookingWhenFields({
  control,
  register,
  errors,
  kind,
  starts,
  lengths,
  maxGuests,
  onSaunaChange,
  onDateChange,
  onStartChange,
}: BookingWhenFieldsProps) {
  const sauna = kind === "pirtis";
  return (
    <>
      {sauna ? (
        <FormField id="nb-sauna" label="Pirtis" error={errors.saunaId?.message} className="sm:col-span-2">
          <Controller
            control={control}
            name="saunaId"
            render={({ field }) => (
              <SaunaSelect
                id="nb-sauna"
                value={field.value}
                invalid={!!errors.saunaId}
                onChange={(v) => {
                  field.onChange(v);
                  onSaunaChange();
                }}
              />
            )}
          />
        </FormField>
      ) : null}
      <FormField id="nb-date" label="Data" error={errors.date?.message}>
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              id="nb-date"
              value={field.value}
              min={todayKey()}
              invalid={!!errors.date}
              onChange={(v) => {
                field.onChange(v);
                onDateChange();
              }}
            />
          )}
        />
      </FormField>
      <FormField id="nb-guests" label="Žmonių" error={errors.guests?.message} hint={`Daugiausia ${maxGuests}`}>
        <Input id="nb-guests" inputMode="numeric" aria-invalid={!!errors.guests} {...register("guests")} />
      </FormField>

      {sauna ? (
        <>
          <FormField id="nb-start" label="Pradžia" error={errors.startHour?.message} hint={starts.length ? undefined : "Šią dieną laisvo laiko nėra."}>
            <Controller
              control={control}
              name="startHour"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    onStartChange();
                  }}
                  disabled={!starts.length}
                >
                  <SelectTrigger id="nb-start" className="w-full" aria-invalid={!!errors.startHour}>
                    <SelectValue placeholder="Laisvas laikas" />
                  </SelectTrigger>
                  <SelectContent>
                    {starts.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {formatHour(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField id="nb-hours" label="Trukmė" error={errors.hours?.message}>
            <Controller
              control={control}
              name="hours"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!lengths.length}>
                  <SelectTrigger id="nb-hours" className="w-full" aria-invalid={!!errors.hours}>
                    <SelectValue placeholder="Valandos" />
                  </SelectTrigger>
                  <SelectContent>
                    {lengths.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {h} val.
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </>
      ) : (
        <FormField id="nb-nights" label="Naktys" error={errors.nights?.message} className="sm:col-span-2">
          <Input id="nb-nights" inputMode="numeric" aria-invalid={!!errors.nights} {...register("nights")} />
        </FormField>
      )}
    </>
  );
}
