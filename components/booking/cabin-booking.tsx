"use client";

import { useMemo, useState } from "react";
import { CabinConfirmation } from "./cabin-confirmation";
import { DayPicker } from "./day-picker";
import { RoomTypePicker } from "./room-type-picker";
import { Stepper } from "./stepper";
import { cabinReference, roomPrice, type RoomTypeId } from "@/lib/cabin";
import { dateKey } from "@/lib/sauna";

function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function CabinBooking() {
  const days = useMemo(() => nextDays(21), []);
  const [checkIn, setCheckIn] = useState(days[0]);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const [roomId, setRoomId] = useState<RoomTypeId>("namelis");
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number } | null>(null);

  const total = roomPrice(roomId) * nights;

  function confirm() {
    setConfirmed({ reference: cabinReference(dateKey(checkIn), roomId, nights), total });
  }

  if (confirmed) {
    return (
      <CabinConfirmation
        reference={confirmed.reference}
        checkIn={checkIn}
        nights={nights}
        guests={guests}
        roomId={roomId}
        total={confirmed.total}
        onReset={() => setConfirmed(null)}
      />
    );
  }

  return (
    <div className="border border-ink">
      <div className="space-y-8 px-6 py-8 sm:px-8">
        <div>
          <p className="mb-3 text-sm font-medium text-ink/60">1. Atvykimo diena</p>
          <DayPicker days={days} selected={checkIn} onSelect={setCheckIn} />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-ink/60">2. Tipas</p>
          <RoomTypePicker selected={roomId} onSelect={setRoomId} />
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-ink/60">3. Trukmė ir svečiai</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stepper label="Naktys" value={nights} onChange={setNights} min={1} max={14} />
            <Stepper label="Svečių" value={guests} onChange={setGuests} min={1} max={6} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 bg-dust-soft px-6 py-5 sm:px-8">
        <div>
          <p className="text-sm text-ink/60">
            {nights} {nights === 1 ? "naktis" : "naktys"}, nuo {checkIn.toLocaleDateString("lt-LT")}
          </p>
          <p className="font-display text-2xl font-bold">{total} €</p>
        </div>
        <button
          type="button"
          onClick={confirm}
          className="border border-ink bg-ink px-6 py-3 text-sm font-medium text-foam transition-[color,background-color,border-color,transform] active:scale-[0.97] hover:bg-rust hover:border-rust"
        >
          Patvirtinti rezervaciją
        </button>
      </div>
    </div>
  );
}
