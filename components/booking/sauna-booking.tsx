"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createSaunaBooking } from "@/app/actions/requests";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal, type BookingStep } from "./booking-card";
import { ContactStep } from "./contact-step";
import { Confirmation } from "./confirmation";
import { CouponField } from "./coupon-field";
import { DayPicker } from "./day-picker";
import { DurationPicker } from "./duration-picker";
import { StartTimeGrid } from "./start-time-grid";
import { StepLabel } from "./step-label";
import { UpsellPicker } from "./upsell-picker";
import { Stepper } from "./stepper";
import {
  dateKey,
  formatHour,
  guestSurcharge,
  hoursLabel,
  isOpenStart,
  isWeekendDay,
  maxHoursFrom,
  minHoursFor,
  nextDays,
  pastHourOn,
  sessionLengths,
  sessionPrice,
  startHours,
  type Sauna,
} from "@/lib/sauna";
import { couponDiscount, type CheckedCoupon } from "@/lib/coupons";
import { contactSchema, type ContactInput } from "@/lib/request-schema";
import { upsellMax, upsellSummary, upsellTotal, type Upsell } from "@/lib/sauna-upsells";

interface SaunaBookingProps {
  /** Park date (yyyy-mm-dd) the day strip starts from. */
  today: string;
  /** Park hour (0-23) from the server; today's starts at or before it are gone. */
  nowHour: number;
  days: number;
  sauna: Sauna;
  /** The extras this sauna offers. */
  upsells: Upsell[];
  /** yyyy-mm-dd -> this sauna's booked or closed hours. */
  takenByDay: Record<string, number[]>;
  /** Number of the first step here (2 when a sauna picker comes before it). */
  firstStep?: number;
  /** Rendered as the first step inside the card (the sauna picker). */
  lead?: React.ReactNode;
}

