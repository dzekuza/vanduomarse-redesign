"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useSyncExternalStore } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { parseRegistrationDraft, readRegistrationDraftRaw, saveRegistrationDraft } from "@/lib/registration-draft";
import { registrationSchema, type RegistrationInput } from "@/lib/registration-schema";
import { todayKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { BirthdateInput } from "@/components/ui/birthdate-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormPhoneInput } from "@/components/ui/phone-input";

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

const subscribeNever = () => () => {};

/** Step 1: contact details, remembered between page visits. Mounts the form once the saved draft has been read (client only). */
export function ContactStep({ defaultValues, onNext }: ContactStepProps) {
  // The server (and hydration) snapshot is `undefined`, so the form only mounts on the client, after the draft is known.
  const raw = useSyncExternalStore(subscribeNever, readRegistrationDraftRaw, () => undefined);
  if (raw === undefined) return null;
  return <ContactForm defaultValues={{ ...defaultValues, ...parseRegistrationDraft(raw) }} onNext={onNext} />;
}

/** The contact fields, plus the bot honeypot. */
function ContactForm({ defaultValues, onNext }: ContactStepProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationInput>({ resolver: zodResolver(registrationSchema), defaultValues });

  // Keep the draft up to date while typing.
  const values = useWatch({ control });
  useEffect(() => {
    saveRegistrationDraft(values as Partial<RegistrationInput>);
  }, [values]);

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
            <BirthdateInput id="reg-birthdate" value={field.value ?? ""} onChange={field.onChange} max={todayKey()} invalid={!!errors.birthdate} />
          )}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-phone" label="Telefonas" error={errors.phone?.message}>
          <FormPhoneInput<RegistrationInput> name="phone" control={control} id="reg-phone" invalid={!!errors.phone} />
        </Field>
        <Field id="reg-phone2" label="Papildomas telefonas (nebūtina)" error={errors.phone2?.message}>
          <FormPhoneInput<RegistrationInput> name="phone2" control={control} id="reg-phone2" invalid={!!errors.phone2} />
        </Field>
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" {...register("website")} />
      <Button type="submit" className="min-h-11 w-full">
        Toliau
      </Button>
    </form>
  );
}
