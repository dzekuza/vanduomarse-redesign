import { FilterChip } from "@/components/events/filter-chip";
import type { SessionRow } from "@/lib/reservation";

const SESSION_PROGRAMS = {
  common: "bendra-pirtis",
  women: "moteru-pirtis",
  men: "vyru-pirtis",
} as const;

export type SaunaFilter = "all" | "private" | "attendant" | "sessions" | keyof typeof SESSION_PROGRAMS;

const FILTERS: { id: Exclude<SaunaFilter, "attendant">; label: string }[] = [
  { id: "all", label: "Visi" },
  { id: "private", label: "Privati" },
  { id: "sessions", label: "Seansai" },
  { id: "common", label: "Bendra" },
  { id: "women", label: "Moterų" },
  { id: "men", label: "Vyrų" },
];

/** Match the published program IDs, which stay stable when staff edit the names. */
export function matchesSaunaFilter(row: SessionRow, filter: SaunaFilter): boolean {
  if (filter === "all") return true;
  if (filter === "private") return row.mode !== "session";
  if (filter === "attendant") return row.mode === "private" && row.programId === "privati-pirtis-su-programa";
  return row.mode === "session" && (filter === "sessions" || row.programId === SESSION_PROGRAMS[filter]);
}

export function SaunaFilters({ rows, filter, onChange }: {
  rows: SessionRow[];
  filter: SaunaFilter;
  onChange: (filter: SaunaFilter) => void;
}) {
  const privateActive = filter === "private" || filter === "attendant";
  const available = rows.filter((row) => !row.blocked);
  const count = (id: SaunaFilter) => available.filter((row) => matchesSaunaFilter(row, id)).length;

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Pirties tipai" className="flex flex-wrap gap-2">
        {FILTERS.map(({ id, label }) => (
          <FilterChip key={id} active={id === filter || (id === "private" && privateActive)} count={count(id)} onClick={() => onChange(id)}>
            {label}
          </FilterChip>
        ))}
      </div>
      {privateActive && (
        <div role="group" aria-label="Privačios pirties programa" className="flex flex-wrap gap-2">
          <FilterChip active={filter === "attendant"} count={count("attendant")} onClick={() => onChange(filter === "attendant" ? "private" : "attendant")}>
            Su pirtininku
          </FilterChip>
        </div>
      )}
    </div>
  );
}
