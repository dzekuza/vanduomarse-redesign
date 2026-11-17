"use client";

import { trackSignUp } from "@/lib/analytics";
import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { registerRider } from "@/app/actions/registration";
import { clearRegistrationDraft } from "@/lib/registration-draft";
import type { RegistrationInput } from "@/lib/registration-schema";
import { CameraCapture } from "./camera-capture";
import { ContactStep } from "./contact-step";
import { RulesStep } from "./rules-step";

interface RegistrationFlowProps {
  initial?: Partial<RegistrationInput>;
}

const STEPS = [
  { id: "kontaktai", label: "Kontaktai" },
  { id: "nuotrauka", label: "Nuotrauka" },
  { id: "taisykles", label: "Taisyklės" },
] as const;

type Step = (typeof STEPS)[number]["id"] | "baigta";

/** The 3-step public registration: contacts, a profile photo, then the rules + signature. */
export function RegistrationFlow({ initial }: RegistrationFlowProps) {
  const [step, setStep] = useState<Step>("kontaktai");
  const [contact, setContact] = useState<RegistrationInput | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (step === "baigta") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary">
          <CheckIcon size={36} className="text-primary-foreground" />
        </div>
        <p className="text-lg font-bold">Registracija baigta!</p>
        <p className="max-w-sm text-sm text-muted-foreground">Prieikite prie kasos: darbuotojas suras jus vardu ir priskirs apyrankę. Jei abonementą pirkote internetu, pasakykite jo kodą.</p>
      </div>
    );
  }

  async function handleSubmit(signature: Blob) {
    if (!contact || !photo) return;
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("name", contact.name);
      form.set("surname", contact.surname);
      form.set("email", contact.email);
      form.set("phone", contact.phone);
      if (contact.phone2) form.set("phone2", contact.phone2);
      form.set("birthdate", contact.birthdate);
      if (contact.website) form.set("website", contact.website);
      form.set("photo", photo, "photo.jpg");
      form.set("signature", signature, "signature.png");

      const result = await registerRider(form);
      if ("error" in result) {
        setError(result.error.message);
        return;
      }
      clearRegistrationDraft();
      trackSignUp("rider_registration");
      setStep("baigta");
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = STEPS.findIndex(({ id }) => id === step);

  return (
    <div className="space-y-6">
      <ol aria-label="Registracijos žingsniai" className="grid grid-cols-3 gap-1.5">
        {STEPS.map(({ id, label }, i) => (
          <li key={id} aria-current={id === step ? "step" : undefined} className="space-y-2">
            <span className={`block text-xs ${id === step ? "font-bold text-ink" : "text-copy"}`}>{label}</span>
            <span aria-hidden className={`block h-1.5 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`} />
          </li>
        ))}
      </ol>

      {step === "kontaktai" ? (
        <ContactStep
          defaultValues={contact ?? initial ?? {}}
          onNext={(values) => {
            setContact(values);
            setStep("nuotrauka");
          }}
        />
      ) : null}

      {step === "nuotrauka" ? <CameraCapture onBack={() => setStep("kontaktai")} onNext={(blob) => { setPhoto(blob); setStep("taisykles"); }} /> : null}

      {step === "taisykles" && contact ? (
        <RulesStep
          fullName={`${contact.name} ${contact.surname}`}
          submitting={submitting}
          error={error}
          onBack={() => setStep("nuotrauka")}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
