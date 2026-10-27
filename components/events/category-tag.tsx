import { EVENT_CATEGORIES, type EventCategory } from "@/lib/park-events";

const TONE: Record<EventCategory, string> = {
  pirtis: "bg-rust text-foam",
  vakarai: "bg-ink text-foam",
  akademija: "bg-lake text-ink",
  sventes: "border border-ink text-ink",
  keturratis: "bg-lake-soft text-foam",
};

export function categoryLabel(id: EventCategory): string {
  return EVENT_CATEGORIES.find((c) => c.id === id)!.label;
}

/** Small uppercase chip naming an event's category, coloured per category. */
export function CategoryTag({ category }: { category: EventCategory }) {
  return <span className={`inline-block px-2 py-0.5 text-xs font-semibold uppercase ${TONE[category]}`}>{categoryLabel(category)}</span>;
}
