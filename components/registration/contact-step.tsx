"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { registrationSchema, type RegistrationInput } from "@/lib/registration-schema";
import { todayKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactStepProps {
  defaultValues: Partial<RegistrationInput>;
  onNext: (values: RegistrationInput) => void;
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/** Step 1: contact details, plus the bot honeypot. */
export function ContactStep({ defaultValues, onNext }: ContactStepProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationInput>({ resolver: zodResolver(registrationSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-name" label="Vardas" error={errors.name?.message}>
          <Input id="reg-name" autoComplete="given-name" aria-invalid={!!errors.name} className="min-h-11" {...register("name")} />
        </Field>
        <Field id="reg-surname" label="Pavardė" error={errors.surname?.message}>
          <Input id="reg-surname" autoComplete="family-name" aria-invalid={!!errors.surname} className="min-h-11" {...register("surname")} />
        </Field>
      </div>
      <Field id="reg-email" label="El. paštas" error={errors.email?.message}>
        <Input id="reg-email" type="email" autoComplete="email" aria-invalid={!!errors.email} className="min-h-11" {...register("email")} />
      </Field>
      <Field id="reg-birthdate" label="Gimimo data" error={errors.birthdate?.message}>
        <Controller
          control={control}
          name="birthdate"
          render={({ field }) => (
            <DatePicker id="reg-birthdate" value={field.value ?? ""} onChange={field.onChange} max={todayKey()} invalid={!!errors.birthdate} />
          )}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-phone" label="Telefonas" error={errors.phone?.message}>
          <Input id="reg-phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} className="min-h-11" {...register("phone")} />
        </Field>
        <Field id="reg-phone2" label="Papildomas telefonas (nebūtina)" error={errors.phone2?.message}>
          <Input id="reg-phone2" type="tel" autoComplete="tel" className="min-h-11" {...register("phone2")} />
        </Field>
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" {...register("website")} />
      <Button type="submit" className="min-h-11 w-full">
        Toliau
      </Button>
    </form>
  );
}
