"use client";

import { MapTrifoldIcon } from "@phosphor-icons/react";
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
            <button
              key={route.id}
              type="button"
              aria-pressed={active}
              aria-label={`${route.name} turas, ${route.price} € keturračiui${route.badge ? `, ${route.badge}` : ""}`}
              onClick={() => onChange(route.id)}
              className={`relative flex min-h-16 min-w-0 flex-col justify-center gap-1 border px-2 py-3 text-left text-xs transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 ${active ? "border-ink bg-ink text-dust" : "border-line text-ink hover:border-ink"}`}
            >
              {route.badge ? <span aria-hidden className="absolute -top-2.5 right-1 max-w-[calc(100%-0.5rem)] truncate bg-rust px-1.5 py-0.5 text-micro font-bold text-ink">{route.badge}</span> : null}
              <span className="font-bold">{route.name} turas</span>
              <span>{route.price} €</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
