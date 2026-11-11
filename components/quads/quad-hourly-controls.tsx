"use client";

import { ClockIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { CompactStepper } from "@/components/booking/stepper";
import { ACTIVITY_ICON } from "@/components/reservation/activity-icons";
import { DateField } from "@/components/reservation/date-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuadPageData } from "@/lib/data/public-types";
import { freeAt, hourLabel } from "@/lib/quads";
import { planQuads, type QuadPick } from "@/lib/reservation";
import { dateKey, pastHourOn } from "@/lib/sauna";

interface QuadHourlyControlsProps {
  data: QuadPageData;
  days: Date[];
  date: Date | null;
  /** The hourly rental in the plan; null until at least one quad is chosen. */
  pick: QuadPick | null;
  busy: boolean;
  onDate: (date: Date) => void;
  onPick: (pick: QuadPick | null) => void;
}

/** Start hours at which the whole chosen fleet is free for the whole duration. */
function hourlyStarts(data: QuadPageData, day: string, pick: QuadPick): number[] {
  const starts: number[] = [];
  for (let hour = data.settings.openHour; hour < data.settings.closeHour; hour++) {
    const plan = planQuads({ ...pick, startHour: hour }, data, day);
    if (plan.ok && plan.maxHours >= pick.hours) starts.push(hour);
  }
  return starts;
}

/** Any quad free at some bookable hour of the day, to light the calendar mark. */
function dayHasQuads(data: QuadPageData, day: string): boolean {
  const { settings, types, taken, today, nowHour } = data;
  const first = Math.max(settings.openHour, pastHourOn(day, today, nowHour) + 1);
  for (let hour = first; hour < settings.closeHour; hour++) {
    if (types.some((type) => freeAt(type, taken, day, hour) > 0)) return true;
  }
  return false;
}

/** Hourly rental from the fleet (the admin's Parkas): quads per type, duration, day and start. Prices are the type rows. */
export function QuadHourlyControls({ data, days, date, pick, busy, onDate, onPick }: QuadHourlyControlsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { types, settings } = data;
  const quantities = pick?.quantities ?? {};
  const hours = pick?.hours ?? 1;
  const day = date ? dateKey(date) : null;
  const chosen = pick !== null;
  const starts = day && pick ? hourlyStarts(data, day, pick) : [];

  function setQuantity(id: string, units: number) {
    const next = { ...quantities, [id]: units };
    // A rental with no quads is no rental: take it out of the plan instead of pricing nothing.
    if (!Object.values(next).some((value) => value > 0)) onPick(null);
    else onPick({ quantities: next, startHour: pick?.startHour ?? null, hours });
  }

  return (
    <div className="space-y-5">
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          {(() => { const Icon = ACTIVITY_ICON.keturraciai; return <Icon size={18} aria-hidden />; })()} Keturračiai
        </legend>
        {types.map((type) => (
          <CompactStepper
            key={type.id}
            label={`${type.name} (${type.pricePerHour} € / val.)`}
            value={quantities[type.id] ?? 0}
            min={0}
            max={type.units}
            onChange={(units) => setQuantity(type.id, units)}
            editable
          />
        ))}
      </fieldset>
      {chosen ? (
        <div className="space-y-2">
          <label htmlFor="quad-hours" className="flex items-center gap-2 text-sm font-bold">
            <ClockIcon size={18} aria-hidden /> Trukmė
          </label>
          <Select value={String(hours)} disabled={busy} onValueChange={(value) => onPick({ quantities, startHour: null, hours: Number(value) })}>
            <SelectTrigger id="quad-hours" className="w-full min-w-0 rounded-none border-line bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-none">
              {Array.from({ length: settings.maxHours }, (_, index) => index + 1).map((value) => (
                <SelectItem key={value} value={String(value)} className="min-h-11">{value} val.</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <DateField
        date={date}
        days={days}
        disabled={busy || !chosen}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        onSelect={onDate}
        icons={(d) => {
          const available = dayHasQuads(data, dateKey(d));
          return [{ Icon: ACTIVITY_ICON.keturraciai, on: available, label: available ? "Yra laisvų laikų" : "Laisvų laikų nėra" }];
        }}
      />
      {chosen && day ? (
        <div className="space-y-2">
          <label htmlFor="quad-start" className="flex items-center gap-2 text-sm font-bold">
            <ClockIcon size={18} aria-hidden /> Laikas
          </label>
          <Select
            disabled={busy || starts.length === 0}
            value={pick.startHour !== null && starts.includes(pick.startHour) ? String(pick.startHour) : ""}
            onValueChange={(value) => onPick({ ...pick, startHour: Number(value) })}
          >
            <SelectTrigger id="quad-start" className="w-full min-w-0 rounded-none border-line bg-transparent">
              <SelectValue placeholder="Pasirink laiką" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-none">
              {starts.map((hour) => (
                <SelectItem key={hour} value={String(hour)} className="min-h-11">{hourLabel(hour)}–{hourLabel(hour + hours)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {starts.length === 0 ? <p role="status" className="text-xs text-copy">Šiai dienai tokios nuomos laikų nėra. Pasirink kitą datą ar mažiau keturračių.</p> : null}
        </div>
      ) : null}
    </div>
  );
}
