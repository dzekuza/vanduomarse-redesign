import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const BOOKING_CHOICE_CLASS = "min-h-18 min-w-0 flex-col items-start justify-center gap-1 px-3 py-2 text-left wrap-anywhere";

/** Toggle chip of a filter row, with an optional count. Dark when active. */
export function FilterChip({ active, count, disabled, onClick, children, className, "aria-label": label }: { active: boolean; count?: number; disabled?: boolean; onClick: () => void; children: ReactNode; className?: string; "aria-label"?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center gap-2 border px-4 text-xs transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:enabled:active:scale-97 disabled:cursor-not-allowed",
        active ? "border-ink bg-ink text-dust" : "border-line enabled:hover:border-ink",
        className,
      )}
    >
      {children}
      {count === undefined ? null : <span className={cn("tabular-nums", active ? "text-dust/70" : "text-copy")}>{count}</span>}
    </button>
  );
}
