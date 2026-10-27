"use client";

import { useMemo, useState } from "react";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal } from "./booking-card";
import { Confirmation } from "./confirmation";
import { CouponField } from "./coupon-field";
import { DayPicker } from "./day-picker";
import { DurationPicker } from "./duration-picker";
import { StartTimeGrid } from "./start-time-grid";
import { StepLabel } from "./step-label";
import { UpsellPicker } from "./upsell-picker";
import { Stepper } from "./stepper";
import {
  bookingReference,
  dateKey,
  formatHour,
  hourRate,
  hoursLabel,
  maxHoursFrom,
  nextDays,
  sessionPrice,
  type SaunaRates,
} from "@/lib/sauna";
import { couponDiscount, type CheckedCoupon } from "@/lib/coupons";
import { upsellMax, upsellSummary, upsellTotal, type Upsell } from "@/lib/sauna-upsells";

interface SaunaBookingProps {
  /** Park date (yyyy-mm-dd) the day strip starts from. */
  today: string;
  days: number;
  rates: SaunaRates;
  upsells: Upsell[];
  /** yyyy-mm-dd -> booked or closed hours. */
  takenByDay: Record<string, number[]>;
}

export function SaunaBooking({ today, days: dayCount, rates, upsells, takenByDay }: SaunaBookingProps) {
  const days = useMemo(() => nextDays(today, dayCount), [today, dayCount]);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [hours, setHours] = useState(rates.minHours);
  const [partySize, setPartySize] = useState(4);
  /** Upsell id -> item count (counted extras) or 0/1 (on/off extras). */
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [coupon, setCoupon] = useState<CheckedCoupon | null>(null);
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number; coupon?: { code: string; discount: number } } | null>(null);

  const dateK = dateKey(selectedDate);
  const taken = takenByDay[dateK] ?? [];
  const maxHours = startHour === null ? 0 : maxHoursFrom(taken, startHour, rates);
  const basePrice = startHour === null ? 0 : sessionPrice(hours, partySize, rates);
  const extrasPrice = upsells.reduce((sum, u) => sum + upsellTotal(u, extras[u.id] ?? 0, { partySize, hours }), 0);
  const subtotal = basePrice + extrasPrice;
  const discount = couponDiscount(subtotal, coupon?.balance ?? 0);
  const total = subtotal - discount;
  const timeLabel = startHour === null ? "" : `${formatHour(startHour)}-${formatHour(startHour + hours)}`;

  function selectDate(date: Date) {
    setSelectedDate(date);
    setStartHour(null);
    setHours(rates.minHours);
  }

  function selectStart(hour: number) {
    setStartHour(hour);
    // Keep the chosen length if it still fits, otherwise shrink to what does.
    setHours((h) => Math.min(h, maxHoursFrom(taken, hour, rates)));
  }

  function changeParty(next: number) {
    setPartySize(next);
    // Counted extras can't exceed what the smaller group allows.
    setExtras((e) => Object.fromEntries(upsells.map((u) => [u.id, Math.min(e[u.id] ?? 0, u.unit === "vienetui" ? upsellMax(u, next) : 1)])));
  }

  function confirm() {
    if (startHour === null) return;
    setConfirmed({
      reference: bookingReference(dateK, startHour, hours, partySize),
      total,
      coupon: coupon && discount > 0 ? { code: coupon.code, discount } : undefined,
    });
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
        coupon={confirmed.coupon}
        onReset={() => {
          setConfirmed(null);
          setCoupon(null);
          setStartHour(null);
          setHours(rates.minHours);
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
          discount={discount}
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
          <Stepper label="Žmonių" value={partySize} onChange={changeParty} min={1} max={rates.maxParty} />
        </div>
        <p className="mt-2 text-sm text-ink">Jūsų grupei – {hourRate(partySize, rates)} €/val. už visą pirtį.</p>
        <p className="mt-1 text-sm text-ink/60">
          Kaina visai grupei, ne žmogui: iki {rates.smallGroupMax} asm. – {rates.smallGroupRate} €/val., {rates.smallGroupMax + 1}–
          {rates.maxParty} asm. – {rates.largeGroupRate} €/val. Minimaliai {rates.minHours} val., {rates.packageHours} val. paketas –{" "}
          {rates.packagePrice} €.
        </p>
      </div>
      <div>
        <StepLabel step={3}>Pradžios laikas</StepLabel>
        <StartTimeGrid taken={taken} rates={rates} selected={startHour} onSelect={selectStart} />
      </div>
      {startHour !== null ? (
        <div>
          <StepLabel step={4}>Trukmė</StepLabel>
          <DurationPicker rates={rates} partySize={partySize} startHour={startHour} maxHours={maxHours} selected={hours} onSelect={setHours} />
          {maxHours < rates.maxHours ? (
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
      <CouponField flow="pirtis" coupon={coupon} discount={discount} onChange={setCoupon} />
    </BookingCard>
  );
}
