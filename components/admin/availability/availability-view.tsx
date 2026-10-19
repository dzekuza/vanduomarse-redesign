"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { BookingSheet } from "../bookings/booking-sheet";
import { daysFrom } from "@/lib/admin/occupancy";
import { SaunaGrid } from "./sauna-grid";
import { StaysStrip } from "./stays-strip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const LEGEND = [
  { swatch: "bg-ink", label: "Patvirtinta" },
  { swatch: "bg-rust/85", label: "Laukia" },
  { swatch: "bg-hatch border", label: "Uždaryta" },
  { swatch: "border bg-card", label: "Laisva (spustelėkite, kad uždarytumėte)" },
];

/** Week view of sauna hours plus nightly stays; one day at a time on phones. */
export function AvailabilityView() {
  const { bookings } = useAdmin();
  const mobile = useIsMobile();
  const span = mobile ? 1 : 7;
  const [start, setStart] = useState(startOfToday);
  const [openId, setOpenId] = useState<string | null>(null);
  const days = daysFrom(start, span);

  const shift = (dir: 1 | -1) => setStart((s) => new Date(s.getFullYear(), s.getMonth(), s.getDate() + dir * span));

  return (
    <AdminPage
      title="Užimtumas"
      description="Pirties valandos ir nakvynės. Laisvą valandą galima uždaryti (pvz., priežiūrai). Prijungus duomenų bazę, uždarytos valandos nebus rezervuojamos svetainėje."
      actions={
        <>
          <Button variant="outline" size="icon" aria-label="Ankstesnis laikotarpis" onClick={() => shift(-1)}>
            <CaretLeftIcon size={18} />
          </Button>
          <Button variant="outline" onClick={() => setStart(startOfToday())}>
            Šiandien
          </Button>
          <Button variant="outline" size="icon" aria-label="Kitas laikotarpis" onClick={() => shift(1)}>
            <CaretRightIcon size={18} />
          </Button>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Pirtis</CardTitle>
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
          <SaunaGrid days={days} onOpenBooking={setOpenId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nameliai ir kemperiai</CardTitle>
          <CardDescription>Užimtos naktys pagal rezervacijas.</CardDescription>
        </CardHeader>
        <CardContent>
          <StaysStrip days={days} />
        </CardContent>
      </Card>

      <BookingSheet booking={bookings.find((b) => b.id === openId) ?? null} onOpenChange={(o) => !o && setOpenId(null)} />
    </AdminPage>
  );
}
