"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAdmin } from "../admin-store";
import { QuadsStrip } from "../availability/quads-strip";
import { SaunaGrid } from "../availability/sauna-grid";
import { StaysStrip } from "../availability/stays-strip";
import { daysFrom } from "@/lib/admin/occupancy";
import { SaunaSelect } from "../sauna/sauna-select";
import { EventSheet } from "../calendar/event-sheet";
import { EventDialog } from "../events/event-dialog";
import { BookingSheet } from "./booking-sheet";
import { NewBookingDialog } from "./new-booking-dialog";
import type { ManagedEvent } from "@/lib/admin/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const LEGEND = [
  { swatch: "bg-ink", label: "Patvirtinta" },
  { swatch: "bg-rust/85", label: "Laukia" },
  { swatch: "bg-lake", label: "Viešas seansas" },
  { swatch: "bg-hatch border", label: "Uždaryta" },
  { swatch: "border bg-card", label: "Laisva (spustelėkite, kad sukurtumėte rezervaciją; dešiniu pelės mygtuku – daugiau)" },
];

/** Rezervacijos' "Kalendorius" tab: nightly stays and quad fleet load for the week, plus sauna hours. Merged from the old Užimtumas page. */
export function BookingCalendarTab() {
  const { bookings, saunas, events } = useAdmin();
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [saunaId, setSaunaId] = useState(() => (saunas.find((s) => s.active) ?? saunas[0])?.id ?? "");
  const sauna = saunas.find((s) => s.id === saunaId) ?? saunas[0];
  const mobile = useIsMobile();
  const span = mobile ? 1 : 7;
  const [start, setStart] = useState(startOfToday);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ saunaId: string; date: string; startHour: number } | null>(null);
  const days = daysFrom(start, span);

  const shift = (dir: 1 | -1) => setStart((s) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + dir * span));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="icon" aria-label="Ankstesnis laikotarpis" onClick={() => shift(-1)}>
          <CaretLeftIcon size={18} />
        </Button>
        <Button variant="outline" onClick={() => setStart(startOfToday())}>
          Šiandien
        </Button>
        <Button variant="outline" size="icon" aria-label="Kitas laikotarpis" onClick={() => shift(1)}>
          <CaretRightIcon size={18} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nameliai, kemperiai ir keturračiai</CardTitle>
          <CardDescription>Užimtos naktys ir išnuomoti keturračiai pagal rezervacijas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StaysStrip days={days} />
          <QuadsStrip days={days} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{saunas.length > 1 ? "Pirtys" : (sauna?.name ?? "Pirtis")}</CardTitle>
          {saunas.length > 1 && sauna ? (
            <CardAction>
              <SaunaSelect value={sauna.id} onChange={setSaunaId} className="w-44" />
            </CardAction>
          ) : null}
          <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
            {LEGEND.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className={`inline-block size-3 ${l.swatch}`} />
                {l.label}
              </span>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sauna ? (
            <SaunaGrid
              sauna={sauna}
              days={days}
              onOpenBooking={setOpenId}
              onOpenEvent={setOpenEventId}
              onCreateBooking={(date, startHour) => setCreating({ saunaId: sauna.id, date, startHour })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Pirčių dar nėra.</p>
          )}
        </CardContent>
      </Card>

      <BookingSheet booking={bookings.find((b) => b.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
      <EventSheet event={events.find((e) => e.id === openEventId) ?? null} onOpenChange={(o) => !o && setOpenEventId(null)} onEdit={(event) => { setOpenEventId(null); setEditingEvent(event); }} />
      {editingEvent ? <EventDialog key={editingEvent.id} open event={editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)} /> : null}
      {creating ? (
        <NewBookingDialog
          initial={creating}
          onOpenChange={(o) => !o && setCreating(null)}
          onCreated={(id) => {
            setCreating(null);
            setOpenId(id);
          }}
        />
      ) : null}
    </div>
  );
}
