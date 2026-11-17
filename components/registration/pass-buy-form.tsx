"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { buyPlanPass } from "@/app/actions/plan-pass";
import { ArrowButton } from "@/components/booking/arrow-button";
import { Field, goToCheckout } from "@/components/coupons/order-form";
import { Input } from "@/components/ui/input";
import { trackCheckout } from "@/lib/analytics";
import { formatEuro } from "@/lib/coupons";
import { planPassSchema, type PlanPassInput } from "@/lib/plan-pass";
import type { RegistrationPlan } from "./plan-registration";

interface PassBuyFormProps {
  plan: RegistrationPlan;
  /** "Perku draugui": the code is meant to be handed on, so the form also names the friend. */
  gift: boolean;
  discountCode?: string;
  total: number;
  /** Prefilled from the signed-in account, if any. */
  buyer?: { name: string; email: string };
  setBusy: (busy: boolean) => void;
}

/**
 * Buy a bracelet plan with only a name and an e-mail, then pay on Stripe (ADR-0109). Registration (contacts, photo, signed
 * rules) comes later, before staff attach the pass to a rider at the park.
 */
export function PassBuyForm({
  plan,
  gift,
  discountCode,
  total,
  buyer,
  setBusy,
}: PassBuyFormProps) {
  const [redirecting, setRedirecting] = useState(false);
  const form = useForm<PlanPassInput>({
    resolver: zodResolver(planPassSchema),
    defaultValues: {
      planId: plan.id,
      buyerName: buyer?.name ?? "",
      buyerEmail: buyer?.email ?? "",
      gift,
      recipientName: "",
      website: "",
    },
  });
  const { register, handleSubmit, clearErrors, setError, formState } = form;
  const { errors, isSubmitting } = formState;

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    setBusy(true);
    const result = await buyPlanPass({ ...values, gift, discountCode });
    if ("error" in result) {
      setError("root", { message: result.error.message });
      setBusy(false);
      return;
    }
    trackCheckout("plan", {
      itemName: plan.name,
      value: total,
      coupon: discountCode,
    });
    setRedirecting(true);
    goToCheckout(result.data.checkoutUrl);
  });

  const working = isSubmitting || redirecting;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field
        id={`buyerName-${gift}`}
        label={gift ? "Jūsų vardas ir pavardė" : "Vardas ir pavardė"}
        error={errors.buyerName?.message}
      >
        <Input
          id={`buyerName-${gift}`}
          autoComplete="name"
          aria-invalid={!!errors.buyerName}
          {...register("buyerName")}
        />
      </Field>
      <Field
        id={`buyerEmail-${gift}`}
        label="El. paštas (čia atsiųsime abonemento kodą)"
        error={errors.buyerEmail?.message}
      >
        <Input
          id={`buyerEmail-${gift}`}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.buyerEmail}
          {...register("buyerEmail")}
        />
      </Field>
      {gift ? (
        <Field
          id="recipientName"
          label="Kam perkate (nebūtina)"
          error={errors.recipientName?.message}
        >
          <Input id="recipientName" {...register("recipientName")} />
        </Field>
      ) : null}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="sr-only"
        {...register("website")}
      />
      {errors.root ? (
        <p role="alert" className="text-sm text-rust-ink">
          {errors.root.message}
        </p>
      ) : null}
      <p className="text-sm text-copy">
        {gift
          ? "Gausite el. laišką su kodu: perduokite jį draugui. Draugas užsiregistruos pats ir parke pasakys kodą."
          : "Registraciją (kontaktai, nuotrauka, taisyklės) užpildysi vėliau, prieš gaudamas apyrankę. Kodą atsiųsime el. paštu."}
      </p>
      <ArrowButton fullWidth type="submit" disabled={working}>
        {redirecting
          ? "Nukreipiame į apmokėjimą..."
          : isSubmitting
            ? "Siunčiama..."
            : gift
              ? `Pirkti draugui ${formatEuro(total)}`
              : `Apmokėti ${formatEuro(total)}`}
      </ArrowButton>
    </form>
  );
}
