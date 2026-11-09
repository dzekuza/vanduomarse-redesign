import { Cta } from "@/components/cta";
import { toParkEvent, type ParkEventData } from "@/lib/park-events";
import { longDateLabel } from "@/lib/sauna";

export function ServiceSchedule({ wake, note, hasCalendar }: {
  wake?: ParkEventData[];
  note?: string;
  hasCalendar: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-copy">{note ?? (hasCalendar
        ? "Laisvas datas ir pasirinkimus rasi šio puslapio rezervacijos kalendoriuje."
        : "Užimtumą patikslinsime gavę norimą renginio datą, svečių skaičių ir informaciją apie erdvę.")}</p>
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
      <Cta small tone="dark" href="#rezervuoti">{hasCalendar ? "Rinktis datą" : "Susisiekti dėl datos"}</Cta>
    </div>
  );
}
