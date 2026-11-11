"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { TimeSelectContent, TimeSelectOption } from "@/components/booking/time-select";
import { AvailabilityCount } from "@/components/services/availability-count";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hourLabel } from "@/lib/quads";
import { cn } from "@/lib/utils";
import { QUAD_PREVIEW_MIN_UNITS } from "./quad-preview-content";
import type { QuadPreviewSlot } from "./quad-preview-plan";

export function QuadAvailabilityDot({ available }: { available: boolean }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full ring-1 ring-current/20", available ? "bg-status-confirmed" : "bg-rust")} />;
}

export function quadTimeLabel(hour: number, duration: number) {
  return `${hourLabel(hour)}–${hourLabel(hour + duration)}`;
}

export function QuadTimeAvailability({ free }: { free: number }) {
  if (free === 0) return <span className="font-bold text-rust-ink!">Pilna</span>;
  return (
    <span>
      Laisvų keturračių · <AvailabilityCount free={free} />
      {free < QUAD_PREVIEW_MIN_UNITS ? ` · Reikia bent ${QUAD_PREVIEW_MIN_UNITS}` : null}
    </span>
  );
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
          <SelectValue placeholder="Pasirink laiką">{selected ? quadTimeLabel(selected.hour, duration) : null}</SelectValue>
        </SelectTrigger>
        <TimeSelectContent>
          {slots.map(({ hour, free }) => (
            <TimeSelectOption
              key={hour}
              value={String(hour)}
              time={quadTimeLabel(hour, duration)}
              disabled={free < QUAD_PREVIEW_MIN_UNITS}
              status={<QuadTimeAvailability free={free} />}
            />
          ))}
        </TimeSelectContent>
      </Select>
    </div>
  );
}
