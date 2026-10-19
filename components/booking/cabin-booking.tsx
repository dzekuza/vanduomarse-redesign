"use client";

import { useMemo, useState } from "react";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal } from "./booking-card";
import { CabinConfirmation } from "./cabin-confirmation";
import { CabinSizePicker } from "./cabin-size-picker";
import { DayPicker, type DayNote } from "./day-picker";
import { RoomTypePicker } from "./room-type-picker";
import { StepLabel } from "./step-label";
import { Stepper } from "./stepper";
import {
  CABIN_SIZES,
  CAMPER_MAX_GUESTS,
  cabinReference,
  freeCabins,
  roomPrice,
  type CabinSize,
  type RoomTypeId,
} from "@/lib/cabin";
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

/** Cabins of any size free for every night of the stay. */
function freeAll(checkIn: Date, nights: number): number {
  return CABIN_SIZES.reduce((sum, s) => sum + freeCabins(checkIn, nights, s.id), 0);
}

export function CabinBooking() {
  const days = useMemo(() => nextDays(21), []);
  const [nights, setNights] = useState(2);
  const [checkIn, setCheckIn] = useState(() => days.find((d) => freeAll(d, 2) > 0) ?? days[0]);
  const [guests, setGuests] = useState(2);
  const [roomId, setRoomId] = useState<RoomTypeId>("namelis");
  const [preferredSize, setPreferredSize] = useState<CabinSize>(2);
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number } | null>(null);

  const cabin = roomId === "namelis";
  const free = (size: CabinSize) => freeCabins(checkIn, nights, size);
  // Fall back to the other size when the preferred one is booked out for this stay.
  const size = free(preferredSize) > 0 ? preferredSize : (CABIN_SIZES.find((s) => free(s.id) > 0)?.id ?? preferredSize);
  const soldOut = cabin && free(size) === 0;
  const maxGuests = cabin ? size : CAMPER_MAX_GUESTS;
  const shownGuests = Math.min(guests, maxGuests);
  const total = roomPrice(roomId, size) * nights;

  function dayNote(d: Date): DayNote | undefined {
    if (!cabin) return undefined;
    const left = freeAll(d, nights);
    return { text: left > 0 ? `liko ${left}` : "Užimta", disabled: left === 0 };
  }

  function confirm() {
    const ref = cabin ? `${roomId}${size}` : roomId;
    setConfirmed({ reference: cabinReference(dateKey(checkIn), ref, nights), total });
  }

  if (confirmed) {
    return (
      <CabinConfirmation
        reference={confirmed.reference}
        checkIn={checkIn}
        nights={nights}
        guests={shownGuests}
        roomId={roomId}
        size={size}
        total={confirmed.total}
        onReset={() => setConfirmed(null)}
      />
    );
  }

  return (
    <BookingCard
      summary={
        <BookingTotal
          note={`${nights} ${nights === 1 ? "naktis" : "naktys"}, nuo ${checkIn.toLocaleDateString("lt-LT")}`}
          total={total}
        />
      }
      action={
        <ArrowButton onClick={confirm} disabled={soldOut}>
          Patvirtinti rezervaciją
        </ArrowButton>
      }
    >
      <div>
        <StepLabel step={1}>Atvykimo diena</StepLabel>
        <DayPicker days={days} selected={checkIn} onSelect={setCheckIn} note={dayNote} />
      </div>
      <div>
        <StepLabel step={2}>Tipas</StepLabel>
        <div className="grid gap-2">
          <RoomTypePicker selected={roomId} onSelect={setRoomId} />
          {cabin && <CabinSizePicker selected={size} onSelect={setPreferredSize} free={free} />}
        </div>
      </div>
      <div>
        <StepLabel step={3}>Trukmė ir svečiai</StepLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stepper label="Naktys" value={nights} onChange={setNights} min={1} max={14} />
          <Stepper label="Svečių" value={shownGuests} onChange={setGuests} min={1} max={maxGuests} />
        </div>
      </div>
    </BookingCard>
  );
}
