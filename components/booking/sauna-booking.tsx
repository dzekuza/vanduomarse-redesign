"use client";

import { useMemo, useState } from "react";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal } from "./booking-card";
import { Confirmation } from "./confirmation";
import { DayPicker } from "./day-picker";
import { DurationPicker } from "./duration-picker";
import { StartTimeGrid } from "./start-time-grid";
import { StepLabel } from "./step-label";
import { UpsellPicker } from "./upsell-picker";
import { Stepper } from "./stepper";
import {
  MAX_HOURS,
  LARGE_GROUP_RATE,
  MAX_PARTY,
  PACKAGE_PRICE,
  SMALL_GROUP_MAX,
  SMALL_GROUP_RATE,
  MIN_HOURS,
  bookingReference,
  dateKey,
  formatHour,
  hoursLabel,
  maxHoursFrom,
  sessionPrice,
} from "@/lib/sauna";
import { DEFAULT_UPSELLS, upsellMax, upsellSummary, upsellTotal } from "@/lib/sauna-upsells";

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
  /** Upsell id -> item count (counted extras) or 0/1 (on/off extras). */
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number } | null>(null);

  const dateK = dateKey(selectedDate);
  const maxHours = startHour === null ? 0 : maxHoursFrom(dateK, startHour);
  const basePrice = startHour === null ? 0 : sessionPrice(hours, partySize);
  const upsells = DEFAULT_UPSELLS;
  const extrasPrice = upsells.reduce((sum, u) => sum + upsellTotal(u, extras[u.id] ?? 0, { partySize, hours }), 0);
  const total = basePrice + extrasPrice;
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

  function changeParty(next: number) {
    setPartySize(next);
    // Counted extras can't exceed what the smaller group allows.
    setExtras((e) => Object.fromEntries(upsells.map((u) => [u.id, Math.min(e[u.id] ?? 0, u.unit === "vienetui" ? upsellMax(u, next) : 1)])));
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
        extras={upsellSummary(upsells, extras)}
        total={confirmed.total}
        onReset={() => {
          setConfirmed(null);
          setStartHour(null);
          setHours(MIN_HOURS);
          setExtras({});
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
        <StepLabel step={2}>Grupė</StepLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stepper label="Žmonių" value={partySize} onChange={changeParty} min={1} max={MAX_PARTY} />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          Iki {SMALL_GROUP_MAX} asm. – {SMALL_GROUP_RATE} €/val., {SMALL_GROUP_MAX + 1}–{MAX_PARTY} asm. – {LARGE_GROUP_RATE} €/val.
          Minimaliai 2 val., 4 val. paketas – {PACKAGE_PRICE} €.
        </p>
      </div>
      <div>
        <StepLabel step={3}>Pradžios laikas</StepLabel>
        <StartTimeGrid dateK={dateK} selected={startHour} onSelect={selectStart} />
      </div>
      {startHour !== null ? (
        <div>
          <StepLabel step={4}>Trukmė</StepLabel>
          <DurationPicker partySize={partySize} startHour={startHour} maxHours={maxHours} selected={hours} onSelect={setHours} />
          {maxHours < MAX_HOURS ? (
            <p className="mt-2 text-sm text-ink/60">
              Ilgiausiai iki {formatHour(startHour + maxHours)}: po to pirtis užimta arba uždaroma.
            </p>
          ) : null}
        </div>
      ) : null}
      <div>
        <StepLabel step={startHour === null ? 4 : 5}>Papildomai</StepLabel>
        <UpsellPicker upsells={upsells} quantities={extras} onChange={(id, qty) => setExtras((e) => ({ ...e, [id]: qty }))} partySize={partySize} hours={hours} />
      </div>
    </BookingCard>
  );
}
