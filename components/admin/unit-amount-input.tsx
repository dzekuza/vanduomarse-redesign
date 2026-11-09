import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface UnitAmountInputProps extends Omit<ComponentProps<"input">, "className"> {
  /** Shown inside the box, before the number (e.g. "€", "€/asm.", "min. sąsk. €"). */
  unit: string;
  className?: string;
}

/** A price field with its unit inside the box, ahead of the number — not as a separate line under the label. */
export function UnitAmountInput({ unit, className, "aria-invalid": ariaInvalid, ...props }: UnitAmountInputProps) {
  return (
    <div
      className={cn(
        "flex h-11 min-w-28 items-center gap-1.5 border border-input bg-card px-3 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        ariaInvalid ? "border-destructive has-[:focus-visible]:ring-destructive/20" : "",
        className,
      )}
    >
      <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{unit}</span>
      <input
        inputMode="decimal"
        aria-invalid={ariaInvalid}
        className="w-full min-w-0 border-0 bg-transparent p-0 text-right text-base tabular-nums outline-none md:text-sm"
        {...props}
      />
    </div>
  );
}
