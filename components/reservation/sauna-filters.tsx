import { FilterChip } from "@/components/events/filter-chip";
import type { SessionRow } from "@/lib/reservation";

export type SaunaFilter = "private" | "sessions";

const FILTERS: { id: SaunaFilter; label: string }[] = [
  { id: "private", label: "Privati pirtis" },
  { id: "sessions", label: "Seansai" },
];

export function matchesSaunaFilter(row: SessionRow, filter: SaunaFilter): boolean {
  return row.mode === (filter === "private" ? "private" : "session");
}

/** The two ways to book the sauna, the same split as the single /pirtis page: a private sauna or a place in a session. */
export function SaunaFilters({ rows, filter, onChange }: {
  rows: SessionRow[];
  filter: SaunaFilter;
  onChange: (filter: SaunaFilter) => void;
}) {
  const available = rows.filter((row) => !row.blocked);
  const count = (id: SaunaFilter) => available.filter((row) => matchesSaunaFilter(row, id)).length;

  return (
    <div role="group" aria-label="Pirties tipai" className="flex flex-wrap gap-2 p-px">
      {FILTERS.map(({ id, label }) => (
        <FilterChip key={id} active={id === filter} count={count(id)} onClick={() => onChange(id)} className="shrink-0 whitespace-nowrap">
          {label}
        </FilterChip>
      ))}
    </div>
  );
}
