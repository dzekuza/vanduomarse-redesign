"use client";

import { Receipt } from "./receipt";
import { VENUE } from "@/lib/calendar";
import { ROOM_TYPES, type RoomTypeId } from "@/lib/cabin";
import { longDateLabel } from "@/lib/sauna";

interface CabinConfirmationProps {
  reference: string;
  checkIn: Date;
  nights: number;
  guests: number;
  roomId: RoomTypeId;
  total: number;
  onReset: () => void;
}

export function CabinConfirmation({ reference, checkIn, nights, guests, roomId, total, onReset }: CabinConfirmationProps) {
  const room = ROOM_TYPES.find((r) => r.id === roomId)!;
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);

  return (
    <Receipt
      title="Miegas Marse"
      reference={reference}
      rows={[
        { label: "Atvykimas", value: longDateLabel(checkIn) },
        { label: "Išvykimas", value: longDateLabel(checkOut) },
        { label: "Tipas", value: room.label },
        { label: "Svečiai", value: `${guests} žm.` },
      ]}
      total={total}
      calendar={{
        title: `Miegas Marse: ${room.label}`,
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
