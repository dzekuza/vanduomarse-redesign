"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { confirmPhoneCode, requestPhoneCode } from "@/app/actions/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPhoneVerification } from "@/hooks/use-phone-verification";
import { phoneCodeSchema, phoneNumberSchema, type PhoneCodeValues, type PhoneNumberValues } from "@/lib/phone-schema";
import { ArrowButton } from "./arrow-button";
import { BookingCard } from "./booking-card";
import { StepLabel } from "./step-label";

const STEP_TITLE = "Telefono patvirtinimas";

/** When the resend button unlocks, as a timestamp. */
const secondsFromNow = (s: number) => Date.now() + s * 1000;

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

/** Step 1: which number to text. */
export function PhoneNumberStep({ onSent }: { onSent: (phone: string, resendAt: number) => void }) {
  const form = useForm<PhoneNumberValues>({ resolver: zodResolver(phoneNumberSchema), defaultValues: { phone: "" } });
  const { errors, isSubmitting } = form.formState;
  const id = useId();

  const submit = form.handleSubmit(async (values) => {
    const result = await requestPhoneCode(values);
    if ("error" in result) return form.setError("phone", { message: result.error.message });
    onSent(result.data.phone, secondsFromNow(result.data.resendIn));
  });

  return (
    <form onSubmit={submit} noValidate>
      <BookingCard
        summary={<p className="text-sm text-ink/60">Kodas galioja 10 min.</p>}
        action={
          <ArrowButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Siunčiama..." : "Siųsti kodą"}
          </ArrowButton>
        }
      >
        <div className="space-y-4">
          <StepLabel step={1}>{STEP_TITLE}</StepLabel>
          <p className="text-sm text-ink/80">Prieš rezervuodami patvirtinkite telefono numerį: atsiųsime 6 skaitmenų kodą SMS žinute.</p>
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor={id}>Telefonas</Label>
            <Input id={id} type="tel" autoComplete="tel" placeholder="+370 612 34567" aria-invalid={!!errors.phone} {...form.register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
      </BookingCard>
    </form>
  );
}

/** Seconds left until `at`, ticking once a second. */
function useSecondsUntil(at: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [at]);
  return Math.max(0, Math.ceil((at - now) / 1000));
}

interface CodeStepProps {
  phone: string;
  resendAt: number;
  onResent: (resendAt: number) => void;
  onChangeNumber: () => void;
}

/** Step 2: the code from the SMS; success unlocks the booking flow for the whole tab. */
export function PhoneCodeStep({ phone, resendAt, onResent, onChangeNumber }: CodeStepProps) {
  const form = useForm<PhoneCodeValues>({ resolver: zodResolver(phoneCodeSchema), defaultValues: { phone, code: "" } });
  const { errors, isSubmitting } = form.formState;
  const id = useId();
  const [resending, setResending] = useState(false);
  const wait = useSecondsUntil(resendAt);

  const submit = form.handleSubmit(async (values) => {
    const result = await confirmPhoneCode(values);
    if ("error" in result) return form.setError("code", { message: result.error.message });
    setPhoneVerification(result.data);
  });

  async function resend() {
    setResending(true);
    try {
      const result = await requestPhoneCode({ phone });
      if ("error" in result) return form.setError("code", { message: result.error.message });
      form.clearErrors("code");
      onResent(secondsFromNow(result.data.resendIn));
    } catch {
      form.setError("code", { message: "Nepavyko išsiųsti kodo. Patikrinkite ryšį ir bandykite dar kartą." });
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <BookingCard
        summary={<p className="text-sm text-ink/60">Išsiuntėme numeriu {phone}</p>}
        action={
          <ArrowButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Tikrinama..." : "Patvirtinti"}
          </ArrowButton>
        }
      >
        <div className="space-y-4">
          <StepLabel step={2}>{STEP_TITLE}</StepLabel>
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor={id}>SMS kodas</Label>
            <Input
              id={id}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              aria-invalid={!!errors.code}
              autoFocus
              {...form.register("code")}
            />
            <FieldError message={errors.code?.message} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={wait > 0 || resending} onClick={resend}>
              {wait > 0 ? `Siųsti dar kartą po ${wait} s` : resending ? "Siunčiama..." : "Siųsti dar kartą"}
            </Button>
            <Button type="button" variant="ghost" onClick={onChangeNumber}>
              Keisti numerį
            </Button>
          </div>
        </div>
      </BookingCard>
    </form>
  );
}
