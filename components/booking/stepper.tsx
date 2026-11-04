"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export function Stepper({
  value,
  onChange,
  min,
  max,
  label,
  editable = false,
  compact = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  label: string;
  editable?: boolean;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const current = draft ? Math.max(min, Math.min(max, Number(draft))) : value;
  const controlBorder = compact ? "border-current/25" : "border-line";

  function commit(next: number) {
    setDraft(null);
    if (next !== value) onChange(next);
  }

  return (
    <div className={compact ? "grid w-fit gap-1" : "flex min-h-15 items-center justify-between gap-3 border border-line py-2 pl-4 pr-2"}>
      <span className={compact ? "text-micro uppercase" : "min-w-0 text-sm leading-snug text-ink"}>{label}</span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => commit(Math.max(min, current - 1))}
          disabled={current <= min}
          aria-label="Sumažinti"
          className={`flex size-11 items-center justify-center border transition-[color,border-color,scale] duration-150 ease-out-strong enabled:hover:border-rust enabled:hover:text-rust motion-safe:enabled:active:scale-90 disabled:opacity-30 ${controlBorder} ${compact ? "" : "text-ink"}`}
        >
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
            className={`w-12 rounded-none bg-transparent px-1 text-center font-bold tabular-nums ${controlBorder}`}
          />
        ) : (
          <span className="min-w-8 text-center font-bold tabular-nums">{value}</span>
        )}
        <button
          type="button"
          onClick={() => commit(Math.min(max, current + 1))}
          disabled={current >= max}
          aria-label="Padidinti"
          className={`flex size-11 items-center justify-center border transition-[color,border-color,scale] duration-150 ease-out-strong enabled:hover:border-rust enabled:hover:text-rust motion-safe:enabled:active:scale-90 disabled:opacity-30 ${controlBorder} ${compact ? "" : "text-ink"}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
