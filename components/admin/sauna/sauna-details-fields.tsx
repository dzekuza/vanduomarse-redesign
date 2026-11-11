"use client";

import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Controller, useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { FormField } from "../form-field";
import type { SaunaValues } from "./sauna-schema";
import { MAX_SAUNA_FEATURES, SAUNA_STATUSES, SAUNA_STATUS_LABELS } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SaunaDetailsFieldsProps {
  control: Control<SaunaValues>;
  register: UseFormRegister<SaunaValues>;
  errors: FieldErrors<SaunaValues>;
}

/** Name, description, feature list and status (bookable, coming soon, hidden) of a sauna. */
export function SaunaDetailsFields({ control, register, errors }: SaunaDetailsFieldsProps) {
  const features = useFieldArray({ control, name: "features" });

  return (
    <div className="space-y-4">
      <FormField id="sauna-name" label="Pavadinimas" error={errors.name?.message}>
        <Input id="sauna-name" placeholder="pvz. Malkinė pirtis" aria-invalid={!!errors.name} {...register("name")} />
      </FormField>
      <FormField id="sauna-desc" label="Trumpas aprašymas" error={errors.description?.message} hint="Rodomas pirties kortelėje, iki 400 simbolių.">
        <Textarea id="sauna-desc" rows={3} aria-invalid={!!errors.description} {...register("description")} />
      </FormField>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Savybės</legend>
        <p className="text-xs text-muted-foreground">Trumpi faktai kortelėje, pvz. „Iki 8 žmonių“, „Kūrenama malkomis“.</p>
        {features.fields.map((field, i) => {
          const err = errors.features?.[i]?.value?.message;
          return (
            <div key={field.id}>
              <div className="flex gap-2">
                <Input aria-label={`Savybė ${i + 1}`} aria-invalid={!!err} {...register(`features.${i}.value`)} />
                <Button type="button" variant="ghost" size="icon" aria-label={`Pašalinti savybę ${i + 1}`} onClick={() => features.remove(i)}>
                  <XIcon size={18} />
                </Button>
              </div>
              {err ? <p className="mt-1 text-xs text-destructive">{err}</p> : null}
            </div>
          );
        })}
        {errors.features?.message ? <p className="text-xs text-destructive">{errors.features.message}</p> : null}
        <Button
          type="button"
          variant="outline"
          disabled={features.fields.length >= MAX_SAUNA_FEATURES}
          onClick={() => features.append({ value: "" }, { shouldFocus: true })}
        >
          <PlusIcon size={16} /> Pridėti savybę
        </Button>
      </fieldset>

      <FormField id="sauna-status" label="Būsena" hint="„Netrukus atsidarys“ rodo pirtį svetainėje su užrašu, bet jos užsakyti negalima.">
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="sauna-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAUNA_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {SAUNA_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
    </div>
  );
}
