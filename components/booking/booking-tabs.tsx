"use client";

import { useId } from "react";

interface Tab<T extends string> {
  id: T;
  label: string;
  hint: string;
  /** Optional count bubble, e.g. open events. Hidden when 0 or absent. */
  badge?: number;
}

interface BookingTabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  children: React.ReactNode;
}

/** Segmented tabs sitting on top of a booking card, live-site outlined style. */
export function BookingTabs<T extends string>({ tabs, value, onChange, children }: BookingTabsProps<T>) {
  const baseId = useId();

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    onChange(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Rezervacijos tipas" className="grid grid-cols-2">
        {tabs.map((tab, i) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${baseId}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px border border-ink px-4 py-4 text-left transition-colors sm:px-6 [&+&]:-ml-px ${
                active ? "bg-ink text-foam" : "bg-dust text-ink hover:bg-dust-soft"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold uppercase">
                {tab.label}
                {tab.badge ? <CountBadge count={tab.badge} /> : null}
              </span>
              <span className={`mt-0.5 block text-xs ${active ? "text-foam/70" : "text-ink/60"}`}>{tab.hint}</span>
            </button>
          );
        })}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${value}`}>
        {children}
      </div>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`Laisvų renginių: ${count}`}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rust px-1.5 text-xs font-bold tabular-nums text-foam"
    >
      {count}
    </span>
  );
}
