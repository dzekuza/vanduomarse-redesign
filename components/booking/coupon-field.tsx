"use client";

import { useState, useTransition } from "react";
import { checkCoupon } from "@/app/actions/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCode, formatEuro, type CheckedCoupon, type RedeemableService } from "@/lib/coupons";

interface CouponFieldProps {
  flow: RedeemableService;
  coupon: CheckedCoupon | null;
  /** Euros the coupon takes off the current total. */
  discount: number;
  onChange: (coupon: CheckedCoupon | null) => void;
}

/** "Turite dovanų kuponą?": expands to a code field; once applied shows the discount and what stays on the coupon. */
export function CouponField({ flow, coupon, discount, onChange }: CouponFieldProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function apply(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await checkCoupon(code, flow);
      if ("error" in result) return setError(result.error.message);
      onChange(result.data);
      setCode("");
    });
  }

  if (coupon) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border border-line px-4 py-2 text-sm">
        <p>
          Kuponas <span className="font-normal">{formatCode(coupon.code)}</span>: −{formatEuro(discount)}
          <span className="text-ink/60"> (kupone liks {formatEuro(coupon.balance - discount)})</span>
        </p>
        <button type="button" onClick={() => onChange(null)} className="min-h-11 text-ink/70 underline underline-offset-4 hover:text-rust">
          Pašalinti
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-sm text-ink/70 underline underline-offset-4 hover:text-rust">
        Turite dovanų kuponą?
      </button>
    );
  }

  return (
    <form onSubmit={apply} className="space-y-2">
      <Label htmlFor={`coupon-${flow}`}>Kupono kodas</Label>
      <div className="flex gap-2">
        <Input
          id={`coupon-${flow}`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="XXXX-XXXX-XXXX"
          aria-invalid={!!error}
          className="min-h-11 uppercase"
        />
        <Button type="submit" variant="outline" disabled={pending || !code.trim()} className="min-h-11">
          {pending ? "Tikrinama..." : "Pritaikyti"}
        </Button>
      </div>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </form>
  );
}
