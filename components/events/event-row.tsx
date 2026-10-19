import { ArrowLink } from "@/components/arrow-link";
import { CategoryTag } from "./category-tag";
import { longDateLabel, weekdayLabel } from "@/lib/sauna";
import type { ParkEvent } from "@/lib/park-events";

/** One event in the Renginiai feed: date block, details, price and call to action. */
export function EventRow({ event }: { event: ParkEvent }) {
  const full = event.spotsLeft === 0;
  return (
    <article className="grid grid-cols-[4rem_1fr] gap-x-5 gap-y-4 border border-ink bg-foam px-5 py-5 md:grid-cols-[4.5rem_1fr_auto] md:items-center">
      <div className="flex flex-col items-center border-r border-ink/25 pr-5">
        <span className="text-xs">{weekdayLabel(event.date)}</span>
        <span className="font-display text-3xl font-bold leading-none">{event.date.getDate()}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryTag category={event.category} />
          <span className="text-sm text-ink/60">
            {longDateLabel(event.date)}, {event.time} · {event.place}
          </span>
        </div>
        <h3 className="font-display mt-2 text-lg font-bold leading-tight">{event.title}</h3>
        <p className="mt-1 max-w-xl text-sm text-ink/70">{event.blurb}</p>
        {event.spotsLeft !== undefined ? (
          <p className={`mt-2 text-xs ${full ? "text-ink/50" : "text-rust"}`}>
            {full ? "Vietų nebeliko" : `Liko vietų: ${event.spotsLeft}`}
          </p>
        ) : null}
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-ink/25 pt-4 md:col-span-1 md:flex-col md:items-end md:border-0 md:pt-0">
        <p className="font-display text-lg font-bold md:text-xl">{event.price === null ? "Nemokamai" : `${event.price} €`}</p>
        {full ? (
          <span className="px-4 py-2 text-xs uppercase text-ink/40">Išparduota</span>
        ) : (
          <ArrowLink href={event.cta.href} size="sm">
            {event.cta.label}
          </ArrowLink>
        )}
      </div>
    </article>
  );
}
