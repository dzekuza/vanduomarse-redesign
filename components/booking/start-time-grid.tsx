"use client";

import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSelectContent, TimeSelectOption } from "./time-select";
import { formatHour, hoursLabel, isOpenStart, maxHoursFrom, startHours, type SaunaRates } from "@/lib/sauna";

interface StartTimeGridProps {
  /** Booked or closed hours on the chosen day. */
  taken: readonly number[];
  rates: SaunaRates;
  /** Starts at or before this hour are already gone (today); -1 on later days. */
  pastHour: number;
  /** Shortest session that day (with the chosen extras): a start needs that much free time after it. */
  minHours: number;
  selected: number | null;
  onSelect: (hour: number) => void;
}

/** Hourly start times; a start is open only if it has not passed and the minimum session fits after it. */
export function StartTimeGrid({ taken, rates, pastHour, minHours, selected, onSelect }: StartTimeGridProps) {
  return (
    <Select value={selected === null ? "" : String(selected)} onValueChange={(value) => onSelect(Number(value))}>
      <SelectTrigger aria-label="Pradžios laikas" className="w-full rounded-none border-line bg-transparent">
        <SelectValue placeholder="Pasirink laiką">{selected === null ? null : formatHour(selected)}</SelectValue>
      </SelectTrigger>
      <TimeSelectContent>
        {startHours(rates, minHours).map((hour) => {
          const past = hour <= pastHour;
          const open = isOpenStart(taken, hour, rates, pastHour, minHours);
          return (
            <TimeSelectOption
              key={hour}
              value={String(hour)}
              time={formatHour(hour)}
              disabled={!open}
              status={past ? "Praėjo" : open ? (
                <span className="font-bold text-availability-open!">Laisva · iki {hoursLabel(maxHoursFrom(taken, hour, rates))}</span>
              ) : <span className="font-bold text-rust-ink!">Užimta</span>}
            />
          );
        })}
      </TimeSelectContent>
    </Select>
  );
}
