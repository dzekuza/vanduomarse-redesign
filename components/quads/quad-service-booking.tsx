"use client";

import { MapTrifoldIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { Cta } from "@/components/cta";
import { QuadServiceNotices } from "@/components/services/quad-service-help";
import { ServiceDateField } from "@/components/services/service-date-field";
import { MAIN_CONTACT } from "@/lib/contacts";
import type { QuadPageData } from "@/lib/data/public-types";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { dateKey, nextDays } from "@/lib/sauna";
import { cn } from "@/lib/utils";
import { QuadAccessories } from "./quad-accessories";
import { QuadAvailabilityDot, QuadTimeField } from "./quad-availability";
import { QUAD_PREVIEW_MIN_UNITS, QUAD_PREVIEW_ROUTES, type QuadPreviewRoute } from "./quad-preview-content";
import { quadPreviewPlan, quadPreviewSlots } from "./quad-preview-plan";
import { QuadPreviewReview } from "./quad-preview-review";
import { QuadRouteDialog } from "./quad-route-dialog";

interface QuadServiceBookingProps {
  data: QuadPageData;
  day: string | null;
  onDayChange: (day: string) => void;
}

/** Route-first planning for the service page. This uses the preview catalogue only. */
export function QuadServiceBooking({ data, day, onDayChange }: QuadServiceBookingProps) {
  const [route, setRoute] = useState<QuadPreviewRoute>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const days = useMemo(() => nextDays(data.today, RESERVATION_DAYS), [data.today]);
  const selected = days.find((date) => dateKey(date) === day) ?? null;

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-bold">
          <MapTrifoldIcon size={18} aria-hidden /> Trasa
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {QUAD_PREVIEW_ROUTES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={route?.id === choice.id}
              aria-label={`${choice.name} turas, ${choice.price} €${choice.badge ? `, ${choice.badge}` : ""}`}
              onClick={() => setRoute(choice)}
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
        date={selected}
        days={days}
        disabled={!route}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        onSelect={(date) => onDayChange(dateKey(date))}
        onClear={() => onDayChange("")}
        dayDetails={route ? (date) => {
          const free = Math.max(0, ...quadPreviewSlots(data, dateKey(date), route.hours).map((slot) => slot.free));
          const available = free >= QUAD_PREVIEW_MIN_UNITS;
          return {
            label: `Daugiausia laisvų keturračių: ${free}. ${available ? "Yra rezervuojamų laikų." : "Rezervuojamų laikų nėra."}`,
            available,
            indicator: <span className="inline-flex items-center gap-1 text-micro leading-none text-ink group-aria-pressed/day:text-dust"><QuadAvailabilityDot available={available} />{free}</span>,
          };
        } : undefined}
        footer={
          <div className="space-y-1 text-xs text-copy">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5"><QuadAvailabilityDot available /> Yra laikų</span>
              <span className="inline-flex items-center gap-1.5"><QuadAvailabilityDot available={false} /> Laikų nėra</span>
            </div>
            <p>Skaičius rodo, kiek daugiausia keturračių laisva vienam turo laikui.</p>
          </div>
        }
      />
      <QuadServiceBookingTime key={`${route?.id ?? ""}:${day ?? ""}`} data={data} day={day} route={route} />
    </div>
  );
}

function QuadServiceBookingTime({ data, day, route }: { data: QuadPageData; day: string | null; route?: QuadPreviewRoute }) {
  const reserveButton = useRef<HTMLButtonElement>(null);
  const [startHour, setStartHour] = useState<number>();
  const [units, setUnits] = useState(1);
  const [accessories, setAccessories] = useState<Record<string, number>>({});
  const [review, setReview] = useState(false);
  const slots = day && route ? quadPreviewSlots(data, day, route.hours) : [];
  const slot = slots.find(({ hour, free }) => hour === startHour && free >= QUAD_PREVIEW_MIN_UNITS);
  const plan = day && route && slot ? quadPreviewPlan(data, { day, people: 1 }, { routeId: route.id, startHour: slot.hour, units, accessories }) : null;
  const inquiryHref = plan?.ok ? `mailto:${MAIN_CONTACT.email}?subject=${encodeURIComponent("Keturračių turo rezervacija")}&body=${encodeURIComponent(
    ["Sveiki, norėčiau rezervuoti keturračių turą.", "", plan.line.title, plan.line.schedule, plan.line.detail, `Preliminari kaina su PVM: ${plan.line.price} €`].join("\r\n"),
  )}` : undefined;

  return (
    <div className="space-y-5">
      <QuadTimeField slots={slots} duration={route?.hours ?? 0} selected={slot} onSelect={({ hour, free }) => {
        setStartHour(hour);
        setUnits((current) => Math.min(current, free));
      }} />
      {day && route && !slots.some(({ free }) => free >= QUAD_PREVIEW_MIN_UNITS) ? (
        <p role="status" className="text-xs text-copy">Šiai trasai laisvų laikų nėra. Pasirink kitą datą.</p>
      ) : null}
      {slot && route ? (
        <div className="space-y-4 border-t border-line pt-4">
          <div className="space-y-2">
            <Stepper label="Keturračių kiekis" value={units} min={1} max={slot.free} onChange={setUnits} editable compact />
            <p className="text-xs text-copy">Laisvi keturračiai: {slot.free}. Turui reikia bent {QUAD_PREVIEW_MIN_UNITS} keturračių.</p>
          </div>
          <QuadAccessories title={`${route.name} turas`} selected={false} quantities={accessories} onChange={setAccessories} />
        </div>
      ) : null}
      {plan ? (
        <p aria-live="polite" className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
          <span className="text-xs text-copy">Preliminari kaina su PVM</span>
          <strong className="text-figure">{plan.line.price} €</strong>
        </p>
      ) : null}
      <QuadServiceNotices />
      {plan?.ok ? <Cta ref={reserveButton} tone="dark" small className="w-full" onClick={() => setReview(true)}>Rezervuoti</Cta> : null}
      <QuadPreviewReview
        open={review && Boolean(inquiryHref)}
        onClose={() => setReview(false)}
        onReturnFocus={() => reserveButton.current?.focus()}
        lines={plan ? [plan.line] : []}
        total={plan?.line.price ?? 0}
        inquiryHref={inquiryHref}
      />
    </div>
  );
}
