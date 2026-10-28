"use client";

import { useFormContext } from "react-hook-form";
import { StepLabel } from "./step-label";
import { ContactFields } from "@/components/quads/contact-fields";

/** Last step of a booking form: who to confirm with, plus any server-side conflict. Must sit inside a FormProvider. */
export function ContactStep({ step, idPrefix }: { step: number; idPrefix: string }) {
  const { formState } = useFormContext();
  return (
    <div className="space-y-4">
      <StepLabel step={step}>Kontaktai</StepLabel>
      <ContactFields idPrefix={idPrefix} />
      {formState.errors.root ? (
        <p role="alert" className="text-sm text-destructive">
          {formState.errors.root.message}
        </p>
      ) : null}
    </div>
  );
}
