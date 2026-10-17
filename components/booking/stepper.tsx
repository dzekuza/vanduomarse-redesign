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
    <div className="flex items-center justify-between border border-ink/15 px-4 py-3">
      <span className="text-sm text-ink/70">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Sumažinti"
          className="flex size-7 items-center justify-center border border-ink/30 text-ink transition-transform enabled:active:scale-90 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-4 text-center font-medium tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Padidinti"
          className="flex size-7 items-center justify-center border border-ink/30 text-ink transition-transform enabled:active:scale-90 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
