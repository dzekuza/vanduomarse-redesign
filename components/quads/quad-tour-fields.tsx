"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { useId } from "react";
import { CompactStepper } from "@/components/booking/stepper";
import { TimeSelectContent, TimeSelectOption } from "@/components/booking/time-select";
import { AvailabilityCount } from "@/components/services/availability-count";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuadPageData } from "@/lib/data/public-types";
import { hourLabel, type QuadTourRoute } from "@/lib/quads";
import { QuadAccessories } from "./quad-accessories";
import { quadTourAccessories, quadTourStarts, type QuadTourPick } from "./quad-tour-plan";

const timeLabel = (route: QuadTourRoute, hour: number) => `${hourLabel(hour)}-${hourLabel(hour + route.hours)}`;

interface QuadTourFieldsProps {
  data: QuadPageData;
  /** The chosen route, or null before a choice. */
  route: QuadTourRoute | null;
  /** The chosen day (yyyy-mm-dd), or null before a choice. */
  day: string | null;
  /** Hours the visitor's sauna booking already holds. */
  busy: readonly number[];
  pick: QuadTourPick | null;
  onChange: (pick: QuadTourPick | null) => void;
}

/** Start time (any hour the fleet is free for the whole route), quads and gear of the chosen route and day. The tour is in the plan as soon as a start is chosen, and follows every change. */
export function QuadTourFields({ data, route, day, busy, pick, onChange }: QuadTourFieldsProps) {
  const id = useId();
  const starts = route && day ? quadTourStarts(data, day, route, busy) : [];
  const current = route && pick?.routeId === route.id && starts.some(({ hour }) => hour === pick.startHour) ? pick : null;
  const slot = starts.find(({ hour }) => hour === current?.startHour);
  const disabled = !route || !day || starts.length === 0;

  function start(hour: number) {
    const next = starts.find((entry) => entry.hour === hour);
    if (!route || !next) return;
    const units = Math.min(Math.max(current?.units ?? route.minUnits, route.minUnits), next.free);
    onChange({ routeId: route.id, startHour: hour, units, accessories: current?.accessories });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor={id} data-disabled={disabled || undefined} className="flex items-center gap-2 text-sm font-bold data-disabled:opacity-50"><ClockIcon size={18} aria-hidden /> Laikas</label>
        <Select value={current ? String(current.startHour) : ""} disabled={disabled} onValueChange={(value) => start(Number(value))}>
          <SelectTrigger id={id} className="w-full rounded-none border-line bg-transparent"><SelectValue placeholder="Pasirink laiką">{route && current ? timeLabel(route, current.startHour) : undefined}</SelectValue></SelectTrigger>
          <TimeSelectContent>
            {route ? starts.map(({ hour, free }) => (
              <TimeSelectOption key={hour} value={String(hour)} time={timeLabel(route, hour)} status={<span>Laisvų keturračių · <AvailabilityCount free={free} /></span>} />
            )) : null}
          </TimeSelectContent>
        </Select>
        {route && day && starts.length === 0 ? <p role="status" className="text-xs text-copy">Šią dieną turų nėra. Pasirink kitą datą.</p> : null}
      </div>
      {route && current && slot ? (
        <>
          <div className="space-y-2">
            <CompactStepper label={`Kiekis: ${route.name}`} value={current.units} min={route.minUnits} max={slot.free} onChange={(units) => onChange({ ...current, units })} editable />
            <p className="text-xs text-copy">Bent {route.minUnits} keturračiai.</p>
          </div>
          <QuadAccessories catalogue={data.tourAccessories} title={`${route.name} turas`} selected={false} quantities={current.accessories ?? {}} onChange={(accessories) => onChange({ ...current, accessories })} />
          {quadTourAccessories(data.tourAccessories, current.accessories).ok ? null : <p role="status" className="text-xs text-rust">Patikslink įrangos kiekį.</p>}
        </>
      ) : null}
    </div>
  );
}
