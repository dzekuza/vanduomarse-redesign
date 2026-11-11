import { InfoIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { StepperControls } from "@/components/booking/stepper";
import { FilterChip } from "@/components/events/filter-chip";
import { SessionInfoLink } from "@/components/reservation/session-info-link";
import type { SessionRow } from "@/lib/reservation";
import { cn } from "@/lib/utils";
import { AvailabilityCount } from "./availability-count";

interface SaunaServiceSessionsProps {
  rows: SessionRow[];
  selectedKey?: string;
  /** Seat stepper, shown inside the selected card. */
  quantity?: { value: number; max: number; onChange: (value: number) => void };
  familyControls?: ReactNode;
  busy: boolean;
  onSelect: (row: SessionRow) => void;
}

/** The chosen day's sessions as cards; the selected one turns dark and holds its rate, info link and seat count. */
export function SaunaServiceSessions({ rows, selectedKey, quantity, familyControls, busy, onSelect }: SaunaServiceSessionsProps) {
  if (!rows.length) return <p role="status" className="text-sm text-copy">Šią dieną seansų nėra. Pasirink kitą datą.</p>;

  return (
    <fieldset disabled={busy} className="min-w-0">
      <legend className="mb-2 text-sm font-bold">Seansai</legend>
      <div className="grid gap-2">
        {rows.map((row) => {
          const active = row.key === selectedKey;
          return (
            <div key={row.key} className={cn("min-w-0 border", active ? "border-ink bg-ink text-dust" : "border-line")}>
              <FilterChip active={active} disabled={row.blocked} onClick={() => onSelect(row)}
                className={cn("w-full min-w-0 flex-col items-start gap-1 border-0 px-3 py-2 text-left",
                  active && "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-dust",
                  row.blocked && !active && "text-copy")}>
                <span className="min-w-0 font-bold wrap-anywhere">{row.title}</span>
                <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="tabular-nums">{row.time}</span>
                  <span className="font-bold">{row.rate}</span>
                </span>
              </FilterChip>
              {active && quantity && row.eventId ? (
                <div className="space-y-2 border-t border-line-on-ink px-3 py-1 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-dust [&_input:focus-visible]:border-dust [&_input:focus-visible]:ring-dust">
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <div className="flex items-center gap-1">
                      <p className="inline-flex flex-wrap gap-1 text-xs text-dust/80">
                        Laisvos vietos <AvailabilityCount free={row.maxPeople} capacity={row.capacity} binary onInk />
                      </p>
                      <SessionInfoLink id={row.eventId} className="grid size-11 shrink-0 place-items-center text-dust/80 hover:text-dust focus-visible:outline-2 focus-visible:outline-dust">
                        <InfoIcon size={18} aria-hidden />
                        <span className="sr-only">Daugiau informacijos apie seansą</span>
                      </SessionInfoLink>
                    </div>
                    <StepperControls label="Vietų skaičius" min={1} max={quantity.max} value={quantity.value} onChange={quantity.onChange} editable tone="current" />
                  </div>
                  {familyControls}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
