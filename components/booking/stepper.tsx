"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  label: string;
  /** Type the number instead of only pressing − / +. */
  editable?: boolean;
}

interface StepperControlsProps extends StepperProps {
  /** `line` for light cards (hairline border, ink text); `current` follows the surrounding text colour (option cards, dark tiles). */
  tone?: "line" | "current";
}

const BUTTON =
  "flex size-11 items-center justify-center border transition-[color,border-color,scale] duration-150 ease-out-strong enabled:hover:border-rust enabled:hover:text-rust motion-safe:enabled:active:scale-90 disabled:opacity-30";

/** The − / value / + row on its own. `label` is the accessible name only, so place a visible caption yourself or use `Stepper` / `CompactStepper`. */
export function StepperControls({ value, onChange, min, max, label, editable = false, tone = "line" }: StepperControlsProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const current = draft ? Math.max(min, Math.min(max, Number(draft))) : value;
  const toneClass = tone === "current" ? "border-current/25" : "border-line text-ink";

  function commit(next: number) {
    setDraft(null);
    if (next !== value) onChange(next);
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={() => commit(Math.max(min, current - 1))} disabled={current <= min} aria-label="Sumažinti" className={`${BUTTON} ${toneClass}`}>
        −
      </button>
      {editable ? (
        <Input
          inputMode="numeric"
          aria-label={label}
          value={draft ?? value}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const next = event.target.value;
            if (/^\d*$/.test(next)) setDraft(next);
          }}
          onBlur={() => commit(current)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
          className={`w-12 rounded-none bg-transparent px-1 text-center font-bold tabular-nums ${tone === "current" ? "border-current/25" : "border-line"}`}
        />
      ) : (
        <span className="min-w-8 text-center font-bold tabular-nums">{value}</span>
      )}
      <button type="button" onClick={() => commit(Math.min(max, current + 1))} disabled={current >= max} aria-label="Padidinti" className={`${BUTTON} ${toneClass}`}>
        +
      </button>
    </div>
  );
}

/** Boxed field: label on the left, controls on the right. */
export function Stepper(props: StepperProps) {
  return (
    <div className="flex min-h-15 items-center justify-between gap-3 border border-line py-2 pl-4 pr-2">
      <span className="min-w-0 text-sm leading-snug text-ink">{props.label}</span>
      <StepperControls {...props} tone="line" />
    </div>
  );
}

/** Label above the controls, no box: for option cards and dark tiles that supply their own surface. */
export function CompactStepper(props: StepperProps) {
  return (
    <div className="grid w-fit gap-1">
      <span className="text-micro uppercase">{props.label}</span>
      <StepperControls {...props} tone="current" />
    </div>
  );
}
