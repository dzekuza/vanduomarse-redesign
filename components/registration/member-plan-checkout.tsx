"use client";

import { trackCheckout } from "@/lib/analytics";
import Link from "next/link";
import { useState } from "react";
import { buyPlanAsMember } from "@/app/actions/registration";
import { goToCheckout } from "@/components/coupons/order-form";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/coupons";
import type { RegistrationPlan } from "./plan-registration";

interface MemberPlanCheckoutProps {
  plan: RegistrationPlan;
  name: string;
  discountCode?: string;
  total: number;
  busy: boolean;
  otherRiderHref: string;
  setBusy: (busy: boolean) => void;
}

/** A customer who already registered buys the plan straight away: no contacts, photo or signature again. */
export function MemberPlanCheckout({ plan, name, discountCode, total, busy, otherRiderHref, setBusy }: MemberPlanCheckoutProps) {
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    const result = await buyPlanAsMember(plan.id, discountCode);
    if ("error" in result) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    trackCheckout("plan", { itemName: plan.name, value: total, coupon: discountCode });
    goToCheckout(result.data.checkoutUrl);
  }

  return (
    <div className="space-y-5">
      <p className="font-bold">Jau užsiregistravai{name ? `, ${name}` : ""}</p>
      {error ? <p role="alert" className="text-sm text-rust-ink">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" size="lg" className="min-h-11" disabled={busy} onClick={() => void pay()}>
          {busy ? "Nukreipiame į apmokėjimą..." : `Apmokėti ${formatEuro(total)}`}
        </Button>
        <Link href={otherRiderHref} className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">
          Registruoju kitą asmenį
        </Link>
      </div>
    </div>
  );
}
