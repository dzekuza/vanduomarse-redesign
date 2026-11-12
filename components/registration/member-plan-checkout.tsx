"use client";

import Link from "next/link";
import { useState } from "react";
import { buyPlanAsMember } from "@/app/actions/registration";
import { goToCheckout } from "@/components/coupons/order-form";
import { CouponDiscountField } from "@/components/coupons/coupon-discount-field";
import { Button } from "@/components/ui/button";
import { discountFor, type CheckedDiscount } from "@/lib/discount-codes";
import { formatEuro } from "@/lib/coupons";
import type { RegistrationPlan } from "./registration-flow";

/** A customer who already registered buys the plan straight away: no contacts, photo or signature again. */
export function MemberPlanCheckout({ plan, name }: { plan: RegistrationPlan; name: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<CheckedDiscount | null>(null);
  const discountAmount = discount ? discountFor(discount, "planai", plan.price) : 0;
  const total = Math.max(plan.price - discountAmount, 0);

  async function pay() {
    setBusy(true);
    setError(null);
    const result = await buyPlanAsMember(plan.id, discount?.code);
    if ("error" in result) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    goToCheckout(result.data.checkoutUrl);
  }

  return (
    <div className="space-y-5 border border-line p-5 sm:p-6">
      <div className="space-y-1">
        <p className="text-micro uppercase text-copy">Jau užsiregistravai{name ? `, ${name}` : ""}</p>
        <p className="font-display text-heading font-bold uppercase">{plan.name}</p>
        <p className="font-display text-total font-bold">{formatEuro(total)}</p>
        {discount ? <p className="text-sm text-copy">Kaina be nuolaidos {formatEuro(plan.price)}</p> : null}
      </div>
      <p className="text-sm text-copy">Registruotis iš naujo nereikia: kontaktai, nuotrauka ir pasirašytos taisyklės jau išsaugoti. Apmokėjus planas priskiriamas tau, o apyrankę parke priskirs darbuotojas.</p>
      <CouponDiscountField service="planai" discount={discount} amount={discountAmount} disabled={busy} onChange={setDiscount} />
      {error ? <p role="alert" className="text-sm text-rust-ink">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" size="lg" className="min-h-11" disabled={busy} onClick={() => void pay()}>
          {busy ? "Nukreipiame į apmokėjimą..." : `Apmokėti ${formatEuro(total)}`}
        </Button>
        <Link href={`/registracija?abonementas=${encodeURIComponent(plan.id)}&kitas=1`} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">
          Registruoju kitą asmenį
        </Link>
      </div>
    </div>
  );
}
