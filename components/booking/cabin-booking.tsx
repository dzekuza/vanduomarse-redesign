"use client";

import { useMemo, useState } from "react";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal } from "./booking-card";
import { CabinConfirmation } from "./cabin-confirmation";
import { CabinSizePicker } from "./cabin-size-picker";
import { CouponField } from "./coupon-field";
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
  type CabinAvailability,
  type CabinSize,
  type RoomTypeId,
} from "@/lib/cabin";
import { couponDiscount, type CheckedCoupon } from "@/lib/coupons";
import type { CabinPageData } from "@/lib/data/public-types";
import { dateKey, nextDays } from "@/lib/sauna";

/** Cabins of any size free for every night of the stay. */
function freeAll(availability: CabinAvailability, checkIn: Date, nights: number): number {
  return CABIN_SIZES.reduce((sum, s) => sum + freeCabins(availability, checkIn, nights, s.id), 0);
}

export function CabinBooking({ data, days: dayCount }: { data: CabinPageData; days: number }) {
  const { availability } = data;
  const days = useMemo(() => nextDays(data.today, dayCount), [data.today, dayCount]);
  const [nights, setNights] = useState(2);
  const [checkIn, setCheckIn] = useState(() => days.find((d) => freeAll(availability, d, 2) > 0) ?? days[0]);
  const [guests, setGuests] = useState(2);
  const [roomId, setRoomId] = useState<RoomTypeId>("namelis");
  const [preferredSize, setPreferredSize] = useState<CabinSize>(2);
  const [coupon, setCoupon] = useState<CheckedCoupon | null>(null);
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number; coupon?: { code: string; discount: number } } | null>(null);

  const cabin = roomId === "namelis";
  const free = (size: CabinSize) => freeCabins(availability, checkIn, nights, size);
  // Fall back to the other size when the preferred one is booked out for this stay.
  const size = free(preferredSize) > 0 ? preferredSize : (CABIN_SIZES.find((s) => free(s.id) > 0)?.id ?? preferredSize);
  const soldOut = cabin && free(size) === 0;
  const maxGuests = cabin ? size : CAMPER_MAX_GUESTS;
  const shownGuests = Math.min(guests, maxGuests);
  const subtotal = roomPrice(roomId, size) * nights;
  const discount = couponDiscount(subtotal, coupon?.balance ?? 0);
  const total = subtotal - discount;

  function dayNote(d: Date): DayNote | undefined {
    if (!cabin) return undefined;
    const left = freeAll(availability, d, nights);
    return { text: left > 0 ? `liko ${left}` : "Užimta", disabled: left === 0 };
  }

  function confirm() {
    const ref = cabin ? `${roomId}${size}` : roomId;
    setConfirmed({
      reference: cabinReference(dateKey(checkIn), ref, nights),
      total,
      coupon: coupon && discount > 0 ? { code: coupon.code, discount } : undefined,
    });
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
        coupon={confirmed.coupon}
        onReset={() => {
          setConfirmed(null);
          setCoupon(null);
        }}
      />
    );
  }

  return (
    <BookingCard
      summary={
        <BookingTotal
          note={`${nights} ${nights === 1 ? "naktis" : "naktys"}, nuo ${checkIn.toLocaleDateString("lt-LT")}`}
          total={total}
          discount={discount}
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
      <CouponField flow="miegas" coupon={coupon} discount={discount} onChange={setCoupon} />
    </BookingCard>
  );
}
