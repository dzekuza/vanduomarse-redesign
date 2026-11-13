"use client";

import type { ReactNode } from "react";
import { FormField } from "../form-field";
import type { DayOptions } from "@/lib/admin/booking-options";
import { formatEur } from "@/lib/admin/format";
import type { ManagedEvent } from "@/lib/admin/types";
import type { StayType } from "@/lib/cabin";
import type { QuadTourRoute, QuadType } from "@/lib/quads";
import type { Sauna } from "@/lib/sauna";
import { todayKey } from "@/lib/sauna";
import { DatePicker } from "@/components/ui/date-picker";

interface BookingChooserProps {
  date: string;
  onDateChange: (date: string) => void;
  options: DayOptions;
  /** Staff who may add tickets (Renginiai or Keturračiai); others do not see events at all. */
  canTickets: boolean;
  /** The tours and fleet when staff may take quad bookings (Keturračiai), else null. */
  quads: { routes: readonly QuadTourRoute[]; types: readonly QuadType[] } | null;
  onPickTour: (route: QuadTourRoute) => void;
  onPickRental: () => void;
  onPickEvent: (event: ManagedEvent) => void;
  onPickSauna: (sauna: Sauna) => void;
  onPickStay: (type: StayType) => void;
}

function Choice({ title, detail, meta, disabled, onPick }: { title: string; detail: string; meta: string; disabled?: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className="flex min-h-14 w-full flex-col justify-center rounded-lg border border-border px-3 py-2 text-left transition-colors hover:border-primary hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="truncate text-sm font-bold">{title}</span>
      <span className="truncate text-xs text-muted-foreground">{detail}</span>
      <span className="text-xs tabular-nums">{meta}</span>
    </button>
  );
}

function Section({ title, empty, children }: { title: string; empty?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {empty ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="grid gap-2 sm:grid-cols-2">{children}</div>}
    </section>
  );
}

const placesLabel = (left: number | null) => (left === null ? "Be limito" : left === 0 ? "Vietų nėra" : `Liko vietų: ${left}`);

/**
 * First step of a staff booking: a date, then what can be booked that day. Nothing is preselected, so a reservation
 * is only ever made for something staff chose: an event or session, a cabin or camper type, or a private sauna.
 */
export function BookingChooser({ date, onDateChange, options, canTickets, quads, onPickTour, onPickRental, onPickEvent, onPickSauna, onPickStay }: BookingChooserProps) {
  return (
    <div className="space-y-5">
      <FormField id="nb-choose-date" label="Data">
        <DatePicker id="nb-choose-date" value={date} onChange={onDateChange} min={todayKey()} />
      </FormField>

      {canTickets ? (
        <Section title="Renginiai ir pirties seansai" empty={options.events.length === 0 ? "Šią dieną renginių ir pirties seansų nėra." : undefined}>
          {options.events.map(({ event, left }) => (
            <Choice
              key={event.id}
              title={event.title}
              detail={[event.category === "pirtis" ? "Pirties seansas" : null, event.time, event.place].filter(Boolean).join(" · ")}
              meta={`${placesLabel(left)} · ${event.price === null ? "Nemokamai" : `${formatEur(event.price)} / asm.`}`}
              disabled={left === 0}
              onPick={() => onPickEvent(event)}
            />
          ))}
        </Section>
      ) : null}

      <Section title="Apgyvendinimas" empty={options.stays.length === 0 ? "Apgyvendinimo tipų nėra." : undefined}>
        {options.stays.map(({ type, free }) => (
          <Choice
            key={type.id}
            title={type.label}
            detail={`Iki ${type.maxGuests} žm. · ${formatEur(type.pricePerNight)} / naktį`}
            meta={free === null ? "Be limito" : free === 0 ? "Visi užimti" : `Laisvų: ${free}`}
            disabled={free === 0}
            onPick={() => onPickStay(type)}
          />
        ))}
      </Section>

      {quads ? (
        <Section title="Keturračiai">
          {quads.routes.map((route) => (
            <Choice
              key={route.id}
              title={`${route.name} turas`}
              detail={`${route.kilometres} km · ${route.durationLabel}`}
              meta={`Nuo ${route.minUnits} keturračių · ${formatEur(route.price)} / keturratį`}
              onPick={() => onPickTour(route)}
            />
          ))}
          <Choice
            title="Nuoma valandomis"
            detail={quads.types.filter((t) => t.active).map((t) => t.name).join(", ") || "Keturračiai"}
            meta={quads.types.some((t) => t.active) ? `Nuo ${formatEur(Math.min(...quads.types.filter((t) => t.active).map((t) => t.pricePerHour)))} / val.` : "Tipų nėra"}
            onPick={onPickRental}
          />
        </Section>
      ) : null}

      <Section title="Privati pirtis" empty={options.saunas.length === 0 ? "Aktyvių pirčių nėra." : undefined}>
        {options.saunas.map(({ sauna, freeStarts }) => (
          <Choice
            key={sauna.id}
            title={sauna.name}
            detail={sauna.features[0] ?? "Privati pirtis"}
            meta={freeStarts === 0 ? "Laisvų laikų nėra" : `Laisvų pradžios laikų: ${freeStarts}`}
            disabled={freeStarts === 0}
            onPick={() => onPickSauna(sauna)}
          />
        ))}
      </Section>
    </div>
  );
}
