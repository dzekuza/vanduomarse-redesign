"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Cta } from "@/components/cta";
import { DatePicker } from "@/components/reservation/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { QuadPageData } from "@/lib/data/public-types";
import { freeAt, hourLabel } from "@/lib/quads";
import { RESERVATION_DAYS } from "@/lib/reservation";
import { dateKey, nextDays, pastHourOn } from "@/lib/sauna";

const DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" });

interface QuadScheduleProps {
  data: QuadPageData;
}

/** Free quads per hour for a browsed day; the date here is independent of the booking form. */
export function QuadSchedule({ data }: QuadScheduleProps) {
  const { today, nowHour, types, settings, taken } = data;
  const [day, setDay] = useState(today);
  const days = nextDays(today, RESERVATION_DAYS);
  const selected = days.find((candidate) => dateKey(candidate) === day) ?? days[0];
  const selectedDay = dateKey(selected);
  const fleet = types.filter(({ active, units }) => active && units > 0);
  const fleetSize = fleet.reduce((sum, { units }) => sum + units, 0);
  const hours = Array.from({ length: settings.closeHour - settings.openHour }, (_, index) => settings.openHour + index);

  function freeOnHour(key: string, hour: number) {
    return fleet.reduce((sum, type) => sum + freeAt(type, taken, key, hour), 0);
  }

  const pastHour = pastHourOn(selectedDay, today, nowHour);
  const openHours = hours.filter((hour) => hour > pastHour);
  return (
    <div className="min-w-0 space-y-5">
      <DatePicker
        days={days}
        selected={selected}
        onSelect={(date) => setDay(dateKey(date))}
        initialView="calendar"
        icons={(date) => {
          const key = dateKey(date);
          const lastHour = pastHourOn(key, today, nowHour);
          const open = hours.some((hour) => hour > lastHour && freeOnHour(key, hour) > 0);
          return [{ Icon: ArrowUpRightIcon, label: open ? "Yra laisvų keturračių" : "Laisvų keturračių nėra", on: open }];
        }}
      />
      <div className="space-y-3">
        <h3 className="text-item font-bold" aria-live="polite">{DATE_LABEL.format(selected)}</h3>
        {fleetSize > 0 && openHours.length > 0 ? (
          <>
            <p className="text-xs text-copy">Keturračių parke: {fleetSize}. Laisvų keturračių skaičius gali priklausyti nuo pasirinktos turo trukmės.</p>
            <Table aria-label={`Keturračių užimtumas ${DATE_LABEL.format(selected)}`} className="table-fixed border border-line text-xs tabular-nums">
              <TableHeader className="bg-foam/25 [&_tr]:border-line">
                <TableRow>
                  <TableHead scope="col" className="px-3">Laikas</TableHead>
                  <TableHead scope="col" className="text-center">Laisva</TableHead>
                  <TableHead scope="col" className="text-center">Užimta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openHours.map((hour) => {
                  const free = freeOnHour(selectedDay, hour);
                  return (
                    <TableRow key={hour} className="border-line">
                      <th scope="row" className="px-3 py-2 text-left font-bold">{hourLabel(hour)}</th>
                      <TableCell className={free ? "text-center font-bold" : "text-center text-copy"}>{free}</TableCell>
                      <TableCell className="text-center">{fleetSize - free}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-xs text-copy">
            {fleetSize === 0 ? "Šiuo metu keturračių parke nėra." : "Šios dienos važiavimo laikai jau praėjo. Pasirink kitą datą."}
          </p>
        )}
      </div>
      <Cta tone="dark" small href="#rezervuoti">Planuoti keturračių turą</Cta>
    </div>
  );
}
