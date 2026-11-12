"use client";

import { MapTrifoldIcon } from "@phosphor-icons/react";
import { BOOKING_CHOICE_CLASS, FilterChip } from "@/components/events/filter-chip";
import type { QuadTourRoute } from "@/lib/quads";

interface QuadRoutePickerProps {
  routes: readonly QuadTourRoute[];
  /** The chosen route id, or null before a choice. */
  value: string | null;
  disabled?: boolean;
  onChange: (routeId: string) => void;
}

/** The tour routes as one row of tiles (name and price per quad), the first step of a tour booking. The red tag is the route's own `badge`. */
export function QuadRoutePicker({ routes, value, disabled, onChange }: QuadRoutePickerProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-3 flex items-center gap-2 text-sm font-bold"><MapTrifoldIcon size={18} aria-hidden /> Trasa</legend>
      <div className="grid grid-cols-3 gap-2">
        {routes.map((route) => {
          const active = route.id === value;
          return (
            <FilterChip
              key={route.id}
              active={active}
              aria-label={`${route.name} turas, ${route.price} € keturračiui${route.badge ? `, ${route.badge}` : ""}`}
              onClick={() => onChange(route.id)}
              className={`relative ${BOOKING_CHOICE_CLASS}`}
            >
              {route.badge ? <span aria-hidden className="absolute -top-2.5 right-1 max-w-[calc(100%-0.5rem)] truncate bg-rust px-1.5 py-0.5 text-micro font-bold text-ink">{route.badge}</span> : null}
              <span className="font-bold">{route.name} turas</span>
              <span className={active ? "text-dust/80" : "text-copy"}>{route.price} €</span>
            </FilterChip>
          );
        })}
      </div>
    </fieldset>
  );
}
