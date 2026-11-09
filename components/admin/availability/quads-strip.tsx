"use client";

import { useAdmin } from "../admin-store";
import { formatDay } from "@/lib/admin/format";

const active = (status: string) => status !== "atsaukta";

/** Daily rented quad units for the visible days, against the active fleet. */
export function QuadsStrip({ days }: { days: string[] }) {
  const { quadRentals, quadTypes } = useAdmin();
  const fleet = quadTypes.filter((t) => t.active).reduce((sum, t) => sum + t.units, 0);

  return (
    <div className={`grid gap-2 ${days.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"}`}>
      {days.map((day) => {
        const rented = quadRentals.filter((r) => active(r.status) && r.date === day).reduce((sum, r) => sum + r.units, 0);
        const pct = fleet ? Math.min(100, Math.round((rented / fleet) * 100)) : 0;
        return (
          <div key={day} className="border bg-card p-3">
            <p className="text-xs font-normal text-muted-foreground">{formatDay(day)}</p>
            <p className="mt-2 text-sm font-medium">
              Keturračiai <span className="font-display font-bold">{rented}</span>
              <span className="font-normal text-muted-foreground"> / {fleet}</span>
            </p>
            <progress
              value={pct}
              max={100}
              aria-label={`Keturračių užimtumas ${pct}%`}
              className="mt-1 block h-1.5 w-full appearance-none [&::-moz-progress-bar]:bg-ink [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-ink"
            />
          </div>
        );
      })}
    </div>
  );
}
