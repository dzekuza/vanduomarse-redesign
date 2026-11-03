"use client";

import { ACTIVITY_TITLE, type ActivityId } from "@/lib/reservation";
import { ACTIVITY_ICON } from "./activity-icons";

interface ActivityTabsProps {
  ids: ActivityId[];
  active: ActivityId;
  /** Activities already in the plan get a coral dot. */
  included: ActivityId[];
  onChange: (id: ActivityId) => void;
}

/** Pirtis / Nakvynė / Keturračiai tab row; each tab edits one activity of the plan. */
export function ActivityTabs({ ids, active, included, onChange }: ActivityTabsProps) {
  return (
    <div role="tablist" aria-label="Veikla" className="flex border-y border-line">
      {ids.map((id) => {
        const Icon = ACTIVITY_ICON[id];
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
            className={`relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1.5 px-2 py-4 text-xs transition-colors duration-150 ease-out-strong sm:flex-row sm:gap-3 sm:px-8 sm:py-5 sm:text-sm ${
              on ? "bg-ink text-dust" : "hover:text-rust"
            }`}
          >
            <Icon size={22} aria-hidden />
            {ACTIVITY_TITLE[id]}
            {included.includes(id) ? <span aria-label="Įtraukta" className="absolute right-2 top-2 size-2 rounded-full bg-rust" /> : null}
          </button>
        );
      })}
    </div>
  );
}
