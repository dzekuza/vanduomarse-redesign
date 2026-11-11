import { WavesIcon } from "@phosphor-icons/react";
import { FilterChip } from "@/components/events/filter-chip";

const ACTIVITIES = [
  { id: "session", label: "Pirties seansai" },
  { id: "private", label: "Privati pirtis" },
  { id: "nakvyne", label: "Nakvynė" },
  { id: "keturraciai", label: "Keturračiai" },
  { id: "wake", label: "Wake" },
] as const;

export type ReservationTab = (typeof ACTIVITIES)[number]["id"];

interface ActivityTabsProps {
  active: ReservationTab;
  included: ReservationTab[];
  disabled: boolean;
  onChange: (id: ReservationTab) => void;
}

export function ActivityTabs({ active, included, disabled, onChange }: ActivityTabsProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><WavesIcon size={18} aria-hidden /> Tipas</legend>
      <div className="flex flex-wrap gap-2">
        {ACTIVITIES.map(({ id, label }) => (
          <FilterChip key={id} active={id === active} onClick={() => onChange(id)} className="justify-center px-3 text-center font-bold">
            {label}
            {included.includes(id) ? <span aria-label="Įtraukta į planą" className="size-2 shrink-0 rounded-full bg-rust" /> : null}
          </FilterChip>
        ))}
      </div>
    </fieldset>
  );
}
