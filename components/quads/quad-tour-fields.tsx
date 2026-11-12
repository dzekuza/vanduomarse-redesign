"use client";

import { CompactStepper } from "@/components/booking/stepper";
import { StartTimePicker } from "@/components/reservation/start-time-picker";
import type { QuadPageData } from "@/lib/data/public-types";
import { hourLabel, type QuadTourRoute } from "@/lib/quads";
import { QuadAccessories } from "./quad-accessories";
import { quadTourAccessories, quadTourStarts, type QuadTourPick } from "./quad-tour-plan";

interface QuadTourFieldsProps {
  data: QuadPageData;
  route: QuadTourRoute;
  day: string;
  /** Hours the visitor's sauna booking already holds. */
  busyHours: readonly number[];
  busy: boolean;
  pick: QuadTourPick | null;
  onChange: (pick: QuadTourPick | null) => void;
}

/** Start time (any hour the fleet is free for the whole route), quads and gear of the chosen route and day. The tour is in the plan as soon as a start is chosen, and follows every change. */
export function QuadTourFields({ data, route, day, busyHours, busy, pick, onChange }: QuadTourFieldsProps) {
  const starts = quadTourStarts(data, day, route, busyHours);
  const current = pick?.routeId === route.id && starts.some(({ hour }) => hour === pick.startHour) ? pick : null;
  const slot = starts.find(({ hour }) => hour === current?.startHour);

  function start(hour: number) {
    const next = starts.find((entry) => entry.hour === hour);
    if (!next) return;
    const units = Math.min(Math.max(current?.units ?? route.minUnits, route.minUnits), next.free);
    onChange({ routeId: route.id, startHour: hour, units, accessories: current?.accessories });
  }

  return (
    <div className="space-y-5">
      <StartTimePicker
        hours={starts.map(({ hour }) => hour)}
        selected={current?.startHour ?? null}
        busy={busy}
        describeHour={(hour) => {
          const start = starts.find((entry) => entry.hour === hour);
          return start && `iki ${hourLabel(hour + route.hours)}, laisvų keturračių: ${start.free}`;
        }}
        onSelect={start}
      />
      {current && slot ? (
        <>
          <div className="space-y-2">
            <CompactStepper label={`Kiekis: ${route.name}`} value={current.units} min={route.minUnits} max={slot.free} onChange={(units) => onChange({ ...current, units })} editable />
            <p className="text-xs text-copy">Bent {route.minUnits} keturračiai. Laisvų keturračių: {slot.free}.</p>
          </div>
          <QuadAccessories catalogue={data.tourAccessories} title={`${route.name} turas`} selected={false} quantities={current.accessories ?? {}} onChange={(accessories) => onChange({ ...current, accessories })} />
          {quadTourAccessories(data.tourAccessories, current.accessories).ok ? null : <p role="status" className="text-xs text-rust">Patikslink įrangos kiekį.</p>}
        </>
      ) : null}
    </div>
  );
}
