import { Cta } from "@/components/cta";
import { toParkEvent, type ParkEventData } from "@/lib/park-events";
import { longDateLabel } from "@/lib/sauna";

interface ScheduleProps {
  wake?: ParkEventData[];
  /** Overrides the default sentence above the list. */
  note?: string;
}

interface ScheduleBodyProps extends ScheduleProps {
  note: string;
  ctaLabel: string;
}

function ScheduleBody({ wake, note, ctaLabel }: ScheduleBodyProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-copy">{note}</p>
      {wake && (wake.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {wake.map((entry) => {
            const event = toParkEvent(entry);
            return (
              <li key={event.key} className="py-3">
                <p className="text-micro text-copy">{longDateLabel(event.date)} · {event.time}</p>
                <h3 className="mt-1 text-sm font-bold">{event.title}</h3>
              </li>
            );
          })}
        </ul>
      ) : <p className="text-sm text-copy">Marso Akademijos renginių kol kas nepaskelbta.</p>)}
      <Cta small tone="dark" href="#rezervuoti">{ctaLabel}</Cta>
    </div>
  );
}

/** For services with a booking calendar on the page: points to it. */
export function CalendarSchedule({ wake, note }: ScheduleProps) {
  return <ScheduleBody wake={wake} note={note ?? "Laisvas datas ir pasirinkimus rasi šio puslapio rezervacijos kalendoriuje."} ctaLabel="Rinktis datą" />;
}

/** For services booked by inquiry: availability is confirmed after the request. */
export function InquirySchedule({ wake, note }: ScheduleProps) {
  return <ScheduleBody wake={wake} note={note ?? "Užimtumą patikslinsime gavę norimą renginio datą, svečių skaičių ir informaciją apie erdvę."} ctaLabel="Susisiekti dėl datos" />;
}
