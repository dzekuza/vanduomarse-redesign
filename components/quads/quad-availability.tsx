"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hourLabel } from "@/lib/quads";
import { cn } from "@/lib/utils";
import { QUAD_PREVIEW_MIN_UNITS } from "./quad-preview-content";
import type { QuadPreviewSlot } from "./quad-preview-plan";

export function QuadAvailabilityDot({ available }: { available: boolean }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full ring-1 ring-current/20", available ? "bg-status-confirmed" : "bg-rust")} />;
}

function timeLabel(hour: number, duration: number) {
  return `${hourLabel(hour)}–${hourLabel(hour + duration)}`;
}

export function QuadTimeField({ slots, duration, selected, onSelect }: {
  slots: QuadPreviewSlot[];
  duration: number;
  selected?: QuadPreviewSlot;
  onSelect: (slot: QuadPreviewSlot) => void;
}) {
  const timeId = useId();
  const disabled = slots.length === 0;

  return (
    <div className="space-y-2">
      <label htmlFor={timeId} data-disabled={disabled || undefined} className="flex items-center gap-2 text-sm font-bold data-disabled:opacity-50">
        <ClockIcon size={18} aria-hidden /> Laikas
      </label>
      <Select disabled={disabled} value={selected ? String(selected.hour) : ""} onValueChange={(value) => {
        const slot = slots.find(({ hour }) => String(hour) === value);
        if (slot && slot.free >= QUAD_PREVIEW_MIN_UNITS) onSelect(slot);
      }}>
        <SelectTrigger id={timeId} className="w-full min-w-0 rounded-none border-line bg-transparent">
          <SelectValue placeholder="Pasirink laiką">{selected ? timeLabel(selected.hour, duration) : null}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" className="rounded-none">
          {slots.map(({ hour, free }) => {
            const time = timeLabel(hour, duration);
            const available = free >= QUAD_PREVIEW_MIN_UNITS;
            const status = free === 0 ? "Užimta" : `Liko ${free}`;
            return (
              <SelectItem
                key={hour}
                value={String(hour)}
                disabled={!available}
                aria-label={`${time}. ${free === 0 ? "Užimta" : `Laisvų keturračių: ${free}`}${free > 0 && !available ? `. Turui reikia bent ${QUAD_PREVIEW_MIN_UNITS} keturračių` : ""}`}
                className="min-h-11 data-disabled:text-copy data-disabled:opacity-100 *:last:w-full"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{time}</span>
                  <span className="inline-flex shrink-0 items-center gap-2 text-xs">
                    <QuadAvailabilityDot available={available} />
                    {status}
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
