import { EVENT_CATEGORIES, type EventCategory } from "@/lib/park-events";

export function categoryLabel(id: EventCategory): string {
  return EVENT_CATEGORIES.find((c) => c.id === id)!.label;
}

/** Quiet label naming an event's category: a hairline box, the same as the reservation session tags. */
export function CategoryTag({ category }: { category: EventCategory }) {
  return <span className="inline-block border border-line px-2 py-0.5 text-micro uppercase">{categoryLabel(category)}</span>;
}
