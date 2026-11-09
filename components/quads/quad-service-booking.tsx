"use client";

import { ClockCounterClockwiseIcon, MapTrifoldIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { ACTIVITY_ICON } from "@/components/reservation/activity-icons";
import { ServiceDateField } from "@/components/services/service-date-field";
import type { QuadPageData } from "@/lib/data/public-types";
import type { QuadPick } from "@/lib/reservation";
import { dateKey } from "@/lib/sauna";
import { cn } from "@/lib/utils";
import { QuadAccessories } from "./quad-accessories";
import { QuadHourlyControls } from "./quad-hourly-controls";
import { QuadTimeField } from "./quad-availability";
import { quadTourSlots, type QuadTourPick } from "./quad-tour-plan";
import { QuadRouteDialog } from "./quad-route-dialog";

interface QuadServiceBookingProps {
  data: QuadPageData;
  days: Date[];
  /** The chosen day, or null until the visitor picks one. */
  date: Date | null;
  /** The tour in the plan: route, start, quads and gear. The plan panel edits the quantity. */
  pick: QuadTourPick | null;
  /** The hourly rental in the plan (quads per fleet type, start, hours); one of the two is set at a time. */
  quadPick: QuadPick | null;
  busy: boolean;
  onDate: (date: Date) => void;
  onPick: (pick: QuadTourPick | null) => void;
  onQuadPick: (pick: QuadPick | null) => void;
}

type Mode = "turas" | "nuoma";

/**
 * Route-first controls of the quad service page. The routes, gear, minimum quads and prices are
 * database rows (`quad_tour_routes`); the shared plan panel and checkout dialog take it from here.
 */
export function QuadServiceBooking({ data, days, date, pick, quadPick, busy, onDate, onPick, onQuadPick }: QuadServiceBookingProps) {
  const hasTours = data.tourRoutes.length > 0;
  const hasRental = data.types.length > 0;
  const [mode, setMode] = useState<Mode>(quadPick || !hasTours ? "nuoma" : "turas");
  const [routeId, setRouteId] = useState(pick?.routeId);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const route = data.tourRoutes.find(({ id }) => id === routeId);
  const day = date ? dateKey(date) : null;
  const slots = day && route ? quadTourSlots(data, day, route.hours) : [];
  const selectedSlot = pick && pick.routeId === route?.id ? slots.find(({ hour }) => hour === pick.startHour) : undefined;
  const note = data.settings.tourCancellationNote;

  if (!hasTours && !hasRental) {
    return <p className="text-sm text-copy">Keturračių šiuo metu nesiūlome. Susisiek su komanda.</p>;
  }

  function chooseMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    // The plan holds one quad booking: switching kind starts that kind afresh.
    onPick(null);
    onQuadPick(null);
  }

  return (
    <div className="space-y-5">
      {hasTours && hasRental ? (
        <div role="group" aria-label="Keturračių paslauga" className="grid grid-cols-2 gap-2">
          {([["turas", "Turas su gidu"], ["nuoma", "Nuoma valandomis"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              disabled={busy}
              onClick={() => chooseMode(id)}
              className={cn(
                "min-h-11 border px-2 py-2 text-xs font-bold transition-colors duration-150",
                mode === id ? "border-ink bg-ink text-dust" : "border-line bg-dust hover:border-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {mode === "nuoma" ? (
        <QuadHourlyControls data={data} days={days} date={date} pick={quadPick} busy={busy} onDate={onDate} onPick={onQuadPick} />
      ) : null}
      {mode === "turas" ? <>
      <fieldset disabled={busy} className="min-w-0">
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <MapTrifoldIcon size={18} aria-hidden /> Trasa
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {data.tourRoutes.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={route?.id === choice.id}
              aria-label={`${choice.name} turas, ${choice.price} €${choice.badge ? `, ${choice.badge}` : ""}`}
              onClick={() => {
                if (route?.id === choice.id) return;
                setRouteId(choice.id);
                onPick(null);
              }}
              className={cn(
                "relative flex min-h-16 min-w-0 flex-col justify-center gap-1 border px-2 py-2 text-left text-xs transition-colors duration-150",
                route?.id === choice.id ? "border-ink bg-ink text-dust" : "border-line bg-dust hover:border-ink",
              )}
            >
              {choice.badge ? <span aria-hidden className="absolute -top-2 right-1 bg-rust px-1.5 py-0.5 text-micro font-bold text-ink">TOP</span> : null}
              <span className="font-bold">{choice.name} turas</span>
              <span>{choice.price} €</span>
            </button>
          ))}
        </div>
        {route ? <QuadRouteDialog route={route} /> : (
          <Link href="#kainos" className="inline-flex min-h-11 items-center text-xs underline underline-offset-4 hover:text-rust">Daugiau apie trasas</Link>
        )}
      </fieldset>
      <ServiceDateField
        date={date}
        days={days}
        disabled={busy || !route}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        onSelect={onDate}
        icons={(d) => {
          const free = route ? Math.max(0, ...quadTourSlots(data, dateKey(d), route.hours).map((slot) => slot.free)) : 0;
          const available = route !== undefined && free >= route.minUnits;
          return [{ Icon: ACTIVITY_ICON.keturraciai, on: available, label: available ? "Yra laisvų laikų" : "Laisvų laikų nėra" }];
        }}
      />
      {route && day ? (
        <>
          <QuadTimeField
            slots={slots}
            duration={route.hours}
            minUnits={route.minUnits}
            selected={selectedSlot}
            onSelect={(slot) => onPick({
              routeId: route.id,
              startHour: slot.hour,
              units: Math.min(slot.free, Math.max(route.minUnits, pick?.units ?? route.minUnits)),
              accessories: pick?.accessories,
            })}
          />
          {!slots.some(({ free }) => free >= route.minUnits) ? (
            <p role="status" className="text-xs text-copy">Šiai trasai laisvų laikų nėra. Pasirink kitą datą.</p>
          ) : null}
        </>
      ) : null}
      {pick && selectedSlot && route ? (
        <>
          <p className="text-xs text-copy">Laisvi keturračiai: {selectedSlot.free}. Turui reikia bent {route.minUnits} keturračių. Kiekį keisk plane žemiau.</p>
          <QuadAccessories
            catalogue={data.tourAccessories}
            title={`${route.name} turas`}
            selected={false}
            quantities={pick.accessories ?? {}}
            onChange={(accessories) => onPick({ ...pick, accessories })}
          />
        </>
      ) : null}
      {note ? (
        <p className="flex items-start gap-3 text-xs text-copy">
          <ClockCounterClockwiseIcon size={18} aria-hidden className="shrink-0" />
          <span>{note}</span>
        </p>
      ) : null}
      </> : null}
    </div>
  );
}
