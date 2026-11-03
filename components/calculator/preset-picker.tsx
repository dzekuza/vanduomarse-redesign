"use client";

import { PRESETS, type PresetId } from "@/lib/event-pricing";

interface PresetPickerProps {
  selected: PresetId | null;
  onSelect: (id: PresetId) => void;
}

/** Event types from the price sheet; picking one pre-fills a typical setup. */
export function PresetPicker({ selected, onSelect }: PresetPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => {
        const active = p.id === selected;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(p.id)}
            className={`min-h-11 border px-4 text-xs font-bold tracking-tight transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 ${
              active ? "border-ink bg-ink text-dust" : "border-line text-ink hover:border-ink"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
