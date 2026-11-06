"use client";

import { useState } from "react";
import { Stepper } from "@/components/booking/stepper";
import { Cta } from "@/components/cta";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuadPageData } from "@/lib/data/public-types";
import { hourLabel } from "@/lib/quads";
import type { When } from "@/lib/reservation";
import { hoursLabel } from "@/lib/sauna";
import { QUAD_PREVIEW_MIN_UNITS, QUAD_PREVIEW_ROUTES, type QuadPreviewRoute } from "./quad-preview-content";
import { quadPreviewAccessories, quadPreviewStarts, type QuadPreviewPick } from "./quad-preview-plan";
import { QuadRouteDialog } from "./quad-route-dialog";
import { QuadAccessories } from "./quad-accessories";

interface QuadTourCardProps {
  data: QuadPageData;
  when: When;
  busy: readonly number[];
  pick: QuadPreviewPick | null;
  onChange: (pick: QuadPreviewPick | null) => void;
}

interface DraftPick {
  startHour: number | null;
  units: number;
  accessories?: Record<string, number>;
}

/** Three route cards after the date picker, with independent drafts and one selected tour. */
export function QuadTourCard({ data, when, busy, pick, onChange }: QuadTourCardProps) {
  const [drafts, setDrafts] = useState<Record<string, DraftPick>>({});

  function choose(next: QuadPreviewPick | null) {
    if (pick) setDrafts((current) => ({ ...current, [pick.routeId]: { startHour: pick.startHour, units: pick.units, accessories: pick.accessories } }));
    onChange(next);
  }

  return (
    <div>
      <OptionGroupLabel>Trasos · dizaino peržiūra</OptionGroupLabel>
      <div className="grid items-start gap-3 lg:grid-cols-3">
        {QUAD_PREVIEW_ROUTES.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            starts={quadPreviewStarts(data, when.day, route.hours, busy).filter(({ free }) => free >= QUAD_PREVIEW_MIN_UNITS)}
            selected={pick?.routeId === route.id}
            choice={pick?.routeId === route.id ? pick : drafts[route.id] ?? { startHour: null, units: 1 }}
            onDraft={(next) => {
              setDrafts((current) => ({ ...current, [route.id]: next }));
              if (pick?.routeId === route.id && next.startHour !== null) onChange({ routeId: route.id, ...next, startHour: next.startHour });
            }}
            onChoose={choose}
          />
        ))}
      </div>
    </div>
  );
}

function RouteCard({ route, starts, selected, choice, onDraft, onChoose }: {
  route: QuadPreviewRoute;
  starts: { hour: number; free: number }[];
  selected: boolean;
  choice: DraftPick;
  onDraft: (next: DraftPick) => void;
  onChoose: (next: QuadPreviewPick | null) => void;
}) {
  const title = `${route.name} turas`;
  const slot = starts.find(({ hour }) => hour === choice.startHour);
  const ready = Boolean(slot && choice.units >= QUAD_PREVIEW_MIN_UNITS && choice.units <= slot.free && quadPreviewAccessories(choice.accessories).ok);
  const copy = selected ? "text-dust/80" : "text-copy";
  const line = selected ? "border-line-on-ink" : "border-line";

  return (
    <article aria-label={title} className={`flex min-w-0 flex-col gap-4 border p-5 transition-colors duration-150 ease-out-strong ${selected ? "border-ink bg-ink text-dust" : "border-line bg-card"}`}>
      <header className="space-y-2">
        <p className={`text-micro uppercase ${copy}`}>{route.kilometres} km · {hoursLabel(route.hours)}</p>
        <h3 className="text-item font-bold">{title}</h3>
        <p className="text-xs font-bold">{route.price} € / keturračiui</p>
      </header>
      <QuadRouteDialog route={route} />
      <div className={`mt-auto space-y-4 border-t pt-3 ${line}`}>
        <div className="space-y-2">
          <p className={`text-micro uppercase ${copy}`}>Pradžios laikas</p>
          <Select value={slot ? String(choice.startHour) : ""} onValueChange={(value) => onDraft({ ...choice, startHour: Number(value) })} disabled={starts.length === 0}>
            <SelectTrigger aria-label={`Pradžios laikas: ${title}`} className={`min-w-0 w-full rounded-none bg-transparent text-xs ${selected ? "border-line-on-ink text-dust data-placeholder:text-dust/80 [&>svg]:text-dust/80" : "border-line"}`}><SelectValue placeholder="Pasirink laiką" /></SelectTrigger>
            <SelectContent position="popper">
              {starts.map(({ hour }) => <SelectItem key={hour} value={String(hour)} className="min-h-11">{hourLabel(hour)}-{hourLabel(hour + route.hours)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {slot ? (
          <>
            <div className="space-y-2">
              <Stepper label={`Kiekis: ${route.name}`} value={choice.units} min={1} max={slot.free} onChange={(units) => onDraft({ ...choice, units })} editable compact />
              <p className={`text-xs ${copy}`}>Bent {QUAD_PREVIEW_MIN_UNITS} keturračiai.</p>
            </div>
            <QuadAccessories title={title} selected={selected} quantities={choice.accessories ?? {}} onChange={(accessories) => onDraft({ ...choice, accessories })} />
          </>
        ) : null}
        {starts.length === 0 || (selected && !ready) ? (
          <p role="status" className={`text-xs ${copy}`}>{starts.length === 0 ? "Laisvo laiko nėra. Pasirink kitą datą." : "Patikslink laiką arba kiekį."}</p>
        ) : null}
        <Cta
          tone={selected ? "cream" : "dark"}
          small
          aria-pressed={selected}
          aria-label={`${selected ? "Pašalinti" : "Pasirinkti"}: ${title}`}
          disabled={!selected && !ready}
          onClick={() => {
            if (selected) onChoose(null);
            else if (slot && ready) onChoose({ routeId: route.id, startHour: slot.hour, units: choice.units, accessories: choice.accessories });
          }}
        >{selected ? "Pašalinti" : "Pasirinkti"}</Cta>
      </div>
    </article>
  );
}
