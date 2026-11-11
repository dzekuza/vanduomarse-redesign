"use client";

import { WavesIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ACTIVITY_TITLE, type ActivityId } from "@/lib/reservation";
import { ACTIVITY_ICON } from "./activity-icons";

export type ReservationTab = ActivityId | "wake";

interface ActivityTabsProps {
  ids: ReservationTab[];
  active: ReservationTab;
  /** Activities already in the plan get a coral dot. */
  included: ActivityId[];
  /** A separate dialog trigger for each segment. */
  renderDetails: (id: ActivityId, active: boolean) => ReactNode;
  onChange: (id: ReservationTab) => void;
}

/** Pirtis / Nakvynė / Keturračiai tab row; each tab edits one activity of the plan. */
export function ActivityTabs({ ids, active, included, renderDetails, onChange }: ActivityTabsProps) {
  return (
    <div role="tablist" aria-label="Veikla" className="flex divide-x divide-line border border-line">
      {ids.map((id) => {
        const Icon = id === "wake" ? WavesIcon : ACTIVITY_ICON[id];
        const on = id === active;
        return (
          <div key={id} className={`flex min-w-0 flex-1 flex-col sm:flex-row ${on ? "bg-ink text-dust" : "text-ink"}`}>
            <button
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(id)}
              className={`relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1.5 px-1 pt-3 pb-0 text-center text-xs transition-colors duration-150 ease-out-strong sm:flex-row sm:gap-2 sm:px-2 sm:py-5 sm:text-sm ${
                on ? "" : "hover:text-rust"
              }`}
            >
              <span aria-hidden className="shrink-0"><Icon size={22} /></span>
              <span className="min-w-0 max-w-full wrap-break-word">{id === "wake" ? "WAKE" : ACTIVITY_TITLE[id]}</span>
              {id !== "wake" && included.includes(id) ? <span aria-label="Įtraukta" className="absolute right-2 top-2 size-2 rounded-full bg-rust" /> : null}
            </button>
            {id !== "wake" && renderDetails(id, on)}
          </div>
        );
      })}
    </div>
  );
}
