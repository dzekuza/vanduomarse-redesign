"use client";

import { useAdmin } from "../admin-store";
import { stayUnitsOn } from "@/lib/admin/occupancy";
import { CABIN_COUNT } from "@/lib/admin/labels";
import { formatDay } from "@/lib/admin/format";

/** Nightly cabin and camper occupancy for the visible days. */
export function StaysStrip({ days }: { days: string[] }) {
  const { bookings } = useAdmin();
  return (
    <div className={`grid gap-2 ${days.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"}`}>
      {days.map((day) => {
        const cabins = stayUnitsOn(bookings, day, "namelis");
        const campers = stayUnitsOn(bookings, day, "kemperis");
        const pct = Math.min(100, Math.round((cabins / CABIN_COUNT) * 100));
        return (
          <div key={day} className="border bg-card p-3">
            <p className="text-xs font-normal text-muted-foreground">{formatDay(day)}</p>
            <p className="mt-2 text-sm font-medium">
              Nameliai <span className="font-display font-bold">{cabins}</span>
              <span className="font-normal text-muted-foreground"> / {CABIN_COUNT}</span>
            </p>
            <progress
              value={pct}
              max={100}
              aria-label={`Namelių užimtumas ${pct}%`}
              className="mt-1 block h-1.5 w-full appearance-none [&::-moz-progress-bar]:bg-ink [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-ink"
            />
            <p className="mt-2 text-xs font-medium text-muted-foreground">Kemperiai: {campers}</p>
          </div>
        );
      })}
    </div>
  );
}