/** Day, group, start, length, extras and contact for one sauna; remount (key) when the sauna changes. */
export function SaunaBooking({ today, nowHour, days: dayCount, sauna, upsells, takenByDay, firstStep = 1, lead }: SaunaBookingProps) {
  const rates = sauna.rates;
  const days = useMemo(() => nextDays(today, dayCount), [today, dayCount]);
  /** A day is bookable when at least one start has not passed and fits the minimum session. */
  const hasOpenStart = (d: Date) => {
    const k = dateKey(d);
    const min = minHoursFor(rates, k);
    return startHours(rates, min).some((h) => isOpenStart(takenByDay[k] ?? [], h, rates, pastHourOn(k, today, nowHour), min));
  };
  const allStartsPassed = (d: Date) => startHours(rates, minHoursFor(rates, dateKey(d))).every((h) => h <= pastHourOn(dateKey(d), today, nowHour));
  // Late in the day today has nothing left: open on the first day that does.
  const [selectedDate, setSelectedDate] = useState(() => days.find(hasOpenStart) ?? days[0]);
  const [startHour, setStartHour] = useState<number | null>(null);
  /** The length the guest asked for; the shown length is the nearest one that is on offer and fits. */
  const [wantedHours, setWantedHours] = useState(0);
  const [partySize, setPartySize] = useState(() => Math.min(4, rates.maxParty));
  /** Upsell id -> item count (counted extras) or 0/1 (on/off extras). */
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [coupon, setCoupon] = useState<CheckedCoupon | null>(null);
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number; coupon?: { code: string; discount: number } } | null>(null);

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "" },
  });

  const dateK = dateKey(selectedDate);
  const taken = takenByDay[dateK] ?? [];
  const pastHour = pastHourOn(dateK, today, nowHour);
  const maxHours = startHour === null ? 0 : maxHoursFrom(taken, startHour, rates);
  /** Some extras (the sauna master) set a minimum session. */
  const extrasMin = Math.max(0, ...upsells.filter((u) => (extras[u.id] ?? 0) > 0).map((u) => u.minHours ?? 0));
  const minHours = minHoursFor(rates, dateK, extrasMin);
  const lengths = sessionLengths(rates, dateK, extrasMin);
  const fitting = lengths.filter((h) => h <= maxHours);
  const hours = startHour === null ? minHours : (fitting.find((h) => h >= wantedHours) ?? fitting[fitting.length - 1] ?? minHours);
  const basePrice = startHour === null ? 0 : sessionPrice(hours, partySize, rates, dateK);
  const surcharge = guestSurcharge(partySize, rates);
  /** Adding the sauna master can leave too little time after the chosen start. */
  const startFits = startHour === null || (hours > 0 && hours <= maxHours);
  const extrasPrice = upsells.reduce((sum, u) => sum + upsellTotal(u, extras[u.id] ?? 0, { partySize, hours }), 0);
  const subtotal = basePrice + extrasPrice;
  const discount = couponDiscount(subtotal, coupon?.balance ?? 0);
  const total = subtotal - discount;
  /** Steps shift by one once the duration step appears. */
  const extrasStep = firstStep + (startHour === null ? 3 : 4);
  const timeLabel = startHour === null ? "" : `${formatHour(startHour)}-${formatHour(startHour + hours)}`;

  function selectDate(date: Date) {
    setSelectedDate(date);
    setStartHour(null);
  }

  function selectStart(hour: number) {
    setStartHour(hour);
  }

  function changeParty(next: number) {
    setPartySize(next);
    // Counted extras can't exceed what the smaller group allows.
    setExtras((e) => Object.fromEntries(upsells.map((u) => [u.id, Math.min(e[u.id] ?? 0, u.unit === "vienetui" ? upsellMax(u, next) : 1)])));
  }

  /** Stored as a pending request: the database re-prices it and re-checks the slot. */
  const submit = form.handleSubmit(async (contact) => {
    if (startHour === null) return;
    const result = await createSaunaBooking({
      saunaId: sauna.id,
      date: dateK,
      startHour,
      hours,
      party: partySize,
      extras: Object.fromEntries(Object.entries(extras).filter(([, qty]) => qty > 0)),
      coupon: coupon?.code,
      ...contact,
    });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    const { reference, total: charged, discount: applied } = result.data;
    setConfirmed({ reference, total: charged, coupon: coupon && applied > 0 ? { code: coupon.code, discount: applied } : undefined });
  });

  if (confirmed && startHour !== null) {
    return (
      <Confirmation
        reference={confirmed.reference}
        date={selectedDate}
        title={sauna.name}
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
          setWantedHours(0);
          setExtras({});
          form.reset();
        }}
      />
    );
  }

  const steps: BookingStep[] = [
    {
      id: "day",
      label: lead ? "Pirtis ir diena" : "Diena",
      content: (
        <>
          {lead}
          <div>
            <StepLabel step={firstStep}>Pasirink dieną</StepLabel>
            <DayPicker
              days={days}
              selected={selectedDate}
              onSelect={selectDate}
              note={(d) => (hasOpenStart(d) ? undefined : { text: allStartsPassed(d) ? "Uždaryta" : "Užimta", disabled: true })}
            />
          </div>
        </>
      ),
    },
    {
      id: "party",
      label: "Grupė",
      content: (
        <div>
          <StepLabel step={firstStep + 1}>Grupė</StepLabel>
          <div className="grid gap-3 @xl:grid-cols-2">
            <Stepper label="Žmonių" value={partySize} onChange={changeParty} min={1} max={rates.maxParty} />
          </div>
          <p className="mt-2 text-sm text-ink">
            {surcharge > 0
              ? `Jūsų grupei: +${surcharge} € už ${partySize - rates.includedGuests} asm. virš ${rates.includedGuests}.`
              : `Kaina visai pirčiai, galioja iki ${rates.includedGuests} asm.`}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            Kiekvienas svečias virš {rates.includedGuests} asm. – +{rates.extraGuestFee} €. Daugiausia {rates.maxParty} asm.
          </p>
        </div>
      ),
    },
    {
      id: "time",
      label: "Laikas",
      ready: startHour !== null,
      content: (
        <>
          <div>
            <StepLabel step={firstStep + 2}>Pradžios laikas</StepLabel>
            <StartTimeGrid taken={taken} rates={rates} pastHour={pastHour} minHours={minHours} selected={startHour} onSelect={selectStart} />
            <p className="mt-2 text-sm text-ink/60">
              {isWeekendDay(dateK) ? `Penktadienį–sekmadienį trumpiausias seansas – ${minHours} val. ` : ""}
              {extrasMin > 0 ? `Su pirtininku – mažiausiai ${extrasMin} val. ` : ""}
              {rates.turnaroundHours > 0 ? `Tarp seansų paliekame ${rates.turnaroundHours} val. pirčiai paruošti.` : ""}
            </p>
          </div>
          {startHour !== null ? (
            <div>
              <StepLabel step={firstStep + 3}>Trukmė</StepLabel>
              <DurationPicker lengths={lengths} price={(h) => sessionPrice(h, partySize, rates, dateK)} startHour={startHour} maxHours={maxHours} selected={hours} onSelect={setWantedHours} />
              {!startFits ? (
                <p className="mt-2 text-sm text-rust">Su pasirinktais priedais šiam laikui trūksta laiko: pasirinkite ankstesnę pradžią.</p>
              ) : maxHours < (lengths[lengths.length - 1] ?? 0) ? (
                <p className="mt-2 text-sm text-ink/60">Ilgiausiai iki {formatHour(startHour + maxHours)}: po to pirtis užimta arba uždaroma.</p>
              ) : null}
            </div>
          ) : null}
        </>
      ),
    },
    ...(upsells.length
      ? [
          {
            id: "extras",
            label: "Papildomai",
            content: (
              <div>
                <StepLabel step={extrasStep}>Papildomai</StepLabel>
                <UpsellPicker upsells={upsells} quantities={extras} onChange={(id, qty) => setExtras((e) => ({ ...e, [id]: qty }))} partySize={partySize} hours={hours} />
              </div>
            ),
          },
        ]
      : []),
    {
      id: "contact",
      label: "Kontaktai",
      content: (
        <>
          <CouponField flow="pirtis" coupon={coupon} discount={discount} onChange={setCoupon} />
          <ContactStep step={upsells.length ? extrasStep + 1 : extrasStep} idPrefix="sauna" />
        </>
      ),
    },
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate>
        <BookingCard
          steps={steps}
          summary={
            <BookingTotal
              note={startHour === null ? "Pasirink pradžios laiką" : `${selectedDate.toLocaleDateString("lt-LT")}, ${timeLabel}`}
              total={total}
              discount={discount}
            />
          }
          action={
            <ArrowButton type="submit" disabled={startHour === null || !startFits || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Siunčiama..." : "Siųsti rezervaciją"}
            </ArrowButton>
          }
        />
      </form>
    </FormProvider>
  );
}
