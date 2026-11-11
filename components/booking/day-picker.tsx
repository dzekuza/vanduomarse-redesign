"use client";

import type { ComponentType } from "react";
import { DateField } from "@/components/reservation/date-field";

/** Optional third line under the day number, e.g. free cabins. */
export interface DayNote {
  text: string;
  disabled?: boolean;
}

/** A small status icon under the day number, e.g. "sauna free that day". */
export interface DayIcon {
  Icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  /** Screen-reader text, e.g. "Pirtis laisva". */
  label: string;
  on: boolean;
}

export function DayPicker({
  days,
  selected,
  onSelect,
  note,
  icons,
}: {
  days: Date[];
  selected: Date;
  onSelect: (date: Date) => void;
  note?: (date: Date) => DayNote | undefined;
  icons?: (date: Date) => DayIcon[];
}) {
  return (
    <DateField
      days={days}
      date={selected}
      onSelect={onSelect}
      icons={icons}
      dayDetails={note ? (date) => {
        const info = note(date);
        return info && {
          label: info.text,
          available: !info.disabled,
          disabled: info.disabled,
          indicator: <span className="block text-micro leading-tight tracking-normal wrap-anywhere">{info.text}</span>,
        };
      } : undefined}
    />
  );
}
