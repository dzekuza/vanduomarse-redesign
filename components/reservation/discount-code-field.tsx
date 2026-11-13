"use client";

import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useFormContext } from "react-hook-form";
import { checkDiscountCode } from "@/app/actions/discount-codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { discountServicesLabel, discountValueLabel, type CheckedDiscount } from "@/lib/discount-codes";
import type { AccountValues } from "./account-step";

interface DiscountCodeFieldProps {
  discount: CheckedDiscount | null;
  /** Euros the code takes off the plan; 0 when it covers none of the picked activities. */
  amount: number;
  disabled: boolean;
  onChange: (discount: CheckedDiscount | null) => void;
  /** True while a check runs: the dialog holds back the final submit until it answers. */
  onPending: (pending: boolean) => void;
}

/**
 * "Nuolaidos kodas" in the checkout: a live check through `checkDiscountCode`, errors through
 * `setError`. The database validates and prices the code again on every request.
 * Sits inside the reservation form, so Enter applies the code instead of submitting.
 */
export function DiscountCodeField({ discount, amount, disabled, onChange, onPending }: DiscountCodeFieldProps) {
  const id = useId();
  const { register, getValues, setValue, setError, clearErrors, formState } = useFormContext<AccountValues>();
  const [pending, startTransition] = useTransition();
  /** Only the latest check may apply its answer. */
  const latest = useRef(0);
  const error = formState.errors.discountCode?.message;
  /** The input stays hidden behind a button until the customer says they have a code. */
  const [open, setOpen] = useState(false);

  useEffect(() => onPending(pending), [pending, onPending]);

  function apply() {
    const code = getValues("discountCode").trim();
    if (!code) return setError("discountCode", { message: "Įveskite nuolaidos kodą." });
    clearErrors("discountCode");
    const attempt = ++latest.current;
    startTransition(async () => {
      const result = await checkDiscountCode(code);
      if (attempt !== latest.current) return;
      if ("error" in result) {
        setError("discountCode", { message: result.error.message });
        return;
      }
      setValue("discountCode", result.data.code);
      onChange(result.data);
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    apply();
  }

  if (discount) {
    return (
      <div className="space-y-1 border border-line p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p>
            Nuolaidos kodas <span className="font-bold">{discount.code}</span>: {discountValueLabel(discount)}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setValue("discountCode", "");
              onChange(null);
            }}
            className="inline-flex min-h-11 items-center text-xs font-bold underline underline-offset-4 disabled:opacity-50"
          >
            Pašalinti
          </button>
        </div>
        <p className="text-copy">
          {amount > 0 ? `Taikoma: ${discountServicesLabel(discount.services)}.` : `Kodas taikomas tik: ${discountServicesLabel(discount.services)}. Jūsų plane tokių veiklų nėra.`}
        </p>
      </div>
    );
  }

  if (!open && !error) {
    return (
      <Button type="button" variant="outline" size="lg" className="border-ink bg-transparent" disabled={disabled} onClick={() => setOpen(true)}>
        Turiu nuolaidos kodą
      </Button>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${id}-discount`}>Nuolaidos kodas</Label>
      <div className="flex gap-2">
        <Input
          id={`${id}-discount`}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-discount-error` : undefined}
          className="min-h-11 uppercase"
          autoFocus
          disabled={disabled}
          readOnly={pending}
          onKeyDown={onKeyDown}
          {...register("discountCode")}
        />
        <Button type="button" variant="outline" className="border-ink bg-transparent" disabled={disabled || pending} onClick={apply}>
          {pending ? "Tikrinama..." : "Pritaikyti"}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-discount-error`} role="alert" className="text-xs text-rust-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
