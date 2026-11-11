"use client";

import { useState } from "react";
import { CompactStepper } from "@/components/booking/stepper";
import { Cta } from "@/components/cta";
import { OptionGroupLabel } from "@/components/reservation/option-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { QuadPageData } from "@/lib/data/public-types";
import { hourLabel, type QuadTourAccessory, type QuadTourRoute } from "@/lib/quads";
import type { When } from "@/lib/reservation";
import { hoursLabel } from "@/lib/sauna";
import { quadTourAccessories, quadTourStarts, type QuadTourPick, type QuadTourSlot } from "./quad-tour-plan";
import { QuadRouteDialog } from "./quad-route-dialog";
import { QuadAccessories } from "./quad-accessories";

interface QuadTourCardProps {
  data: QuadPageData;
  when: When;
  busy: readonly number[];
  pick: QuadTourPick | null;
  /** Show only this route (the one chosen above the date); a tour already in the plan always stays. */
  routeId?: string;
  onChange: (pick: QuadTourPick | null) => void;
}

interface DraftPick {
  startHour: number | null;
  units: number;
  accessories?: Record<string, number>;
}

/** Route cards after the date picker, with independent drafts and one selected tour. */
export function QuadTourCard({ data, when, busy, pick, routeId, onChange }: QuadTourCardProps) {
  const [drafts, setDrafts] = useState<Record<string, DraftPick>>({});

  function choose(next: QuadTourPick | null) {
    if (pick) setDrafts((current) => ({ ...current, [pick.routeId]: { startHour: pick.startHour, units: pick.units, accessories: pick.accessories } }));
    onChange(next);
  }

  // Only routes with a departure on this day are offered; a route already in the plan stays so it can be removed.
  const routes = data.tourRoutes.filter((route) => pick?.routeId === route.id || ((routeId === undefined || routeId === route.id) && quadTourStarts(data, when.day, route, busy).length > 0));

  if (routes.length === 0) {
    return <p role="status" className="text-sm text-copy">Šią dieną turų nėra. Pasirink kitą datą.</p>;
  }

  return (
    <div className="@container">
      <OptionGroupLabel>{routeId === undefined ? "Trasos" : "Turas"}</OptionGroupLabel>
      <div className="grid items-start gap-3 lg:@2xl:grid-cols-3">
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            catalogue={data.tourAccessories}
            starts={quadTourStarts(data, when.day, route, busy)}
            selected={pick?.routeId === route.id}
            choice={pick?.routeId === route.id ? pick : drafts[route.id] ?? { startHour: null, units: route.minUnits }}
            onDraft={(next) => {
              setDrafts((current) => ({ ...current, [route.id]: next }));
              const start = quadTourStarts(data, when.day, route, busy).find(({ hour }) => hour === next.startHour);
              if (pick?.routeId === route.id && next.startHour !== null && start?.eventId) onChange({ routeId: route.id, eventId: start.eventId, ...next, startHour: next.startHour });
            }}
            onChoose={choose}
          />
        ))}
      </div>
    </div>
  );
}

function RouteCard({ route, catalogue, starts, selected, choice, onDraft, onChoose }: {
  route: QuadTourRoute;
  catalogue: readonly QuadTourAccessory[];
  starts: QuadTourSlot[];
  selected: boolean;
  choice: DraftPick;
  onDraft: (next: DraftPick) => void;
  onChoose: (next: QuadTourPick | null) => void;
}) {
  const title = `${route.name} turas`;
  const slot = starts.find(({ hour }) => hour === choice.startHour);
  const ready = Boolean(slot && choice.units >= route.minUnits && choice.units <= slot.free && quadTourAccessories(catalogue, choice.accessories).ok);
  const copy = selected ? "text-dust/80" : "text-copy";

  return (
    <article aria-label={title} className={`relative flex min-w-0 flex-col gap-4 border p-5 transition-colors duration-150 ease-out-strong ${selected ? "border-ink bg-ink text-dust" : "border-line bg-card"}`}>
      <header className="space-y-2">
        <p className={`text-micro uppercase ${copy}`}>{route.kilometres} km · {hoursLabel(route.hours)}</p>
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-item font-bold">{title}{route.badge ? <span className="bg-rust px-1.5 py-0.5 text-micro font-bold text-ink">{route.badge}</span> : null}</h3>
        <p className="text-xs font-bold">{route.price} € / keturračiui</p>
      </header>
      <QuadRouteDialog route={route} variant="icon" className="absolute top-2 right-2" />
      <div className="mt-auto space-y-4">
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
              <CompactStepper label={`Kiekis: ${route.name}`} value={choice.units} min={route.minUnits} max={slot.free} onChange={(units) => onDraft({ ...choice, units })} editable />
              <p className={`text-xs ${copy}`}>Bent {route.minUnits} keturračiai.</p>
            </div>
            <QuadAccessories catalogue={catalogue} title={title} selected={selected} quantities={choice.accessories ?? {}} onChange={(accessories) => onDraft({ ...choice, accessories })} />
          </>
        ) : null}
        {starts.length === 0 || (selected && !ready) ? (
          <p role="status" className={`text-xs ${copy}`}>{starts.length === 0 ? "Šią dieną turų nėra. Pasirink kitą datą." : "Patikslink laiką arba kiekį."}</p>
        ) : null}
        <Cta
          tone={selected ? "cream" : "dark"}
          small
          aria-pressed={selected}
          aria-label={`${selected ? "Pašalinti" : "Pasirinkti"}: ${title}`}
          disabled={!selected && !ready}
          onClick={() => {
            if (selected) onChoose(null);
            else if (slot?.eventId && ready) onChoose({ routeId: route.id, eventId: slot.eventId, startHour: slot.hour, units: choice.units, accessories: choice.accessories });
          }}
        >{selected ? "Pašalinti" : "Pasirinkti"}</Cta>
      </div>
    </article>
  );
}
