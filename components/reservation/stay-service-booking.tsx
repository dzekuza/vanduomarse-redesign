"use client";

import { HouseIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { FilterChip } from "@/components/events/filter-chip";
import type { CabinPageData } from "@/lib/data/public-types";
import { formatEuro } from "@/lib/coupons";
import { freeStayUnits, MAX_STAY_NIGHTS } from "@/lib/cabin";
import type { StayPick, StayPlan } from "@/lib/reservation";
import { dateKey, longDateLabel, nextDays } from "@/lib/sauna";
import { DateField } from "./date-field";
import { stayAvailabilityDetails } from "./stay-day-details";
import type { StayDatePhase } from "./when-step";

interface StayServiceBookingProps {
  data: CabinPageData;
  days: Date[];
  date: Date;
  end: Date | null;
  phase: StayDatePhase;
  plan: StayPlan | null | undefined;
  busy: boolean;
  onDate: (date: Date) => void;
  onPick: (pick: StayPick) => void;
  onClear: () => void;
}

export function StayServiceBooking({ data, days, date, end, phase, plan, busy, onDate, onPick, onClear }: StayServiceBookingProps) {
  const [typeId, setTypeId] = useState<string>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const type = data.stayTypes.find(({ id }) => id === typeId);
  const arrival = phase === "idle" ? null : date;
  const stayDates = nextDays(dateKey(date), MAX_STAY_NIGHTS + 1);
  const selectingEnd = phase === "selectingEnd";

  function selectType(nextId: string) {
    if (busy || nextId === typeId) return;
    setTypeId(nextId);
    setCalendarOpen(true);
    const nextType = data.stayTypes.find(({ id }) => id === nextId);
    if (plan && nextType) {
      const free = freeStayUnits(data.availability, date, plan.nights, nextType);
      onPick({ typeId: nextId, nights: plan.nights, units: Math.max(1, Math.min(plan.units, free)) });
    }
  }

  if (data.stayTypes.length === 0) {
    return <p className="text-sm text-copy">Šiuo metu nakvynės internetu rezervuoti negalima.</p>;
  }

  return (
    <>
      <fieldset disabled={busy} className="min-w-0">
        <legend className="mb-2 flex items-center gap-2 text-sm font-bold"><HouseIcon size={18} aria-hidden /> Tipas</legend>
        <div className="grid grid-cols-3 gap-2">
          {data.stayTypes.map(({ id, label, pricePerNight }) => (
            <FilterChip key={id} active={id === typeId} onClick={() => selectType(id)} className="min-w-0 flex-col items-start justify-center gap-1 px-2 py-2 text-left leading-tight">
              <span className="font-bold wrap-anywhere">{label}</span>
              <span>{formatEuro(pricePerNight)} / naktį</span>
            </FilterChip>
          ))}
        </div>
      </fieldset>
      <DateField
        days={days}
        date={arrival}
        range={{ end, selectingEnd, lastEnd: stayDates[MAX_STAY_NIGHTS] }}
        selectionLabel={arrival && end ? `${longDateLabel(arrival)} – ${longDateLabel(end)}` : undefined}
        disabled={!type || busy}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        onSelect={(next) => {
          if (!type || busy) return;
          if (!selectingEnd || next <= date) {
            const free = freeStayUnits(data.availability, next, 1, type);
            if (free < 1) return;
            onPick({ typeId: type.id, nights: 1, units: Math.min(plan?.units ?? 1, free) });
          }
          onDate(next);
        }}
        dayDetails={type ? (candidate) => {
          const departure = selectingEnd && candidate > date;
          const nights = departure ? stayDates.findIndex((day) => dateKey(day) === dateKey(candidate)) : 1;
          if (nights < 1) return undefined;
          const free = freeStayUnits(data.availability, departure ? date : candidate, nights, type);
          const available = free >= (departure ? plan?.units ?? 1 : 1);
          return { ...stayAvailabilityDetails(type.label, free, type.units ?? undefined), available, disabled: !available };
        } : undefined}
        footer={selectingEnd ? (
          <div className="space-y-1 text-xs text-copy">
            <p>Pasirink išvykimo datą. Galima iki {MAX_STAY_NIGHTS} naktų.</p>
            <button type="button" onClick={onClear} className="min-h-11 text-left font-bold underline underline-offset-4">Keisti atvykimo datą</button>
          </div>
        ) : undefined}
      />
      {plan && !plan.ok ? (
        <p role="status" className="text-xs text-rust-ink">Šioms datoms vietų nepakanka. Pasirink kitas datas arba kitą tipą.</p>
      ) : null}
    </>
  );
}
