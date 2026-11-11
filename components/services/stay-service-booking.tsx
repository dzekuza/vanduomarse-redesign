"use client";

import { HouseIcon } from "@phosphor-icons/react";
import { useState, type ComponentProps } from "react";
import { Stepper } from "@/components/booking/stepper";
import { FilterChip } from "@/components/events/filter-chip";
import { CABIN_SIZES, MAX_STAY_NIGHTS, MAX_STAY_UNITS, STAY_TYPES, roomLabel, roomPrice, type StayUnitType } from "@/lib/cabin";
import type { CabinPageData } from "@/lib/data/public-types";
import type { StayPick, StayPlan } from "@/lib/reservation";
import { longDateLabel } from "@/lib/sauna";
import { DateField } from "@/components/reservation/date-field";
import { stayDayDetails } from "@/components/reservation/stay-day-details";

interface StayServiceBookingProps {
  data: CabinPageData;
  days: Date[];
  date: Date | null;
  range: NonNullable<ComponentProps<typeof DateField>["range"]>;
  nights: number;
  draft?: StayPlan | null;
  busy: boolean;
  onDate: (date: Date) => void;
  onPick: (pick: StayPick) => void;
}

function unitChoice(type: StayUnitType): Pick<StayPick, "roomId" | "size"> {
  return type === "kemperis"
    ? { roomId: type, size: CABIN_SIZES[0].id }
    : { roomId: "namelis", size: type };
}

/** Choose the unit before its dates and quantity on the stay landing page. */
export function StayServiceBooking({ data, days, date, range, nights, draft, busy, onDate, onPick }: StayServiceBookingProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const type = draft?.roomId === "kemperis" ? draft.roomId : draft?.size;
  const max = draft && type !== undefined ? Math.min(draft.free(type), MAX_STAY_UNITS) : 0;
  const datesLabel = date && range.end ? `Nuo ${longDateLabel(date)} iki ${longDateLabel(range.end)}` : undefined;

  function chooseType(next: StayUnitType) {
    if (next !== type) onPick({ ...unitChoice(next), nights, units: 1 });
  }

  return (
    <div className="space-y-5">
      <fieldset disabled={busy} className="min-w-0">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><HouseIcon size={18} aria-hidden /> Tipas</legend>
        <div className="grid grid-cols-3 gap-2">
          {STAY_TYPES.map((choice) => {
            const { roomId, size } = unitChoice(choice);
            const active = choice === type;
            return (
              <FilterChip key={choice} active={active} onClick={() => chooseType(choice)} className="min-h-16 min-w-0 flex-col items-start justify-between gap-1 px-2 py-2 text-left leading-snug">
                <span className="wrap-anywhere font-bold">{roomLabel(roomId, size)}</span>
                <span><span className="whitespace-nowrap">{roomPrice(roomId, size)} €</span> / naktį</span>
              </FilterChip>
            );
          })}
        </div>
      </fieldset>
      {type === "kemperis" ? <p className="text-xs text-copy">Viena vieta vienai transporto priemonei, su elektra.</p> : null}
      <DateField
        date={date}
        days={days}
        range={range}
        selectionLabel={datesLabel}
        disabled={busy || type === undefined}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        onSelect={onDate}
        dayDetails={(day) => stayDayDetails(data.availability, day, type)}
        footer={range.selectingEnd ? <p className="text-xs text-copy">Jei nori likti ilgiau, pasirink išvykimo datą. Galima iki {MAX_STAY_NIGHTS} naktų.</p> : null}
      />
      {date && draft ? (
        <fieldset disabled={busy} className="min-w-0 space-y-3 border-t border-line pt-4">
          {max > 0 ? (
            <Stepper key={type} label="Kiekis" value={draft.units} min={1} max={max} onChange={(units) => {
              const { roomId, size } = draft;
              onPick({ roomId, size, nights, units: Math.min(units, max) });
            }} editable compact />
          ) : null}
          {!draft.ok ? <p role="status" className="text-xs text-rust-ink">Šioms naktims pasirinkto kiekio nebeliko. Pakeisk datas{max > 0 ? ", kiekį" : ""} arba tipą.</p> : null}
        </fieldset>
      ) : null}
    </div>
  );
}
