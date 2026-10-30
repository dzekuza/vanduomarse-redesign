"use client";

import { useFormContext } from "react-hook-form";
import { VerifiedPhoneField } from "@/components/booking/verified-phone-field";
import { Input } from "@/components/ui/input";
import { usePhoneVerification } from "@/hooks/use-phone-verification";
import { Label } from "@/components/ui/label";

interface ContactValues {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  website?: string;
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

/**
 * Name, phone and email (one of the last two is required) plus the bot honeypot.
 * Behind a PhoneGate the phone is the verified one, locked. Must sit inside a FormProvider.
 */
export function ContactFields({ idPrefix }: { idPrefix: string }) {
  const { register, formState } = useFormContext<ContactValues>();
  const verification = usePhoneVerification();
  const err = formState.errors;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field id={`${idPrefix}-name`} label="Vardas, pavardė" error={err.customerName?.message}>
          <Input id={`${idPrefix}-name`} autoComplete="name" aria-invalid={!!err.customerName} {...register("customerName")} />
        </Field>
      </div>
      {verification ? (
        <VerifiedPhoneField id={`${idPrefix}-phone`} name="customerPhone" verification={verification} />
      ) : (
        <Field id={`${idPrefix}-phone`} label="Telefonas" error={err.customerPhone?.message}>
          <Input id={`${idPrefix}-phone`} type="tel" autoComplete="tel" aria-invalid={!!err.customerPhone} {...register("customerPhone")} />
        </Field>
      )}
      <Field id={`${idPrefix}-email`} label="El. paštas" error={err.customerEmail?.message}>
        <Input id={`${idPrefix}-email`} type="email" autoComplete="email" aria-invalid={!!err.customerEmail} {...register("customerEmail")} />
      </Field>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" {...register("website")} />
    </div>
  );
}
