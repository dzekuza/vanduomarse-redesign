"use client";

import { Receipt } from "./receipt";
import { VENUE, at } from "@/lib/calendar";
import { longDateLabel } from "@/lib/sauna";

interface ConfirmationProps {
  reference: string;
  date: Date;
  time: string;
  startHour: number;
  hours: number;
  partySize: number;
  /** Chosen extras, e.g. ["Pirtininkas", "Beržinė vanta × 3"]. */
  extras: string[];
  total: number;
  onReset: () => void;
}

export function Confirmation({ reference, date, time, startHour, hours, partySize, extras, total, onReset }: ConfirmationProps) {
  return (
    <Receipt
      title="Pirtis Marse"
      reference={reference}
      rows={[
        { label: "Data", value: longDateLabel(date) },
        { label: "Laikas", value: time },
        { label: "Grupė", value: `${partySize} žm.` },
        { label: "Papildomai", value: extras.length ? extras.join(", ") : "-" },
      ]}
      total={total}
      calendar={{
        title: "Pirtis Marse",
        start: at(date, startHour),
        end: at(date, startHour + hours),
        details: `Rezervacija ${reference}. Grupė: ${partySize} žm.${extras.length ? ` Papildomai: ${extras.join(", ")}.` : ""}`,
        location: VENUE,
      }}
      resetLabel="Rezervuoti kitą seansą"
      onReset={onReset}
    />
  );
}
