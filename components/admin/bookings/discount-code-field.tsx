"use client";

import { useRef, useState, useTransition } from "react";
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
  /** The server's rejection of the code at submit, if any; shown in place of (and clearing) the local check. */
  error?: string;
  /** Lifts the checked code up (or null) so the dialog can price it into the total and send it on submit. */
  onChecked: (discount: CheckedDiscount | null) => void;
  /** A check is in flight: the dialog disables submit, so a half-verified code can never be sent. */
  onPendingChange: (pending: boolean) => void;
}

/**
 * Staff-entered discount code: checks it against the live table — the same preview `/rezervacija`'s checkout
 * uses — and shows what it takes off. The server re-checks and prices it again on submit; this is only a preview (ADR-0036).
 * Editing the code after a check clears it at once, so the total only ever reflects a code that matches what is typed;
 * a counter discards a check's result if the field has moved on to a different code by the time it resolves.
 */
export function DiscountCodeField({ id, value, onChange, service, subtotal, error, onChecked, onPendingChange }: DiscountCodeFieldProps) {
  const [checked, setChecked] = useState<CheckedDiscount | null>(null);
  const [localError, setLocalError] = useState("");
  const [pending, startTransition] = useTransition();
  const checkCount = useRef(0);

  const clear = () => {
    setChecked(null);
    setLocalError("");
    onChecked(null);
  };

  const handleChange = (next: string) => {
    onChange(next);
    checkCount.current += 1;
    if (checked || localError) clear();
  };

  const check = (code: string) => {
    const normalized = normalizeDiscountCode(code);
    if (!normalized) return clear();

    const thisCheck = ++checkCount.current;
    onPendingChange(true);
    startTransition(async () => {
      const result = await checkDiscountCode(normalized);
      if (thisCheck !== checkCount.current) return; // the field moved on to a different code while this was in flight
      onPendingChange(false);
      if ("error" in result) {
        setChecked(null);
        setLocalError(result.error.message);
        onChecked(null);
        return;
      }
      if (!discountCovers(result.data, service)) {
        setChecked(null);
        setLocalError("Šis kodas negalioja šiai paslaugai.");
        onChecked(null);
        return;
      }
      setChecked(result.data);
      setLocalError("");
      onChecked(result.data);
    });
  };

  const amount = checked ? discountFor(checked, service, subtotal) : 0;

  return (
    <FormField
      id={id}
      label="Nuolaidos kodas"
      error={error || localError}
      hint={pending ? "Tikrinama…" : checked ? `Taikoma: ${discountValueLabel(checked)} · -${formatEur(amount)}` : "Neprivaloma."}
      className="sm:col-span-2"
    >
      <Input id={id} value={value} onChange={(e) => handleChange(e.target.value)} onBlur={(e) => check(e.target.value)} placeholder="Pvz., WAKEBLACKFRIDAY2026" />
    </FormField>
  );
}
