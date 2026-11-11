"use client";

import { freeStayUnits, freeStayUnitsOfKind, stayStock } from "@/lib/cabin";
import type { CabinPageData } from "@/lib/data/public-types";
import { AvailabilityCount } from "./availability-count";
import { ServiceAvailabilityCalendar } from "./service-availability-calendar";

export function StayServiceSchedule({ data }: { data: CabinPageData }) {
  const { availability, stayTypes } = data;
  const capacity = stayStock(stayTypes, "namelis");

  return (
    <ServiceAvailabilityCalendar
      today={data.today}
      title="Nakvynės užimtumas"
      cardLabel="Nameliai"
      description="Skaičiai rodo, kiek namelių laisva vienai nakčiai. Pasirink datą, kad pamatytum užimtumą pagal nakvynės tipą."
      countLabel="Laisvų namelių"
      datePrefix="Viena naktis nuo "
      getCount={(date) => ({ free: freeStayUnitsOfKind(stayTypes, availability, date, 1, "namelis"), capacity })}
      renderDetails={(date) => (
        <ul className="space-y-2">
          {stayTypes.map((type) => {
            const free = freeStayUnits(availability, date, 1, type);
            return (
              <li key={type.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-line bg-foam p-3 text-xs">
                <span className="font-bold">{type.label}</span>
                <span className="inline-flex items-center gap-2 text-copy">
                  {Number.isFinite(free) ? <>Laisva <AvailabilityCount free={free} capacity={type.units ?? undefined} showDot /></> : "Vietų limitas nenurodytas"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    />
  );
}
