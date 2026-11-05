import type { PlanLine } from "@/lib/reservation";

/** Static review reused before registration and after completing a design preview. */
export function PlanSummary({ lines, total, compact = false }: { lines: PlanLine[]; total: number; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((line) => (
          <li key={line.id} className={compact ? "space-y-1 py-3 text-xs" : "space-y-2 py-4 text-sm"}>
            <div className="flex items-baseline justify-between gap-4 font-bold">
              <p className="min-w-0">{line.title}</p>
              <p className="shrink-0">{line.price} €</p>
            </div>
            <p className="text-copy">{line.detail}</p>
            <p className="text-copy">{line.schedule}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-micro uppercase text-copy">Iš viso, su PVM</span>
        <span className="text-total font-bold">{total} €</span>
      </div>
    </div>
  );
}
