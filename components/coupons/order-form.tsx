"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { createCouponOrder, type CouponOrderResult } from "@/app/actions/coupons";
import { ArrowButton } from "@/components/booking/arrow-button";
import { VerifiedPhoneField } from "@/components/booking/verified-phone-field";
import { usePhoneVerification } from "@/hooks/use-phone-verification";
import { Eyebrow } from "@/components/eyebrow";
import { Panel } from "@/components/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { couponOrderSchema, type CouponOrderInput } from "@/lib/coupon-schema";
import { formatEuro, type CouponProduct } from "@/lib/coupons";

const MESSAGE_MAX = 300;

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-rust-ink">{error}</p> : null}
    </div>
  );
}

interface OrderFormProps {
  product: CouponProduct;
  onOrdered: (result: CouponOrderResult, email: string) => void;
}

/** Buyer, recipient and message for the selected coupon. Validates with the same schema as the server action. */
export function OrderForm({ product, onOrdered }: OrderFormProps) {
  const verification = usePhoneVerification();
  const form = useForm<CouponOrderInput>({
    resolver: zodResolver(couponOrderSchema),
    values: {
      productId: product.id,
      buyerName: "",
      buyerEmail: "",
      buyerPhone: verification?.phone ?? "",
      verificationToken: verification?.token ?? "",
      recipientName: "",
      message: "",
      website: "",
    },
    resetOptions: { keepDirtyValues: true },
  });
  const { register, handleSubmit, control, setError, formState } = form;
  const { errors, isSubmitting } = formState;
  const messageLength = useWatch({ control, name: "message" })?.length ?? 0;

  const submit = handleSubmit(async (values) => {
    const result = await createCouponOrder(values);
    if ("error" in result) {
      setError("root", { message: result.error.message });
      return;
    }
    onOrdered(result.data, values.buyerEmail);
  });

  return (
    <FormProvider {...form}>
    <Panel className="sm:p-8">
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <Eyebrow>Užsakymas</Eyebrow>
        <p className="mt-1 text-item font-bold">{product.name}</p>
        <p className="font-display text-total font-bold">{formatEuro(product.value)}</p>
      </div>
      <Field id="buyerName" label="Jūsų vardas" error={errors.buyerName?.message}>
        <Input id="buyerName" autoComplete="name" aria-invalid={!!errors.buyerName} {...register("buyerName")} />
      </Field>
      <Field id="buyerEmail" label="El. paštas (čia atsiųsime kodą)" error={errors.buyerEmail?.message}>
        <Input id="buyerEmail" type="email" autoComplete="email" aria-invalid={!!errors.buyerEmail} {...register("buyerEmail")} />
      </Field>
      {verification ? <VerifiedPhoneField id="buyerPhone" name="buyerPhone" verification={verification} /> : null}
      <Field id="recipientName" label="Kam dovanojate (nebūtina)" error={errors.recipientName?.message}>
        <Input id="recipientName" {...register("recipientName")} />
      </Field>
      <Field id="message" label="Palinkėjimas (nebūtina)" error={errors.message?.message}>
        <Textarea id="message" rows={3} maxLength={MESSAGE_MAX} {...register("message")} />
        <p className="text-xs text-muted-foreground">{messageLength} / {MESSAGE_MAX}</p>
      </Field>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" {...register("website")} />
      {errors.root ? <p role="alert" className="text-sm text-rust-ink">{errors.root.message}</p> : null}
      <ArrowButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Siunčiama..." : "Užsakyti kuponą"}
      </ArrowButton>
      <p className="text-xs text-muted-foreground">Kainos nurodytos su 21% PVM. Apmokėjimo detales atsiųsime el. paštu.</p>
    </form>
    </Panel>
    </FormProvider>
  );
}
