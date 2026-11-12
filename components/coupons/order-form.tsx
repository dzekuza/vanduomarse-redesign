"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createCouponOrder } from "@/app/actions/coupons";
import { ArrowButton } from "@/components/booking/arrow-button";
import { BookingPrice } from "@/components/booking/booking-price";
import { Eyebrow } from "@/components/eyebrow";
import { Panel } from "@/components/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { couponOrderSchema, type CouponOrderInput } from "@/lib/coupon-schema";
import { formatEuro, isWakeSeasonPass, type CouponProduct } from "@/lib/coupons";

const MESSAGE_MAX = 300;

/** Stripe Checkout cannot open inside the embedded iframe, so the whole window (the embedding site's top page) goes to it. */
export function goToCheckout(url: string) {
  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // Navigating a cross-origin top window can be refused: open it in this frame's window instead.
  }
  window.location.assign(url);
}

export function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-rust-ink">{error}</p> : null}
    </div>
  );
}

/** Buyer, recipient and message for the selected coupon. Validates with the same schema as the server action, then sends the buyer to Stripe Checkout. */
export function OrderForm({ product }: { product: CouponProduct }) {
  const [redirecting, setRedirecting] = useState(false);
  const form = useForm<CouponOrderInput>({
    resolver: zodResolver(couponOrderSchema),
    values: {
      productId: product.id,
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      recipientName: "",
      recipientEmail: "",
      message: "",
      website: "",
    },
    resetOptions: { keepDirtyValues: true },
  });
  const { register, handleSubmit, control, clearErrors, setError, formState } = form;
  const { errors, isSubmitting } = formState;
  const messageLength = useWatch({ control, name: "message" })?.length ?? 0;

  const submit = handleSubmit(async (values) => {
    clearErrors("root");
    const result = await createCouponOrder(values);
    if ("error" in result) {
      setError("root", { message: result.error.message });
      return;
    }
    setRedirecting(true);
    goToCheckout(result.data.checkoutUrl);
  });

  return (
    <Panel className="sm:p-8">
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <Eyebrow>Užsakymas</Eyebrow>
        <p className="mt-1 text-item font-bold">{product.name}</p>
      </div>
      <Field id="buyerName" label="Jūsų vardas" error={errors.buyerName?.message}>
        <Input id="buyerName" autoComplete="name" aria-invalid={!!errors.buyerName} {...register("buyerName")} />
      </Field>
      <Field id="buyerEmail" label="El. paštas (čia atsiųsime kodą)" error={errors.buyerEmail?.message}>
        <Input id="buyerEmail" type="email" autoComplete="email" aria-invalid={!!errors.buyerEmail} {...register("buyerEmail")} />
      </Field>
      <Field id="buyerPhone" label="Telefonas (nebūtina)" error={errors.buyerPhone?.message}>
        <Input id="buyerPhone" type="tel" autoComplete="tel" placeholder="+370 612 34567" aria-invalid={!!errors.buyerPhone} {...register("buyerPhone")} />
      </Field>
      <Field id="recipientName" label="Kam dovanojate (nebūtina)" error={errors.recipientName?.message}>
        <Input id="recipientName" {...register("recipientName")} />
      </Field>
      <Field id="recipientEmail" label="Gavėjo el. paštas (nebūtina)" error={errors.recipientEmail?.message}>
        <Input id="recipientEmail" type="email" aria-invalid={!!errors.recipientEmail} {...register("recipientEmail")} />
        <p className="text-xs text-copy">Apmokėjus kupono kodą atsiųsime ir jam.</p>
      </Field>
      <Field id="message" label="Palinkėjimas (nebūtina)" error={errors.message?.message}>
        <Textarea id="message" rows={3} maxLength={MESSAGE_MAX} {...register("message")} />
        <p className="text-xs text-copy">{messageLength} / {MESSAGE_MAX}</p>
      </Field>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" {...register("website")} />
      {errors.root ? <p role="alert" className="text-sm text-rust-ink">{errors.root.message}</p> : null}
      <BookingPrice amount={formatEuro(product.value)} note="Apmokėsite saugiai kortele. Kodą atsiųsime el. paštu iškart po apmokėjimo." />
      <ArrowButton fullWidth type="submit" disabled={isSubmitting || redirecting}>
        {redirecting ? "Nukreipiame į apmokėjimą..." : isSubmitting ? "Siunčiama..." : "Pirkti kuponą"}
      </ArrowButton>
      {isWakeSeasonPass(product) ? <p className="text-xs text-copy">Apmokėtą kupono kodą pateik komandai parke, kad ji aktyvuotų abonementą.</p> : null}
    </form>
    </Panel>
  );
}
