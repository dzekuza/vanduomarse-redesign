"use client";

import { useState, useTransition } from "react";
import { checkDiscountCode } from "@/app/actions/discount-codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { discountValueLabel, type CheckedDiscount } from "@/lib/discount-codes";
import { formatEuro } from "@/lib/coupons";

interface CouponDiscountFieldProps {
  discount: CheckedDiscount | null;
  /** Euros the code takes off this coupon. */
  amount: number;
  disabled: boolean;
  onChange: (discount: CheckedDiscount | null) => void;
}

/** "Turite nuolaidos kodą?": expands to a code field; once applied shows what it takes off. The database prices the code again on submit. */
export function CouponDiscountField({ discount, amount, disabled, onChange }: CouponDiscountFieldProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function apply() {
    if (!code.trim()) return setError("Įveskite nuolaidos kodą.");
    setError("");
    startTransition(async () => {
      const result = await checkDiscountCode(code);
      if ("error" in result) return setError(result.error.message);
      if (!result.data.services.includes("kuponai")) return setError("Šis kodas netinka dovanų kuponams.");
      onChange(result.data);
      setCode("");
    });
  }

  if (discount) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border border-line px-4 py-2 text-sm">
        <p>
          Nuolaidos kodas <span className="font-bold">{discount.code}</span> ({discountValueLabel(discount)}): −{formatEuro(amount)}
        </p>
        <button type="button" disabled={disabled} onClick={() => onChange(null)} className="min-h-11 text-xs font-bold underline underline-offset-4 disabled:opacity-50">
          Pašalinti
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-sm text-ink/70 underline underline-offset-4 hover:text-rust">
        Turite nuolaidos kodą?
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="coupon-discount">Nuolaidos kodas</Label>
      <div className="flex gap-2">
        <Input
          id="coupon-discount"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            apply();
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={!!error}
          className="min-h-11 uppercase"
          disabled={disabled}
        />
        <Button type="button" variant="outline" className="min-h-11 border-ink bg-transparent" disabled={disabled || pending} onClick={apply}>
          {pending ? "Tikrinama..." : "Pritaikyti"}
        </Button>
      </div>
      {error ? <p role="alert" className="text-xs text-rust-ink">{error}</p> : null}
    </div>
  );
}
