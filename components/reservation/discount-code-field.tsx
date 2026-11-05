"use client";

import { useId, useTransition, type KeyboardEvent } from "react";
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
}

/**
 * "Nuolaidos kodas" in the checkout: a live check through `checkDiscountCode`, errors through
 * `setError`. The database validates and prices the code again on every request.
 * Sits inside the reservation form, so Enter applies the code instead of submitting.
 */
export function DiscountCodeField({ discount, amount, disabled, onChange }: DiscountCodeFieldProps) {
  const id = useId();
  const { register, getValues, setValue, setError, clearErrors, formState } = useFormContext<AccountValues>();
  const [pending, startTransition] = useTransition();
  const error = formState.errors.discountCode?.message;

  function apply() {
    const code = getValues("discountCode").trim();
    if (!code) return setError("discountCode", { message: "Įveskite nuolaidos kodą." });
    clearErrors("discountCode");
    startTransition(async () => {
      const result = await checkDiscountCode(code);
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
          disabled={disabled}
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
