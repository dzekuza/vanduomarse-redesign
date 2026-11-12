"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { registerRider } from "@/app/actions/registration";
import { goToCheckout } from "@/components/coupons/order-form";
import { formatEuro } from "@/lib/coupons";
import { clearRegistrationDraft } from "@/lib/registration-draft";
import type { RegistrationInput } from "@/lib/registration-schema";
import { CameraCapture } from "./camera-capture";
import { ContactStep } from "./contact-step";
import { RulesStep } from "./rules-step";

/** A bracelet plan bought together with the registration (WAKE season pass). */
export interface RegistrationPlan {
  id: string;
  name: string;
  price: number;
}

type Step = "kontaktai" | "nuotrauka" | "taisykles" | "baigta";

const STEPS: Step[] = ["kontaktai", "nuotrauka", "taisykles"];

/** The 3-step public registration: contacts, a profile photo, then the rules + signature. */
export function RegistrationFlow({ plan, initial }: { plan?: RegistrationPlan; /** Details the signed-in customer already gave, to prefill step 1. */ initial?: Partial<RegistrationInput> }) {
  const [step, setStep] = useState<Step>("kontaktai");
  const [contact, setContact] = useState<RegistrationInput | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  if (step === "baigta") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary">
          <CheckIcon size={36} className="text-primary-foreground" />
        </div>
        <p className="text-lg font-bold">Registracija baigta!</p>
        <p className="max-w-sm text-sm text-muted-foreground">Prieikite prie kasos — darbuotojas suras jus vardu ir priskirs apyrankę.</p>
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
      if (plan) form.set("planId", plan.id);

      const result = await registerRider(form);
      if ("error" in result) {
        setError(result.error.message);
        return;
      }
      clearRegistrationDraft();
      if (result.data.checkoutUrl) {
        setRedirecting(true);
        goToCheckout(result.data.checkoutUrl);
        return;
      }
      setStep("baigta");
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="space-y-6">
      {plan ? (
        <div className="rounded-lg border border-border p-4 text-sm">
          <p className="font-bold">{plan.name}: {formatEuro(plan.price)}</p>
          <p className="text-muted-foreground">Užpildyk kontaktus, nusifotografuok ir pasirašyk taisykles, tada apmokėk. Apyrankę priskirs darbuotojas parke.</p>
        </div>
      ) : null}
      <div className="flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

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
          submitting={submitting || redirecting}
          submitLabel={plan ? `Sutinku ir mokėti ${formatEuro(plan.price)}` : undefined}
          error={error}
          onBack={() => setStep("nuotrauka")}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
