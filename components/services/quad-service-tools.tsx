"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { QuadServiceBooking } from "@/components/quads/quad-service-booking";
import type { QuadPageData } from "@/lib/data/public-types";
import { QuadSchedule } from "./quad-schedule";

const QuadDay = createContext<{
  data: QuadPageData;
  day: string | null;
  onDayChange: (day: string) => void;
} | null>(null);

export function QuadServiceTools({ data, children }: { data: QuadPageData; children: ReactNode }) {
  const [day, setDay] = useState<string | null>(null);
  return (
    <QuadDay.Provider value={{ data, day, onDayChange: (next) => setDay(next || null) }}>
      {children}
    </QuadDay.Provider>
  );
}

function useQuadDay() {
  const selection = useContext(QuadDay);
  if (!selection) throw new Error("Quad service controls require QuadServiceTools");
  return selection;
}

export function QuadServiceSidebar() {
  return <QuadServiceBooking {...useQuadDay()} />;
}

export function QuadServiceSchedule() {
  const { data, day, onDayChange } = useQuadDay();
  return <QuadSchedule data={data} day={day ?? data.today} onDayChange={onDayChange} />;
}
