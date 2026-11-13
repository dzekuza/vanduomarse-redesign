"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { FormField } from "../form-field";
import { CustomerSuggestions } from "./customer-suggestions";
import type { NewBookingValues } from "./new-booking-schema";
import { phoneForForm } from "@/lib/admin/customer-search";
import type { Rider } from "@/lib/admin/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormPhoneInput } from "@/components/ui/phone-input";

interface BookingCustomerFieldsProps {
  control: Control<NewBookingValues>;
  register: UseFormRegister<NewBookingValues>;
  setValue: UseFormSetValue<NewBookingValues>;
  errors: FieldErrors<NewBookingValues>;
  /** Tickets have no note column; the field is left out for them. */
  showNote?: boolean;
}

const STATUS = [
  { value: "patvirtinta", label: "Patvirtinta" },
  { value: "laukia", label: "Laukia" },
];

const SOURCE = [
  { value: "telefonu", label: "Telefonu" },
  { value: "vietoje", label: "Vietoje" },
];

/** Contact details (typing a name or phone suggests existing customers), status, channel and an internal note. */
export function BookingCustomerFields({ control, register, setValue, errors, showNote = true }: BookingCustomerFieldsProps) {
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

  /** An existing customer: their details replace what was typed; an empty e-mail never wipes one already entered. */
  const pick = (r: Rider) => {
    const opts = { shouldValidate: true, shouldDirty: true } as const;
    setValue("name", `${r.name} ${r.surname}`.trim(), opts);
    if (r.phone) setValue("phone", phoneForForm(r.phone), opts);
    if (r.email) setValue("email", r.email, opts);
  };

  return (
    <>
      <FormField id="nb-name" label="Vardas, pavardė" error={errors.name?.message} className="sm:col-span-2">
        <CustomerSuggestions control={control} field="name" onPick={pick}>
          <Input id="nb-name" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
        </CustomerSuggestions>
      </FormField>
      <FormField id="nb-phone" label="Telefonas" error={errors.phone?.message}>
        <CustomerSuggestions control={control} field="phone" onPick={pick}>
          <FormPhoneInput<NewBookingValues> name="phone" control={control} id="nb-phone" invalid={!!errors.phone} />
        </CustomerSuggestions>
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
      {showNote ? (
        <FormField id="nb-note" label="Pastaba" error={errors.note?.message} className="sm:col-span-2">
          <Textarea id="nb-note" rows={2} placeholder="Pvz., atvyks vėliau, gimtadienis." {...register("note")} />
        </FormField>
      ) : null}
    </>
  );
}
