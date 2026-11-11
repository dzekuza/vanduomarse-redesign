"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuadPageData } from "@/lib/data/public-types";
import { freeAt, hourLabel } from "@/lib/quads";
import { dateKey, pastHourOn } from "@/lib/sauna";
import { AvailabilityCount } from "./availability-count";
import { ServiceAvailabilityCalendar } from "./service-availability-calendar";

interface QuadScheduleProps {
  data: QuadPageData;
  day: string;
  onDayChange: (day: string) => void;
}

export function QuadSchedule({ data, day, onDayChange }: QuadScheduleProps) {
  const { today, nowHour, types, settings, taken } = data;
  const fleet = types.filter(({ active, units }) => active && units > 0);
  const fleetSize = fleet.reduce((sum, { units }) => sum + units, 0);
  const hours = Array.from({ length: settings.closeHour - settings.openHour }, (_, index) => settings.openHour + index);

  function availability(key: string) {
    const pastHour = pastHourOn(key, today, nowHour);
    return hours.filter((hour) => hour > pastHour).map((hour) => ({
      hour,
      free: fleet.reduce((sum, type) => sum + freeAt(type, taken, key, hour), 0),
    }));
  }

  return (
    <ServiceAvailabilityCalendar
      today={today}
      day={day}
      onDayChange={onDayChange}
      title="Keturračių užimtumas"
      cardLabel="Keturračiai"
      description="Kalendoriuje rodomas didžiausias laisvų keturračių skaičius per vieną valandą. Pasirink dieną ir peržiūrėk jos užimtumą."
      countLabel="Daugiausia laisvų keturračių vienu metu"
      emptyLabel="Važiavimo laikų nėra"
      getCount={(date) => {
        const slots = availability(dateKey(date));
        if (!fleetSize || !slots.length) return null;
        return { free: Math.max(...slots.map((slot) => slot.free)), capacity: fleetSize };
      }}
      renderDetails={(date) => (
        <>
          <p className="text-xs text-copy">Laisvų keturračių skaičius priklauso nuo pasirinkto laiko ir turo trukmės.</p>
          <Table aria-label="Keturračių užimtumas pagal laiką" className="table-fixed border border-line text-xs tabular-nums">
            <TableHeader className="bg-foam/25 [&_tr]:border-line">
              <TableRow>
                <TableHead scope="col" className="px-3">Laikas</TableHead>
                <TableHead scope="col" className="text-center">Laisva</TableHead>
                <TableHead scope="col" className="text-center">Užimta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availability(dateKey(date)).map(({ hour, free }) => (
                <TableRow key={hour} className="border-line">
                  <th scope="row" className="px-3 py-2 text-left font-bold">{hourLabel(hour)}</th>
                  <TableCell className="text-center"><AvailabilityCount free={free} /></TableCell>
                  <TableCell className="text-center">{fleetSize - free}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    />
  );
}
