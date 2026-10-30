"use client";

import { useMemo, useState } from "react";
import { BookingTabs } from "./booking-tabs";
import { SaunaBooking } from "./sauna-booking";
import { SaunaEventBooking } from "./sauna-event-booking";
import type { SaunaPageData } from "@/lib/data/public-types";
import { openEventCount, toSaunaEvent } from "@/lib/sauna-events";

export type SaunaMode = "private" | "event";

const TABS: { id: SaunaMode; label: string; hint: string; badge?: number }[] = [
  { id: "private", label: "Rezervuoti pirtį", hint: "Visa pirtis tavo grupei" },
  { id: "event", label: "Prisijungti prie renginio", hint: "Bilietas vienam žmogui" },
];

interface SaunaReservationProps {
  initialMode?: SaunaMode;
  data: SaunaPageData;
  days: number;
}

/** Pirtis Marse booking: private hire or a seat at a public session. */
export function SaunaReservation({ initialMode = "private", data, days }: SaunaReservationProps) {
  const [mode, setMode] = useState<SaunaMode>(initialMode);
  const events = useMemo(() => data.events.map(toSaunaEvent), [data.events]);
  const tabs = TABS.map((t) => (t.id === "event" ? { ...t, badge: openEventCount(events) } : t));

  return (
    <BookingTabs tabs={tabs} value={mode} onChange={setMode}>
      {mode === "private" ? (
        <SaunaBooking today={data.today} nowHour={data.nowHour} days={days} rates={data.rates} upsells={data.upsells} takenByDay={data.takenByDay} />
      ) : (
        <SaunaEventBooking events={events} />
      )}
    </BookingTabs>
  );
}
