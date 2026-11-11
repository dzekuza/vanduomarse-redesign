import { useId } from "react";
import type { SaunaHireTariff } from "@/lib/sauna-hire";

interface SaunaGuestSliderProps {
  value: number;
  max: number;
  tariff: SaunaHireTariff;
  disabled: boolean;
  onChange: (guests: number) => void;
}

export function SaunaGuestSlider({ value, max, tariff, disabled, onChange }: SaunaGuestSliderProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="border border-line bg-dust/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-bold">Asmenų skaičius</label>
        <output htmlFor={id} aria-live="off" className="bg-ink px-3 py-1 text-sm font-bold text-dust tabular-nums">
          {value} asm.
        </output>
      </div>
      <input id={id} type="range" min={1} max={max} step={1} value={value} disabled={disabled}
        aria-describedby={hintId} aria-valuetext={`${value} asm.`}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="block h-11 w-full cursor-pointer accent-ink disabled:cursor-not-allowed"
      />
      <div aria-hidden className="flex justify-between text-xs text-copy tabular-nums">
        <span>1 asm.</span><span>{max} asm.</span>
      </div>
      <p id={hintId} className="mt-3 border-t border-line pt-2 text-xs text-copy">
        Į kainą įskaičiuota iki {tariff.includedGuests} asm. Papildomas svečias +{tariff.extraGuestPrice} €.
      </p>
    </div>
  );
}
