"use client";

import { CABIN_SIZES, CABIN_TOTAL, freeStayUnits, roomLabel } from "@/lib/cabin";
import type { CabinPageData } from "@/lib/data/public-types";
import { AvailabilityCount } from "./availability-count";
import { ServiceAvailabilityCalendar } from "./service-availability-calendar";

export function StayServiceSchedule({ data }: { data: CabinPageData }) {
  return (
    <ServiceAvailabilityCalendar
      today={data.today}
      title="Nakvynės užimtumas"
      cardLabel="Nameliai"
      description="Skaičiai rodo, kiek namelių laisva vienai nakčiai. Pasirink datą, kad pamatytum užimtumą pagal nakvynės tipą."
      countLabel="Laisvų namelių"
      datePrefix="Viena naktis nuo "
      getCount={(date) => ({
        free: CABIN_SIZES.reduce((total, { id }) => total + freeStayUnits(data.availability, date, 1, id), 0),
        capacity: CABIN_TOTAL,
      })}
      renderDetails={(date) => {
        const camperFree = freeStayUnits(data.availability, date, 1, "kemperis");
        return (
          <ul className="space-y-2">
            {CABIN_SIZES.map(({ id, name, count }) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-line bg-foam p-3 text-xs">
                <span className="font-bold">{name}</span>
                <span className="inline-flex items-center gap-2 text-copy">
                  Laisva <AvailabilityCount free={freeStayUnits(data.availability, date, 1, id)} capacity={count} showDot />
                </span>
              </li>
            ))}
            <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-line bg-foam p-3 text-xs">
              <span className="font-bold">{roomLabel("kemperis", CABIN_SIZES[0].id)}</span>
              <span className="inline-flex items-center gap-2 text-copy">
                {Number.isFinite(camperFree) ? <>Laisva <AvailabilityCount free={camperFree} showDot /></> : "Vietų limitas nenurodytas"}
              </span>
            </li>
          </ul>
        );
      }}
    />
  );
}
