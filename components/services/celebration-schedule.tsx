"use client";

import { useMemo, useRef, useState } from "react";
import { EventRow } from "@/components/events/event-row";
import { DatePicker } from "@/components/reservation/date-picker";
import { DialogPhotoClose } from "@/components/reservation/dialog-photo-close";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CELEBRATION_WINDOW_DAYS, toParkEvent, type CelebrationScheduleData, type ParkEventData } from "@/lib/park-events";
import { dateKey, nextDays } from "@/lib/sauna";
import { cn } from "@/lib/utils";
import { AvailabilityCount } from "./availability-count";
import { SCHEDULE_DAY_CARD, ScheduleDayCards } from "./schedule-day-cards";

const PREVIEW_LIMIT = 2;
const PRIVATE_EVENT = "Privatus renginys";
const DATE_LABEL = new Intl.DateTimeFormat("lt-LT", { dateStyle: "long" });

function EventAvailability({ event }: { event: ParkEventData }) {
  if (event.spotsLeft === undefined) return null;
  return <AvailabilityCount free={event.spotsLeft} capacity={event.capacity} binary />;
}

function EventDayPreview({ events, privateDay, detailed }: { events: ParkEventData[]; privateDay: boolean; detailed: boolean }) {
  return (
    <>
      <span className={cn("@container block", detailed && "@lg/schedule:hidden")}>
        <span className="block divide-y divide-line text-calendar-status">
          {events.slice(0, PREVIEW_LIMIT).map((event) => (
            <span key={event.key} className="flex flex-wrap items-center justify-center gap-x-1 py-0.5">
              <span className="font-medium whitespace-nowrap tabular-nums">{event.time}</span>
              <EventAvailability event={event} />
            </span>
          ))}
          {events.length > PREVIEW_LIMIT ? <span className="block py-0.5">+{events.length - PREVIEW_LIMIT}</span> : null}
          {privateDay ? <span className="block py-0.5 font-bold wrap-anywhere">Privatus</span> : null}
        </span>
      </span>
      {detailed && events.length > PREVIEW_LIMIT ? (
        <span className="hidden text-micro @lg/schedule:block">+{events.length - PREVIEW_LIMIT}</span>
      ) : null}
    </>
  );
}

export function CelebrationSchedule({ data }: { data: CelebrationScheduleData }) {
  const days = useMemo(() => nextDays(data.today, CELEBRATION_WINDOW_DAYS), [data.today]);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, ParkEventData[]>();
    for (const event of data.events) {
      const group = grouped.get(event.date);
      if (group) group.push(event);
      else grouped.set(event.date, [event]);
    }
    return grouped;
  }, [data.events]);
  const privateDates = useMemo(() => new Set(data.privateDates), [data.privateDates]);
  const [selected, setSelected] = useState(() => days.find((day) => {
    const key = dateKey(day);
    return eventsByDate.has(key) || privateDates.has(key);
  }) ?? days[0]);
  const [open, setOpen] = useState(false);
  const [openedEntry, setOpenedEntry] = useState<string>();
  const calendar = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const selectedDay = dateKey(selected);
  const events = (eventsByDate.get(selectedDay) ?? []).filter(({ key }) => openedEntry === undefined || key === openedEntry);
  const showPrivate = privateDates.has(selectedDay) && (openedEntry === undefined || openedEntry === "private");

  function showDay(date: Date, entry?: string, trigger?: HTMLButtonElement) {
    setSelected(date);
    const key = dateKey(date);
    if (!eventsByDate.has(key) && !privateDates.has(key)) return;
    opener.current = trigger ?? calendar.current?.querySelector<HTMLButtonElement>(`button[data-date="${key}"]`) ?? null;
    setOpenedEntry(entry);
    setOpen(true);
  }

  return (
    <div ref={calendar} className="@container/schedule min-w-0 space-y-5">
      <p className="text-sm text-copy">Pasirink renginį arba jo dieną, kad peržiūrėtum informaciją. Privačios šventės kalendoriuje pažymėtos atskirai.</p>
      <DatePicker days={days} selected={selected} onSelect={showDay} initialView="calendar" dayDetails={(date, view) => {
        const key = dateKey(date);
        const entries = eventsByDate.get(key) ?? [];
        const privateDay = privateDates.has(key);
        if (!entries.length && !privateDay) return { label: "Renginių nėra", available: false };

        const labels = entries.map(({ title, time, spotsLeft }) =>
          [time, title, spotsLeft === undefined ? null : `Liko vietų: ${spotsLeft}`].filter(Boolean).join(" · "));
        if (privateDay) labels.push(PRIVATE_EVENT);
        return {
          label: labels.join(". "),
          available: true,
          opensDialog: true,
          indicator: <EventDayPreview events={entries} privateDay={privateDay} detailed={view === "calendar"} />,
          actions: view === "calendar" ? (
            <ScheduleDayCards>
              {entries.slice(0, PREVIEW_LIMIT).map((event) => (
                <button key={event.key} type="button" aria-haspopup="dialog" className={SCHEDULE_DAY_CARD}
                  onClick={(click) => showDay(date, event.key, click.currentTarget)}>
                  <span className="block tabular-nums">{event.time}</span>
                  <span className="line-clamp-2 font-bold wrap-anywhere">{event.title}</span>
                  {event.spotsLeft === undefined ? null : (
                    <span className="block">
                      <span className="sr-only">Liko vietų: </span>
                      <EventAvailability event={event} />
                    </span>
                  )}
                </button>
              ))}
              {privateDay ? (
                <button type="button" aria-haspopup="dialog" className={cn(SCHEDULE_DAY_CARD, "font-bold wrap-anywhere")}
                  onClick={(click) => showDay(date, "private", click.currentTarget)}>
                  {PRIVATE_EVENT}
                </button>
              ) : null}
            </ScheduleDayCards>
          ) : undefined,
        };
      }} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}
          className="flex max-h-9/10 flex-col gap-0 overflow-hidden rounded-none border-line bg-popover p-0 text-ink sm:max-w-3xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus({ preventScroll: true });
          }}>
          <DialogPhotoClose />
          <header className="shrink-0 space-y-1 border-b border-line p-5 pr-16 sm:p-6 sm:pr-18">
            <DialogTitle className="font-display text-heading">{openedEntry === "private" ? PRIVATE_EVENT : "Dienos renginiai"}</DialogTitle>
            <DialogDescription>{DATE_LABEL.format(selected)}</DialogDescription>
          </header>
          {events.length || (showPrivate && openedEntry !== "private") ? (
            <div className="min-h-0 space-y-3 overflow-y-auto p-5 sm:p-6">
              {events.map((event) => <EventRow key={event.key} event={toParkEvent(event)} />)}
              {showPrivate ? <p className="border border-line bg-foam p-3 text-sm font-bold">{PRIVATE_EVENT}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
