"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { createCouponOrder } from "@/app/actions/coupons";
import { ArrowButton } from "@/components/booking/arrow-button";
import { BookingPrice } from "@/components/booking/booking-price";
import { Field, goToCheckout } from "@/components/coupons/order-form";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { couponOrderSchema, type CouponOrderInput } from "@/lib/coupon-schema";
import { formatEuro, isWakeSeasonPass, type WakeOffer } from "@/lib/coupons";

interface WakeCheckoutDialogProps {
  product: WakeOffer;
  open: boolean;
  onClose: () => void;
}

/** Buyer details for a WAKE pass, then straight to Stripe Checkout (the pass is a paid coupon code). */
export function WakeCheckoutDialog({ product, open, onClose }: WakeCheckoutDialogProps) {
  const [redirecting, setRedirecting] = useState(false);
  const season = isWakeSeasonPass(product);
  const { register, handleSubmit, clearErrors, setError, formState } = useForm<CouponOrderInput>({
    resolver: zodResolver(couponOrderSchema),
    values: { productId: product.id, buyerName: "", buyerEmail: "", buyerPhone: "", recipientName: "", recipientEmail: "", message: "", website: "" },
    resetOptions: { keepDirtyValues: true },
  });
  const { errors, isSubmitting } = formState;
  const busy = isSubmitting || redirecting;

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
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-xl"
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
        onInteractOutside={(event) => { if (busy) event.preventDefault(); }}
      >
        <DialogPhotoClose disabled={busy} />
        <header className="shrink-0 space-y-3 p-6 pr-18">
          <DialogTitle className="font-display text-heading font-bold uppercase">Užbaik užsakymą</DialogTitle>
          <DialogDescription className="text-copy">{product.name}</DialogDescription>
        </header>
        <form
          onSubmit={(event) => {
            // The dialog is portaled but React still bubbles the event to a surrounding <form> (the reservation form): keep it here.
            event.stopPropagation();
            void submit(event);
          }}
          noValidate className="min-h-0 space-y-5 overflow-y-auto p-6 pt-0">
          <Field id="wake-name" label="Vardas, pavardė" error={errors.buyerName?.message}>
            <Input id="wake-name" autoComplete="name" aria-invalid={!!errors.buyerName} className="min-h-11" {...register("buyerName")} />
          </Field>
          <Field id="wake-email" label="El. paštas (čia atsiųsime kodą)" error={errors.buyerEmail?.message}>
            <Input id="wake-email" type="email" autoComplete="email" aria-invalid={!!errors.buyerEmail} className="min-h-11" {...register("buyerEmail")} />
          </Field>
          <Field id="wake-phone" label="Telefonas (nebūtina)" error={errors.buyerPhone?.message}>
            <Input id="wake-phone" type="tel" autoComplete="tel" placeholder="+370 612 34567" aria-invalid={!!errors.buyerPhone} className="min-h-11" {...register("buyerPhone")} />
          </Field>
          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="sr-only" {...register("website")} />
          <BookingPrice
            amount={formatEuro(product.value)}
            note={season ? "Apmokėjus gausi kupono kodą. Abonementą su šiuo kodu aktyvuos komanda parke." : "Apmokėjus gausi plaukimo kupono kodą. Plaukimo laiką suderink su Marso Akademija."}
          />
          {errors.root ? <p role="alert" className="text-sm text-rust-ink">{errors.root.message}</p> : null}
          <div className="border-t border-line pt-5">
            <ArrowButton fullWidth type="submit" disabled={busy}>
              {redirecting ? "Nukreipiame į apmokėjimą..." : isSubmitting ? "Siunčiama..." : `Mokėti ${formatEuro(product.value)}`}
            </ArrowButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
