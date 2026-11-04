"use client";

import type { DayIcon } from "@/components/booking/day-picker";
import { Stepper } from "@/components/booking/stepper";
import { MAX_PEOPLE } from "@/lib/reservation";
import { DatePicker } from "./date-picker";

interface WhenStepProps {
  days: Date[];
  date: Date;
  onDate: (date: Date) => void;
  /** Availability icons under each day. */
  icons: (date: Date) => DayIcon[];
  people: number;
  onPeople: (people: number) => void;
  showPeople: boolean;
}

const Heading = ({ children }: { children: string }) => <p className="mb-3 text-micro uppercase text-copy">{children}</p>;

/** Day and group size, always visible above the form. Start times are chosen per activity. */
export function WhenStep({ days, date, onDate, icons, people, onPeople, showPeople }: WhenStepProps) {
  return (
    <section aria-label="Data ir svečiai" className="space-y-6">
      <div className="min-w-0">
        <DatePicker days={days} selected={date} onSelect={onDate} icons={icons} />
      </div>
      {showPeople ? <div>
        <Heading>Kiek jūsų</Heading>
        <Stepper label="Žmonių (su vaikais)" value={people} onChange={onPeople} min={1} max={MAX_PEOPLE} editable />
      </div> : null}
    </section>
  );
}
