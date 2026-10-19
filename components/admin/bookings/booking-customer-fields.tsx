"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { FormField } from "../form-field";
import type { NewBookingValues } from "./new-booking-schema";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BookingCustomerFieldsProps {
  control: Control<NewBookingValues>;
  register: UseFormRegister<NewBookingValues>;
  errors: FieldErrors<NewBookingValues>;
}

const STATUS = [
  { value: "patvirtinta", label: "Patvirtinta" },
  { value: "laukia", label: "Laukia" },
];

const SOURCE = [
  { value: "telefonu", label: "Telefonu" },
  { value: "vietoje", label: "Vietoje" },
];

/** Contact details, status, channel and an internal note. */
export function BookingCustomerFields({ control, register, errors }: BookingCustomerFieldsProps) {
  const select = (name: "status" | "source", id: string, options: { value: string; label: string }[]) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <>
      <FormField id="nb-name" label="Vardas, pavardė" error={errors.name?.message} className="sm:col-span-2">
        <Input id="nb-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
      </FormField>
      <FormField id="nb-phone" label="Telefonas" error={errors.phone?.message}>
        <Input id="nb-phone" type="tel" inputMode="tel" aria-invalid={!!errors.phone} {...register("phone")} />
      </FormField>
      <FormField id="nb-email" label="El. paštas" error={errors.email?.message} hint="Neprivaloma">
        <Input id="nb-email" type="email" aria-invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField id="nb-status" label="Būsena">
        {select("status", "nb-status", STATUS)}
      </FormField>
      <FormField id="nb-source" label="Kaip užsakė">
        {select("source", "nb-source", SOURCE)}
      </FormField>
      <FormField id="nb-note" label="Pastaba" error={errors.note?.message} className="sm:col-span-2">
        <Textarea id="nb-note" rows={2} placeholder="Pvz., atvyks vėliau, gimtadienis." {...register("note")} />
      </FormField>
    </>
  );
}
