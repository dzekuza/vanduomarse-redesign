"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { DISCOUNT_SERVICES, type DiscountService } from "@/lib/discount-codes";

interface ServiceChecksProps {
  value: DiscountService[];
  onChange: (value: DiscountService[]) => void;
  labels: Record<DiscountService, string>;
  error?: string;
}

/** Which services a discount code covers: wrapping toggle chips, at least one. */
export function ServiceChecks({ value, onChange, labels, error }: ServiceChecksProps) {
  const errorId = useId();

  function toggle(service: DiscountService) {
    onChange(value.includes(service) ? value.filter((s) => s !== service) : DISCOUNT_SERVICES.filter((s) => s === service || value.includes(s)));
  }

  return (
    <fieldset className="space-y-1.5" aria-invalid={!!error} aria-describedby={error ? errorId : undefined}>
      <legend className="text-sm font-medium">Taikoma paslaugoms</legend>
      <div className="flex flex-wrap gap-2">
        {DISCOUNT_SERVICES.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s)}
              className={`flex min-h-11 items-center gap-2 border px-4 text-sm transition-colors ${on ? "border-ink bg-ink text-foam" : "bg-card hover:bg-muted"}`}
            >
              {on ? <CheckIcon size={16} weight="bold" aria-hidden /> : null}
              {labels[s]}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
