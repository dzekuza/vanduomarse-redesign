"use client";

import { useMemo, useState } from "react";
import { Cta } from "@/components/cta";
import { DatePicker } from "@/components/reservation/date-picker";
import { SessionInfoLink } from "@/components/reservation/session-info-link";
import type { SaunaPageData } from "@/lib/data/public-types";
import { RESERVATION_DAYS, sessionRows, type SessionRow } from "@/lib/reservation";
import { dateKey, nextDays } from "@/lib/sauna";
import { cn } from "@/lib/utils";

const DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { dateStyle: "long" });

interface SaunaServiceScheduleProps {
  data: SaunaPageData;
  initialDay?: string;
}

type PublishedSession = SessionRow & { eventId: string; capacity?: number };
const PREVIEW_LIMIT = 2;

function publishedSessionsByDay(data: SaunaPageData) {
  const dates = new Set(data.events.map((event) => event.date));
  const capacities = new Map(data.events.map(({ key, capacity }) => [key, capacity]));
  return new Map(Array.from(dates, (date) => [
    date,
    sessionRows(data, date).flatMap((row): PublishedSession[] => row.mode === "session" && row.eventId !== null
      ? [{ ...row, eventId: row.eventId, capacity: capacities.get(row.eventId) }]
      : []),
  ]));
}

function ScheduleDayIndicator({ sessions, detailed }: { sessions: PublishedSession[]; detailed: boolean }) {
  const free = sessions.reduce((sum, row) => sum + row.maxPeople, 0);
  const total = sessions.every((row) => row.capacity)
    ? sessions.reduce((sum, row) => sum + (row.capacity ?? 0), 0)
    : null;
  const count = (free: number, total?: number | null) => total ? `${free}/${total}` : free;
  const statusClass = "text-rust-ink group-aria-pressed/day:text-dust";

  return (
    <>
      <span className={cn("block truncate text-micro font-bold tracking-normal tabular-nums", detailed && "@lg/sauna-schedule:hidden", free === 0 && statusClass)}>
        {count(free, total)}
      </span>
      {detailed ? (
        <span className="hidden space-y-1 text-left text-micro leading-tight tracking-normal @lg/sauna-schedule:block">
          {sessions.slice(0, PREVIEW_LIMIT).map((row) => (
            <span key={row.key} className="block space-y-1 border border-current/20 px-1.5 py-1.5 text-ink group-aria-pressed/day:text-dust">
              <span className="block tabular-nums">{row.time.split("–")[0]}</span>
              <span className="line-clamp-2 font-bold wrap-anywhere">{row.title}</span>
              <span className={cn("block font-bold tabular-nums", row.blocked && statusClass)}>
                {row.blocked ? "Užimta" : "Liko"} {count(row.maxPeople, row.capacity)}
              </span>
            </span>
          ))}
          {sessions.length > PREVIEW_LIMIT ? <span className="block text-center">+{sessions.length - PREVIEW_LIMIT}</span> : null}
        </span>
      ) : null}
    </>
  );
}

export function SaunaServiceSchedule({ data, initialDay }: SaunaServiceScheduleProps) {
  const days = useMemo(() => nextDays(data.today, RESERVATION_DAYS), [data.today]);
  const sessionsByDay = useMemo(() => publishedSessionsByDay(data), [data]);
  const [day, setDay] = useState(initialDay);
  const selected = days.find((date) => dateKey(date) === day)
    ?? days.find((date) => sessionsByDay.get(dateKey(date))?.length)
    ?? days[0];
  const sessions = sessionsByDay.get(dateKey(selected)) ?? [];

  return (
    <div className="@container/sauna-schedule min-w-0 space-y-5">
      <p className="text-sm text-copy">Kalendoriuje matysi, kiek vietų laisva. Pasirink dieną ir peržiūrėk visus jos seansus.</p>
      <DatePicker
        days={days}
        selected={selected}
        onSelect={(date) => setDay(dateKey(date))}
        initialView="calendar"
        dayDetails={(date, view) => {
          const rows = sessionsByDay.get(dateKey(date));
          if (!rows?.length) return { label: "Seansų nėra", available: false };
          return {
            label: rows.map((row) => `${row.title}, ${row.time}. ${row.seats}`).join(". "),
            available: rows.some((row) => !row.blocked),
            indicator: <ScheduleDayIndicator sessions={rows} detailed={view === "calendar"} />,
          };
        }}
      />
      <div className="space-y-3">
        <h3 aria-live="polite" className="text-item font-bold">{DATE_LABEL.format(selected)}</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-copy">Šiai dienai artėjančių seansų nėra. Pasirink kitą datą arba peržiūrėk privačios pirties laikus.</p>
        ) : (
          <ul aria-label="Pasirinktos dienos seansai" className="divide-y divide-line border-y border-line">
            {sessions.map((row) => (
              <li key={row.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-micro text-copy">{row.time}</p>
                  <h4 className="text-sm font-bold">{row.title}</h4>
                  <p className="text-xs text-copy">{row.rate} · {row.seats}</p>
                </div>
                <SessionInfoLink id={row.eventId} className="inline-flex min-h-11 items-center text-xs font-bold underline underline-offset-4 hover:text-rust">
                  Daugiau informacijos<span className="sr-only"> apie {row.title}, {row.time}</span>
                </SessionInfoLink>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Cta small tone="dark" href="#rezervuoti">Į rezervaciją</Cta>
    </div>
  );
}
