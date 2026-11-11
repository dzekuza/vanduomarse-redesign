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
import { SESSION_PREVIEW_LIMIT, SaunaSessionDayIndicator } from "./sauna-session-day-details";
import { SCHEDULE_DAY_CARD, ScheduleDayCards } from "./schedule-day-cards";

interface SaunaServiceScheduleProps {
  data: SaunaPageData;
  initialDay?: string;
}

type PublishedSession = SessionRow & { eventId: string };

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
  return (
    <>
      <span className={cn("block", detailed && "@lg/schedule:hidden")}>
        <SaunaSessionDayIndicator rows={sessions} />
      </span>
      {detailed && sessions.length > SESSION_PREVIEW_LIMIT ? (
        <span className="hidden text-micro @lg/schedule:block">+{sessions.length - SESSION_PREVIEW_LIMIT}</span>
      ) : null}
    </>
  );
}

function ScheduleDayLinks({ sessions }: { sessions: PublishedSession[] }) {
  return (
    <ScheduleDayCards>
      {sessions.slice(0, SESSION_PREVIEW_LIMIT).map((row) => (
        <SessionInfoLink key={row.key} id={row.eventId} className={SCHEDULE_DAY_CARD}>
          <span className="block tabular-nums">
            <span aria-hidden>{row.time.split("–")[0]}</span>
            <span className="sr-only">{row.time}</span>
          </span>
          <span className="line-clamp-2 font-bold wrap-anywhere">{row.title}</span>
          <span aria-hidden><AvailabilityCount free={row.maxPeople} capacity={row.capacity} binary /></span>
          <span className="sr-only">{row.seats}</span>
        </SessionInfoLink>
      ))}
    </ScheduleDayCards>
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
    <div ref={calendar} className="@container/schedule min-w-0 space-y-5">
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
