"use client";

export function Stepper({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border border-ink py-2 pl-4 pr-2">
      <span className="text-sm text-ink/70">{label}</span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Sumažinti"
          className="flex size-11 items-center justify-center border border-ink text-ink transition-[color,border-color,transform] enabled:hover:border-rust enabled:hover:text-rust enabled:active:scale-90 disabled:opacity-30"
        >
          −
        </button>
        <span className="min-w-8 text-center font-medium tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Padidinti"
          className="flex size-11 items-center justify-center border border-ink text-ink transition-[color,border-color,transform] enabled:hover:border-rust enabled:hover:text-rust enabled:active:scale-90 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
