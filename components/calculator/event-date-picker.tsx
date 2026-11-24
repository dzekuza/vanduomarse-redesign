"use client";

import { useMemo, useState } from "react";
import type { ReservationDayDetails } from "@/components/reservation/day-cell";
import { DateField } from "@/components/reservation/date-field";
import { MAX_STAY_NIGHTS } from "@/lib/cabin";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { dateKey, longDateLabel, nextDays } from "@/lib/sauna";

interface EventDatePickerProps {
  today: string;
  /** Arrival (event start) as yyyy-mm-dd. */
  value: string | null;
  /** Departure as yyyy-mm-dd; null for a single-day event. */
  end: string | null;
  onChange: (date: string) => void;
  onEnd: (date: string | null) => void;
  alwaysOpen?: boolean;
  /** Cabin mark for a stay starting `arrival` for `nights` nights; the calendar passes the nights to the departure under the pointer. */
  stayDetails?: (arrival: Date, nights: number) => ReservationDayDetails | undefined;
}

const nightsBetween = (from: Date, to: Date) => Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86_400_000);

/**
 * The same arrival and departure calendar as the stay booking: the first day opens the range, a later day closes it,
 * and one tap is enough for a single-day event. Days stay selectable whatever the cabins say (cabins are optional).
 */
export function EventDatePicker({ today, value, end, onChange, onEnd, alwaysOpen, stayDetails }: EventDatePickerProps) {
  const days = useMemo(() => nextDays(today, RESERVATION_DAYS), [today]);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const arrival = value ? nextDays(value, 1)[0] : null;
  const departure = end ? nextDays(end, 1)[0] : null;
  const lastEnd = arrival ? nextDays(dateKey(arrival), MAX_STAY_NIGHTS + 1)[MAX_STAY_NIGHTS] : days[days.length - 1];

  return (
    <DateField
      label="Renginio data"
      days={days}
      date={arrival}
      range={{ end: departure, selectingEnd, lastEnd }}
      open={alwaysOpen ? true : undefined}
      selectionLabel={arrival ? (departure ? `${longDateLabel(arrival)} – ${longDateLabel(departure)}` : longDateLabel(arrival)) : undefined}
      allowFutureDates
      onSelect={(next) => {
        if (arrival && selectingEnd && next > arrival) {
          onEnd(dateKey(next));
          setSelectingEnd(false);
        } else {
          onChange(dateKey(next));
          setSelectingEnd(true);
        }
      }}
      onClear={() => {
        onChange("");
        setSelectingEnd(false);
      }}
      dayDetails={stayDetails ? (candidate) => {
        const closing = Boolean(arrival && selectingEnd && candidate > arrival);
        return stayDetails(closing ? arrival! : candidate, closing ? nightsBetween(arrival!, candidate) : 1);
      } : undefined}
      footer={arrival ? (
        <div className="space-y-1 text-xs text-copy">
          <p>{selectingEnd ? `Kelių dienų renginiui pasirink pabaigos datą (iki ${MAX_STAY_NIGHTS} naktų).` : departure ? "Pasirinktos datos. Pakeisk pradžią arba pabaigą paspausdamas kitą dieną." : "Vienos dienos renginiui pakanka vienos datos."}</p>
          {departure ? <button type="button" onClick={() => { onEnd(null); setSelectingEnd(false); }} className="min-h-11 text-left font-bold underline underline-offset-4">Tik viena diena</button> : null}
        </div>
      ) : undefined}
    />
  );
}
