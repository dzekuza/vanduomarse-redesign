"use client";

import { MapTrifoldIcon } from "@phosphor-icons/react";
import { BOOKING_CHOICE_CLASS, FilterChip } from "@/components/events/filter-chip";
import type { QuadTourRoute } from "@/lib/quads";
import { hoursLabel } from "@/lib/sauna";
import { QuadRouteDialog } from "./quad-route-dialog";

interface QuadRoutePickerProps {
  routes: readonly QuadTourRoute[];
  /** The chosen route id, or null before a choice. */
  value: string | null;
  disabled?: boolean;
  onChange: (routeId: string) => void;
}

/** The tour routes as tiles with name, duration and price per quad. */
export function QuadRoutePicker({ routes, value, disabled, onChange }: QuadRoutePickerProps) {
  return (
    <fieldset disabled={disabled} className="@container min-w-0">
      <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><MapTrifoldIcon size={18} aria-hidden /> Trasa</legend>
      <div className="grid grid-cols-2 gap-2 @xs:grid-cols-3">
        {routes.map((route) => {
          const active = route.id === value;
          const duration = hoursLabel(route.hours);
          return (
            <div key={route.id} className="relative isolate min-w-0">
              <FilterChip
                active={active}
                aria-label={`${route.name} turas, ${duration}, ${route.price} € keturračiui${route.badge ? `, ${route.badge}` : ""}`}
                onClick={() => onChange(route.id)}
                className={`h-full w-full ${BOOKING_CHOICE_CLASS} gap-4 px-2`}
              >
                {route.badge ? <span aria-hidden className="absolute -top-2.5 right-1 max-w-[calc(100%-0.5rem)] truncate bg-rust px-1.5 py-0.5 text-micro font-bold text-ink">{route.badge}</span> : null}
                <span className="w-full pr-6 font-bold">{route.name} turas</span>
                <span className={`flex w-full flex-wrap items-baseline gap-x-1 ${active ? "text-dust/80" : "text-copy"}`}>
                  <span className="whitespace-nowrap">{duration}</span>
                  <span className="ml-auto font-bold whitespace-nowrap">{route.price} €</span>
                </span>
              </FilterChip>
              <QuadRouteDialog route={route} className={`absolute top-1 right-0 ${active ? "text-dust" : "text-ink"}`} />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
