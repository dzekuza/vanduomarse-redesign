"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { BookingSheet } from "../bookings/booking-sheet";
import { RentalSheet } from "../quads/rental-sheet";
import { DayAgenda } from "./day-agenda";
import { DayView } from "./day-view";
import { EventSheet } from "./event-sheet";
import { KindMark } from "./kind-dot";
import type { DayAction } from "./day-menu";
import { MonthGrid } from "./month-grid";
import { WeekView } from "./week-view";
import { EventDialog } from "../events/event-dialog";
import { NewBookingDialog } from "../bookings/new-booking-dialog";
import { CALENDAR_KINDS, calendarEntries, entriesOn, weekDays, type CalendarEntry, type CalendarKind } from "@/lib/admin/calendar-entries";
import { formatDay, parseDay } from "@/lib/admin/format";
import type { ManagedEvent } from "@/lib/admin/types";
import { dateKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const monthLabel = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long" });

type View = "menuo" | "savaite" | "diena";

const VIEWS: { id: View; label: string }[] = [
  { id: "diena", label: "Diena" },
  { id: "savaite", label: "Savaitė" },
  { id: "menuo", label: "Mėnuo" },
];

const STEP_LABEL: Record<View, string> = { menuo: "mėnuo", savaite: "savaitė", diena: "diena" };

/** Events and bookings of every type, as a day, week or month. The selected day is the cursor all three share. */
export function CalendarView() {
  const { bookings, quadRentals, quadTypes, events } = useAdmin();
  const today = dateKey(new Date());
  const [view, setView] = useState<View>("menuo");
  const [selected, setSelected] = useState(today);
  const cursor = parseDay(selected);
  const week = weekDays(selected);
  const [hidden, setHidden] = useState<ReadonlySet<CalendarKind>>(new Set());
  const [openEntry, setOpenEntry] = useState<CalendarEntry | null>(null);
  const [creating, setCreating] = useState<{ action: DayAction; day: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);

  const all = useMemo(() => calendarEntries({ bookings, quadRentals, quadTypes, events }), [bookings, quadRentals, quadTypes, events]);
  const visible = useMemo(() => all.filter((e) => !hidden.has(e.kind)), [all, hidden]);

  const selectedEntries = entriesOn(visible, selected);
  const shift = (dir: -1 | 1) => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const d = cursor.getDate();
    const next = view === "menuo" ? new Date(y, m + dir, 1) : new Date(y, m, d + dir * (view === "savaite" ? 7 : 1));
    setSelected(dateKey(next));
  };
  const label = view === "menuo" ? monthLabel.format(cursor) : view === "savaite" ? `${formatDay(week[0])} – ${formatDay(week[6])}` : formatDay(selected);
  const create = (action: DayAction, day: string) => {
    setSelected(day);
    setCreating({ action, day });
  };
  const toggle = (kind: CalendarKind) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (!next.delete(kind)) next.add(kind);
      return next;
    });

  return (
    <AdminPage title="Kalendorius" description="Renginiai, seansai ir turai su vietų užimtumu bei visos rezervacijos vienoje vietoje: pirtis, apgyvendinimas ir keturračiai. Renginio rezervacijas matysite jį atidarę.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label={`Ankstesnis: ${STEP_LABEL[view]}`} onClick={() => shift(-1)}>
            <CaretLeftIcon size={18} />
          </Button>
          <p className="min-w-40 text-center text-sm font-medium capitalize">{label}</p>
          <Button variant="outline" size="icon" aria-label={`Kitas: ${STEP_LABEL[view]}`} onClick={() => shift(1)}>
            <CaretRightIcon size={18} />
          </Button>
          <Button variant="outline" onClick={() => setSelected(today)}>
            Šiandien
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              {VIEWS.map((v) => (
                <TabsTrigger key={v.id} value={v.id} className="min-h-11 px-4">
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Rodyti pagal tipą">
          {CALENDAR_KINDS.map((k) => (
            <Button key={k.id} variant="outline" size="sm" aria-pressed={!hidden.has(k.id)} onClick={() => toggle(k.id)} className={cn("min-h-11", hidden.has(k.id) && "text-muted-foreground line-through")}>
              <KindMark kind={k.id} /> {k.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          {view === "menuo" ? (
            <MonthGrid month={cursor} entries={visible} selected={selected} today={today} onSelect={setSelected} onOpen={setOpenEntry} onCreate={create} />
          ) : view === "savaite" ? (
            <WeekView day={selected} entries={visible} today={today} onSelect={setSelected} onOpen={setOpenEntry} onCreate={create} />
          ) : (
            <DayView day={selected} entries={entriesOn(visible, selected)} onSelect={setSelected} onOpen={setOpenEntry} onCreate={create} />
          )}
        </CardContent>
      </Card>
      {view === "menuo" && selectedEntries.length ? <DayAgenda day={selected} entries={selectedEntries} onOpen={setOpenEntry} /> : null}

      <EventSheet event={openEntry?.event ? (events.find((e) => e.id === openEntry.id) ?? null) : null} onOpenChange={(o) => !o && setOpenEntry(null)}
        onEdit={(event) => {
          setOpenEntry(null);
          setEditingEvent(event);
        }}
      />
      <BookingSheet booking={openEntry?.key.startsWith("booking:") ? (bookings.find((b) => b.id === openEntry.id) ?? null) : null} onOpenChange={(o) => !o && setOpenEntry(null)} />
      <RentalSheet rental={openEntry?.key.startsWith("rental:") ? (quadRentals.find((r) => r.id === openEntry.id) ?? null) : null} onOpenChange={(o) => !o && setOpenEntry(null)} />
      {editingEvent ? <EventDialog key={editingEvent.id} open event={editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)} /> : null}
      {creating?.action === "booking" ? (
        <NewBookingDialog initial={{ date: creating.day }} onOpenChange={(o) => !o && setCreating(null)} onCreated={() => setCreating(null)} />
      ) : null}
      {creating && creating.action !== "booking" ? (
        <EventDialog
          key={`${creating.action}-${creating.day}`}
          open
          presetCategory={creating.action === "seansas" ? "pirtis" : undefined}
          presetDate={creating.day}
          onOpenChange={(o) => !o && setCreating(null)}
        />
      ) : null}
    </AdminPage>
  );
}
