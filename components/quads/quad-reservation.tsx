"use client";

import { useState } from "react";
import { BookingTabs } from "@/components/booking/booking-tabs";
import type { QuadPageData } from "@/lib/data/public-types";
import { QuadRental } from "./quad-rental";
import { TourBooking } from "./tour-booking";

export type QuadMode = "rental" | "tour";

/** Keturračiai: hourly rental or a seat on a guided tour. */
export function QuadReservation({ initialMode = "rental", data }: { initialMode?: QuadMode; data: QuadPageData }) {
  const [mode, setMode] = useState<QuadMode>(initialMode);
  const tabs = [
    { id: "rental" as const, label: "Nuoma valandoms", hint: "Važiuok savarankiškai" },
    { id: "tour" as const, label: "Žygiai su gidu", hint: "Vieta grupėje", badge: data.tours.filter((t) => t.spotsLeft > 0).length },
  ];
  return (
    <BookingTabs tabs={tabs} value={mode} onChange={setMode}>
      {mode === "rental" ? <QuadRental data={data} /> : <TourBooking tours={data.tours} />}
    </BookingTabs>
  );
}
