"use client";

import { Receipt } from "./receipt";
import { VENUE } from "@/lib/calendar";
import { longDateLabel } from "@/lib/sauna";

interface CabinConfirmationProps {
  reference: string;
  checkIn: Date;
  nights: number;
  guests: number;
  /** Name of the booked stay type. */
  label: string;
  total: number;
  coupon?: { code: string; discount: number };
  onReset: () => void;
}

export function CabinConfirmation({ reference, checkIn, nights, guests, label, total, coupon, onReset }: CabinConfirmationProps) {
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);

  return (
    <Receipt
      title="Miegas Marse"
      reference={reference}
      rows={[
        { label: "Atvykimas", value: longDateLabel(checkIn) },
        { label: "Išvykimas", value: longDateLabel(checkOut) },
        { label: "Tipas", value: label },
        { label: "Svečiai", value: `${guests} žm.` },
      ]}
      total={total}
      coupon={coupon}
      calendar={{
        title: `Miegas Marse: ${label}`,
        start: checkIn,
        end: checkOut,
        details: `Rezervacija ${reference}. Svečiai: ${guests} žm.`,
        location: VENUE,
        allDay: true,
      }}
      resetLabel="Rezervuoti kitą nakvynę"
      onReset={onReset}
    />
  );
}
