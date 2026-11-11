import { cn } from "@/lib/utils";

export function AvailabilityCount({ free, capacity, showDot, binary = false }: { free: number; capacity?: number; showDot?: boolean; binary?: boolean }) {
  // Keep the status color when a SelectItem applies its focus color to descendants.
  const [dot, text] = free === 0 ? ["bg-rust", "text-rust-ink! group-aria-pressed/day:text-rust!"]
    : !binary && free <= 2 ? ["bg-signal", "text-availability-low-ink! group-aria-pressed/day:text-signal!"]
    : ["bg-availability-open", "text-availability-open! group-aria-pressed/day:text-availability-open-on-ink!"];

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center justify-center gap-x-1 gap-y-0.5 font-bold tabular-nums">
      {showDot ? <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full ring-1 ring-current/20", dot)} /> : null}
      <span className={cn("whitespace-nowrap", text)}>{capacity ? `${free}/${capacity}` : free}</span>
    </span>
  );
}
