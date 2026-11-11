"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createStayBooking } from "@/app/actions/requests";
import { ArrowButton } from "./arrow-button";
import { BookingCard, BookingTotal, type BookingStep } from "./booking-card";
import { CabinConfirmation } from "./cabin-confirmation";
import { ContactStep } from "./contact-step";
import { CabinSizePicker } from "./cabin-size-picker";
import { CouponField } from "./coupon-field";
import { DayPicker, type DayNote } from "./day-picker";
import { RoomTypePicker } from "./room-type-picker";
import { StepLabel } from "./step-label";
import { Stepper } from "./stepper";
import { freeStayUnits, freeStayUnitsOfKind, stayTypesOf, type StayKind, type StayType } from "@/lib/cabin";
import { couponDiscount, type CheckedCoupon } from "@/lib/coupons";
import type { CabinPageData } from "@/lib/data/public-types";
import { contactSchema, type ContactInput } from "@/lib/request-schema";
import { dateKey, nextDays } from "@/lib/sauna";

export function CabinBooking({ data, days: dayCount }: { data: CabinPageData; days: number }) {
  const { availability, stayTypes } = data;
  const days = useMemo(() => nextDays(data.today, dayCount), [data.today, dayCount]);
  const [nights, setNights] = useState(2);
  const [checkIn, setCheckIn] = useState(() => days.find((d) => freeStayUnitsOfKind(stayTypes, availability, d, 2, "namelis") > 0) ?? days[0]);
  const [guests, setGuests] = useState(2);
  const [kind, setKind] = useState<StayKind>(() => (stayTypesOf(stayTypes, "namelis").length > 0 ? "namelis" : "kemperis"));
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<CheckedCoupon | null>(null);
  const [confirmed, setConfirmed] = useState<{ reference: string; total: number; coupon?: { code: string; discount: number } } | null>(null);

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { customerName: "", customerPhone: "", customerEmail: "", website: "" },
  });

  const cabin = kind === "namelis";
  const ofKind = stayTypesOf(stayTypes, kind);
  const free = (type: StayType) => freeStayUnits(availability, checkIn, nights, type);
  // Fall back to another type of the kind when the preferred one is booked out for this stay.
  const preferred = ofKind.find((t) => t.id === preferredId) ?? ofKind[0];
  const type: StayType | undefined = preferred && free(preferred) > 0 ? preferred : (ofKind.find((t) => free(t) > 0) ?? preferred);
  const soldOut = !type || free(type) === 0;
  const maxGuests = type?.maxGuests ?? 1;
  const shownGuests = Math.min(guests, maxGuests);
  const subtotal = (type?.pricePerNight ?? 0) * nights;
  const discount = couponDiscount(subtotal, coupon?.balance ?? 0);
  const total = subtotal - discount;

  function dayNote(d: Date): DayNote | undefined {
    if (!cabin) return undefined;
    const left = freeStayUnitsOfKind(stayTypes, availability, d, nights, "namelis");
    return { text: left > 0 ? `liko ${left}` : "Užimta", disabled: left === 0 };
  }

  /** Stored as a pending request: the database prices it and re-checks the free cabins. */
  const submit = form.handleSubmit(async (contact) => {
    if (!type) return;
    const result = await createStayBooking({
      stayTypeId: type.id,
      date: dateKey(checkIn),
      nights,
      guests: shownGuests,
      coupon: coupon?.code,
      ...contact,
    });
    if ("error" in result) return form.setError("root", { message: result.error.message });
    const { reference, total: charged, discount: applied } = result.data;
    setConfirmed({ reference, total: charged, coupon: coupon && applied > 0 ? { code: coupon.code, discount: applied } : undefined });
  });

  if (confirmed) {
    return (
      <CabinConfirmation
        reference={confirmed.reference}
        checkIn={checkIn}
        nights={nights}
        guests={shownGuests}
        label={type?.label ?? "Nakvynė"}
        total={confirmed.total}
        coupon={confirmed.coupon}
        onReset={() => {
          setConfirmed(null);
          setCoupon(null);
          form.reset();
        }}
      />
    );
  }

  const steps: BookingStep[] = [
    {
      id: "day",
      label: "Atvykimo diena",
      content: (
        <div>
          <StepLabel step={1}>Atvykimo diena</StepLabel>
          <DayPicker days={days} selected={checkIn} onSelect={setCheckIn} note={dayNote} />
        </div>
      ),
    },
    {
      id: "type",
      label: "Tipas",
      ready: !soldOut,
      content: (
        <div>
          <StepLabel step={2}>Tipas</StepLabel>
          <div className="grid gap-2">
            <RoomTypePicker types={stayTypes} selected={kind} onSelect={setKind} />
            {ofKind.length > 1 && type ? <CabinSizePicker types={ofKind} selected={type.id} onSelect={setPreferredId} free={free} legend={cabin ? "Namelio tipas" : "Aikštelės tipas"} /> : null}
          </div>
        </div>
      ),
    },
    {
      id: "stay",
      label: "Trukmė ir svečiai",
      ready: !soldOut,
      content: (
        <div>
          <StepLabel step={3}>Trukmė ir svečiai</StepLabel>
          <div className="grid gap-3 @xl:grid-cols-2">
            <Stepper label="Naktys" value={nights} onChange={setNights} min={1} max={14} />
            <Stepper label="Svečių" value={shownGuests} onChange={setGuests} min={1} max={maxGuests} />
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      label: "Kontaktai",
      content: (
        <>
          <CouponField flow="miegas" coupon={coupon} discount={discount} onChange={setCoupon} />
          <ContactStep step={4} idPrefix="cabin" />
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
              note={`${nights} ${nights === 1 ? "naktis" : "naktys"}, nuo ${checkIn.toLocaleDateString("lt-LT")}`}
              total={total}
              discount={discount}
            />
          }
          action={
            <ArrowButton type="submit" disabled={soldOut || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Siunčiama..." : "Siųsti rezervaciją"}
            </ArrowButton>
          }
        />
      </form>
    </FormProvider>
  );
}
