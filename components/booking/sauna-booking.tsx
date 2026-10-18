"use client";

import { useMemo, useState } from "react";
import { ArrowButton } from "./arrow-button";
import { Confirmation } from "./confirmation";
import { DayPicker } from "./day-picker";
import { SlotGrid } from "./slot-grid";
import { StepLabel } from "./step-label";
import { Stepper } from "./stepper";
import { MAX_PARTY, VIHTA_PRICE, bookingReference, dateKey, slotPrice, type SlotTime } from "@/lib/sauna";

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
  const [selectedTime, setSelectedTime] = useState<SlotTime | null>(null);
  const [partySize, setPartySize] = useState(4);
  const [vihtas, setVihtas] = useState(0);
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number } | null>(null);

  const dateK = dateKey(selectedDate);
  const basePrice = selectedTime ? slotPrice(selectedDate, selectedTime) : 0;
  const total = basePrice + vihtas * VIHTA_PRICE;

  function selectDate(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function confirm() {
    if (!selectedTime) return;
    setConfirmed({ reference: bookingReference(dateK, selectedTime, partySize), total });
  }

  if (confirmed && selectedTime) {
    return (
      <Confirmation
        reference={confirmed.reference}
        date={selectedDate}
        time={selectedTime}
        partySize={partySize}
        vihtas={vihtas}
        total={confirmed.total}
        onReset={() => {
          setConfirmed(null);
          setSelectedTime(null);
        }}
      />
    );
  }

  return (
    <div className="border border-ink bg-foam">
      <div className="space-y-8 px-6 py-8 sm:px-8">
        <div>
          <StepLabel step={1}>Pasirink dieną</StepLabel>
          <DayPicker days={days} selected={selectedDate} onSelect={selectDate} />
        </div>
        <div>
          <StepLabel step={2}>Pasirink laiką, 90 min seansas</StepLabel>
          <SlotGrid date={selectedDate} dateK={dateK} selected={selectedTime} onSelect={setSelectedTime} />
        </div>
        <div>
          <StepLabel step={3}>Grupė</StepLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stepper label="Žmonių" value={partySize} onChange={setPartySize} min={1} max={MAX_PARTY} />
            <Stepper label={`Vantos (+${VIHTA_PRICE} € vnt.)`} value={vihtas} onChange={setVihtas} min={0} max={partySize} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink bg-dust-soft px-6 py-5 sm:px-8">
        <div>
          <p className="text-sm text-ink/60">{selectedTime ? `${selectedDate.toLocaleDateString("lt-LT")}, ${selectedTime}` : "Pasirink laiką"}</p>
          <p className="font-display text-2xl font-bold">{total} €</p>
        </div>
        <ArrowButton onClick={confirm} disabled={!selectedTime}>Patvirtinti rezervaciją</ArrowButton>
      </div>
    </div>
  );
}
