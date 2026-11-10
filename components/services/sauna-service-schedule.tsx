"use client";

import { useMemo, useRef, useState } from "react";
import { DatePicker } from "@/components/reservation/date-picker";
import { openSessionInfo, SessionInfoLink } from "@/components/reservation/session-info-link";
import type { SaunaPageData } from "@/lib/data/public-types";
import { RESERVATION_DAYS, sessionRows, type SessionRow } from "@/lib/reservation";
import { dateKey, nextDays } from "@/lib/sauna";
import { cn } from "@/lib/utils";
import { AvailabilityCount } from "./availability-count";
import { SaunaScheduleChooser } from "./sauna-schedule-chooser";

interface SaunaServiceScheduleProps {
  data: SaunaPageData;
  initialDay?: string;
}

type PublishedSession = SessionRow & { eventId: string };
const PREVIEW_LIMIT = 2;

function publishedSessionsByDay(data: SaunaPageData) {
  const dates = new Set(data.events.map((event) => event.date));
  return new Map(Array.from(dates, (date) => [
    date,
    sessionRows(data, date).flatMap((row): PublishedSession[] => row.mode === "session" && row.eventId !== null
      ? [{ ...row, eventId: row.eventId }]
      : []),
  ]));
}

function ScheduleDayIndicator({ sessions, detailed }: { sessions: PublishedSession[]; detailed: boolean }) {
  const free = sessions.reduce((sum, row) => sum + row.maxPeople, 0);
  const total = sessions.every((row) => row.capacity)
    ? sessions.reduce((sum, row) => sum + (row.capacity ?? 0), 0)
    : undefined;

  return (
    <>
      <span className={cn("block text-micro leading-tight tracking-normal", detailed && "@lg/sauna-schedule:hidden")}>
        <AvailabilityCount free={free} capacity={total} showDot />
      </span>
      {detailed && sessions.length > PREVIEW_LIMIT ? (
        <span className="hidden text-micro @lg/sauna-schedule:block">+{sessions.length - PREVIEW_LIMIT}</span>
      ) : null}
    </>
  );
}

function ScheduleDayLinks({ sessions }: { sessions: PublishedSession[] }) {
  return (
    <div className="hidden space-y-1 px-1 pb-1 text-micro leading-tight tracking-normal @lg/sauna-schedule:block">
      {sessions.slice(0, PREVIEW_LIMIT).map((row) => (
        <SessionInfoLink key={row.key} id={row.eventId} className="block min-h-11 space-y-1 border border-line bg-foam p-1.5 text-ink hover:border-ink">
          <span className="block tabular-nums">
            <span aria-hidden>{row.time.split("–")[0]}</span>
            <span className="sr-only">{row.time}</span>
          </span>
          <span className="line-clamp-2 font-bold wrap-anywhere">{row.title}</span>
          <span aria-hidden><AvailabilityCount free={row.maxPeople} capacity={row.capacity} showDot /></span>
          <span className="sr-only">{row.seats}</span>
        </SessionInfoLink>
      ))}
    </div>
  );
}

export function SaunaServiceSchedule({ data, initialDay }: SaunaServiceScheduleProps) {
  const days = useMemo(() => nextDays(data.today, RESERVATION_DAYS), [data.today]);
  const sessionsByDay = useMemo(() => publishedSessionsByDay(data), [data]);
  const [day, setDay] = useState(initialDay);
  const [chooserOpen, setChooserOpen] = useState(false);
  const calendar = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const selected = days.find((date) => dateKey(date) === day)
    ?? days.find((date) => sessionsByDay.get(dateKey(date))?.length)
    ?? days[0];
  const sessions = sessionsByDay.get(dateKey(selected)) ?? [];

  function selectDay(date: Date) {
    const key = dateKey(date);
    const rows = sessionsByDay.get(key);
    setDay(key);
    if (!rows?.length) return;
    opener.current = calendar.current?.querySelector<HTMLButtonElement>(`button[data-date="${key}"]`) ?? null;
    opener.current?.focus({ preventScroll: true });
    if (rows.length === 1) openSessionInfo(rows[0].eventId);
    else setChooserOpen(true);
  }

  return (
    <div ref={calendar} className="@container/sauna-schedule min-w-0 space-y-5">
      <p className="text-sm text-copy">Kalendoriuje matysi, kiek vietų laisva. Pasirink seansą arba jo dieną, kad peržiūrėtum informaciją ir rezervuotum vietą.</p>
      <DatePicker
        days={days}
        selected={selected}
        onSelect={selectDay}
        initialView="calendar"
        dayDetails={(date, view) => {
          const rows = sessionsByDay.get(dateKey(date));
          if (!rows?.length) return { label: "Seansų nėra", available: false };
          return {
            label: rows.map((row) => `${row.title}, ${row.time}. ${row.seats}`).join(". "),
            available: rows.some((row) => !row.blocked),
            opensDialog: true,
            indicator: <ScheduleDayIndicator sessions={rows} detailed={view === "calendar"} />,
            actions: view === "calendar" ? <ScheduleDayLinks sessions={rows} /> : undefined,
          };
        }}
      />
      <SaunaScheduleChooser date={selected} sessions={sessions} open={chooserOpen} onOpenChange={setChooserOpen} opener={opener} />
    </div>
  );
}
