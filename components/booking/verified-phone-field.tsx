"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPhoneVerification, type PhoneVerification } from "@/hooks/use-phone-verification";

interface VerifiedPhoneFieldProps {
  id: string;
  /** The form's phone field: customerPhone in bookings, buyerPhone for coupons. */
  name: string;
  verification: PhoneVerification;
}

/**
 * The number the phone gate verified, read-only, plus the hidden token the
 * server action checks against it. "Keisti" drops the verification, so the
 * gate asks again. Must sit inside a FormProvider.
 */
export function VerifiedPhoneField({ id, name, verification }: VerifiedPhoneFieldProps) {
  const { register, setValue } = useFormContext<Record<string, string>>();

  useEffect(() => {
    setValue(name, verification.phone);
    setValue("verificationToken", verification.token);
  }, [name, verification, setValue]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Telefonas (patvirtintas)</Label>
      <div className="flex gap-2">
        <Input id={id} type="tel" readOnly {...register(name)} />
        <Button type="button" variant="outline" className="shrink-0 border-ink bg-transparent" onClick={() => setPhoneVerification(null)}>
          Keisti
        </Button>
      </div>
      <input type="hidden" {...register("verificationToken")} />
    </div>
  );
}
