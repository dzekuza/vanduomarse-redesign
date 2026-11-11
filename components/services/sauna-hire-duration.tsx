import { ClockIcon } from "@phosphor-icons/react";
import { FilterChip } from "@/components/events/filter-chip";
import { HIRE_DURATIONS, hireBasePrice, type HireDuration, type SaunaHireTariff } from "@/lib/sauna-hire";

interface SaunaHireDurationProps {
  tariff: SaunaHireTariff;
  value: HireDuration;
  day: string | null;
  hosted: boolean;
  disabled: boolean;
  onChange: (duration: HireDuration) => void;
}

export function SaunaHireDuration({ tariff, value, day, hosted, disabled, onChange }: SaunaHireDurationProps) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
        <ClockIcon size={18} aria-hidden /> Trukmė
      </legend>
      <div className="grid grid-cols-4 gap-1">
        {HIRE_DURATIONS.map(({ id, label }) => (
          <FilterChip key={id} active={id === value} disabled={hosted && id === "2"}
            className="min-w-0 flex-col justify-center gap-1 px-1 py-2 text-center disabled:opacity-50"
            onClick={() => onChange(id)}>
            <span className="font-bold">{label}</span>
            {day ? <span>{hireBasePrice(tariff, id, day)} €</span> : null}
          </FilterChip>
        ))}
      </div>
      <p aria-live="polite" aria-atomic="true" className="text-sm">
        Bazinė kaina {day
          ? <strong>{hireBasePrice(tariff, value, day)} €</strong>
          : <><strong>{tariff.weekday[value]} €</strong> I–IV · <strong>{tariff.weekend[value]} €</strong> V–VII</>}
      </p>
    </fieldset>
  );
}
