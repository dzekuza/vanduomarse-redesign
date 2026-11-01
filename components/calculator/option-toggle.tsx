"use client";

import { CheckIcon } from "@phosphor-icons/react";

interface OptionToggleProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

/** Full-width on/off row for an add-on, with its price hint. */
export function OptionToggle({ label, hint, checked, onChange }: OptionToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex min-h-15 w-full items-center justify-between gap-4 border px-4 py-2 text-left transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-99 ${
        checked ? "border-ink bg-ink text-foam" : "border-ink text-ink hover:border-rust"
      }`}
    >
      <span>
        <span className="block text-sm leading-snug">{label}</span>
        <span className={`block text-xs ${checked ? "text-foam/70" : "text-ink/60"}`}>{hint}</span>
      </span>
      <span className={`flex size-5 shrink-0 items-center justify-center border ${checked ? "border-foam" : "border-ink"}`}>
        {checked ? <CheckIcon size={14} weight="bold" /> : null}
      </span>
    </button>
  );
}
