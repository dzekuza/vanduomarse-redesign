import type { ReactNode } from "react";

export const SCHEDULE_DAY_CARD = "block min-h-11 w-full space-y-1 border border-line bg-foam p-1.5 text-left text-ink hover:border-ink";

/** Full event cards fit in the month grid when the schedule column is wide enough. */
export function ScheduleDayCards({ children }: { children: ReactNode }) {
  return (
    <div className="hidden space-y-1 px-1 pb-1 text-micro leading-tight tracking-normal @lg/schedule:block">
      {children}
    </div>
  );
}
