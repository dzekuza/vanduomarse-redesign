"use client";

import { useState, useTransition } from "react";
import { checkDiscountCode } from "@/app/actions/discount-codes";
import { FormField } from "../form-field";
import { formatEur } from "@/lib/admin/format";
import { discountCovers, discountFor, discountValueLabel, normalizeDiscountCode, type CheckedDiscount, type DiscountService } from "@/lib/discount-codes";
import { Input } from "@/components/ui/input";

interface DiscountCodeFieldProps {
  id: string;
  value: string;
  onChange: (code: string) => void;
  /** What this booking counts as for the code's `services` list. */
  service: DiscountService;
  /** The price the code discounts, before its own cut. */
  subtotal: number;
  /** Lifts the checked code up (or null) so the dialog can price it into the total and send it on submit. */
  onChecked: (discount: CheckedDiscount | null) => void;
}

/**
 * Staff-entered discount code: checks it against the live table — the same preview `/rezervacija`'s checkout
 * uses — and shows what it takes off. The server re-checks and prices it again on submit; this is only a preview (ADR-0036).
 */
export function DiscountCodeField({ id, value, onChange, service, subtotal, onChecked }: DiscountCodeFieldProps) {
  const [checked, setChecked] = useState<CheckedDiscount | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const check = (code: string) => {
    const normalized = normalizeDiscountCode(code);
    if (!normalized) {
      setChecked(null);
      setError("");
      onChecked(null);
      return;
    }
    startTransition(async () => {
      const result = await checkDiscountCode(normalized);
      if ("error" in result) {
        setChecked(null);
        setError(result.error.message);
        onChecked(null);
        return;
      }
      if (!discountCovers(result.data, service)) {
        setChecked(null);
        setError("Šis kodas negalioja šiai paslaugai.");
        onChecked(null);
        return;
      }
      setChecked(result.data);
      setError("");
      onChecked(result.data);
    });
  };

  const amount = checked ? discountFor(checked, service, subtotal) : 0;

  return (
    <FormField
      id={id}
      label="Nuolaidos kodas"
      error={error}
      hint={pending ? "Tikrinama…" : checked ? `Taikoma: ${discountValueLabel(checked)} · -${formatEur(amount)}` : "Neprivaloma."}
      className="sm:col-span-2"
    >
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} onBlur={(e) => check(e.target.value)} placeholder="Pvz., WAKEBLACKFRIDAY2026" />
    </FormField>
  );
}
