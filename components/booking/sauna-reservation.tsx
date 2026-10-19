"use client";

import { useMemo, useState } from "react";
import { BookingTabs } from "./booking-tabs";
import { SaunaBooking } from "./sauna-booking";
import { SaunaEventBooking } from "./sauna-event-booking";
import { EVENT_WINDOW_DAYS, openEventCount, startOfToday, upcomingEvents } from "@/lib/sauna-events";

export type SaunaMode = "private" | "event";

const TABS: { id: SaunaMode; label: string; hint: string; badge?: number }[] = [
  { id: "private", label: "Rezervuoti pirtį", hint: "Visa pirtis tavo grupei" },
  { id: "event", label: "Prisijungti prie renginio", hint: "Bilietas vienam žmogui" },
];

/** Pirtis Marse booking: private hire or a seat at a public session. */
export function SaunaReservation({ initialMode = "private" }: { initialMode?: SaunaMode }) {
  const [mode, setMode] = useState<SaunaMode>(initialMode);
  const openEvents = useMemo(() => openEventCount(upcomingEvents(startOfToday(), EVENT_WINDOW_DAYS)), []);
  const tabs = TABS.map((t) => (t.id === "event" ? { ...t, badge: openEvents } : t));

  return (
    <BookingTabs tabs={tabs} value={mode} onChange={setMode}>
      {mode === "private" ? <SaunaBooking /> : <SaunaEventBooking />}
    </BookingTabs>
  );
}
