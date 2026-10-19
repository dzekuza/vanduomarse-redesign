"use client";

import { useMemo, useState } from "react";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal } from "./booking-card";
import { Confirmation } from "./confirmation";
import { DayPicker } from "./day-picker";
import { DurationPicker } from "./duration-picker";
import { MasterPicker } from "./master-picker";
import { StartTimeGrid } from "./start-time-grid";
import { StepLabel } from "./step-label";
import { Stepper } from "./stepper";
import {
  MAX_HOURS,
  MASTER_RATE,
  MAX_PARTY,
  MIN_HOURS,
  VIHTA_PRICE,
  bookingReference,
  dateKey,
  formatHour,
  hoursLabel,
  maxHoursFrom,
  sessionPrice,
} from "@/lib/sauna";

function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function SaunaBooking() {
  const days = useMemo(() => nextDays(14), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [hours, setHours] = useState(MIN_HOURS);
  const [partySize, setPartySize] = useState(4);
  const [vihtas, setVihtas] = useState(0);
  const [withMaster, setWithMaster] = useState(false);
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number } | null>(null);

  const dateK = dateKey(selectedDate);
  const maxHours = startHour === null ? 0 : maxHoursFrom(dateK, startHour);
  const basePrice = startHour === null ? 0 : sessionPrice(selectedDate, startHour, hours);
  const masterPrice = withMaster && startHour !== null ? MASTER_RATE * hours : 0;
  const total = basePrice + masterPrice + vihtas * VIHTA_PRICE;
  const timeLabel = startHour === null ? "" : `${formatHour(startHour)}-${formatHour(startHour + hours)}`;

  function selectDate(date: Date) {
    setSelectedDate(date);
    setStartHour(null);
    setHours(MIN_HOURS);
  }

  function selectStart(hour: number) {
    setStartHour(hour);
    // Keep the chosen length if it still fits, otherwise shrink to what does.
    setHours((h) => Math.min(h, maxHoursFrom(dateK, hour)));
  }

  function confirm() {
    if (startHour === null) return;
    setConfirmed({ reference: bookingReference(dateK, startHour, hours, partySize), total });
  }

  if (confirmed && startHour !== null) {
    return (
      <Confirmation
        reference={confirmed.reference}
        date={selectedDate}
        time={`${timeLabel}, ${hoursLabel(hours)}`}
        startHour={startHour}
        hours={hours}
        partySize={partySize}
        vihtas={vihtas}
        withMaster={withMaster}
        total={confirmed.total}
        onReset={() => {
          setConfirmed(null);
          setStartHour(null);
          setHours(MIN_HOURS);
        }}
      />
    );
  }

  return (
    <BookingCard
      summary={
        <BookingTotal
          note={startHour === null ? "Pasirink pradžios laiką" : `${selectedDate.toLocaleDateString("lt-LT")}, ${timeLabel}`}
          total={total}
        />
      }
      action={
        <ArrowButton onClick={confirm} disabled={startHour === null}>
          Patvirtinti rezervaciją
        </ArrowButton>
      }
    >
      <div>
        <StepLabel step={1}>Pasirink dieną</StepLabel>
        <DayPicker days={days} selected={selectedDate} onSelect={selectDate} />
      </div>
      <div>
        <StepLabel step={2}>Pradžios laikas</StepLabel>
        <StartTimeGrid date={selectedDate} dateK={dateK} selected={startHour} onSelect={selectStart} />
      </div>
      {startHour !== null ? (
        <div>
          <StepLabel step={3}>Trukmė</StepLabel>
          <DurationPicker date={selectedDate} startHour={startHour} maxHours={maxHours} selected={hours} onSelect={setHours} />
          {maxHours < MAX_HOURS ? (
            <p className="mt-2 text-sm text-ink/60">
              Ilgiausiai iki {formatHour(startHour + maxHours)}: po to pirtis užimta arba uždaroma.
            </p>
          ) : null}
        </div>
      ) : null}
      <div>
        <StepLabel step={startHour === null ? 3 : 4}>Pirtininkas</StepLabel>
        <MasterPicker value={withMaster} onChange={setWithMaster} hours={startHour === null ? null : hours} />
      </div>
      <div>
        <StepLabel step={startHour === null ? 4 : 5}>Grupė</StepLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stepper label="Žmonių" value={partySize} onChange={setPartySize} min={1} max={MAX_PARTY} />
          <Stepper label={`Vantos (+${VIHTA_PRICE} € vnt.)`} value={vihtas} onChange={setVihtas} min={0} max={partySize} />
        </div>
      </div>
    </BookingCard>
  );
}
