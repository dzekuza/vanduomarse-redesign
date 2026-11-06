import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Toggle chip of a filter row, with an optional count. Dark when active. */
export function FilterChip({ active, count, onClick, children, className }: { active: boolean; count?: number; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center gap-2 border px-4 text-xs transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97",
        active ? "border-ink bg-ink text-dust" : "border-line hover:border-ink",
        className,
      )}
    >
      {children}
      {count === undefined ? null : <span className={cn("tabular-nums", active ? "text-dust/70" : "text-copy")}>{count}</span>}
    </button>
  );
}
