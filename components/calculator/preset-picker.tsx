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
            className={`min-h-11 border border-ink px-4 text-sm uppercase transition-[color,background-color,transform] active:scale-[0.97] ${
              active ? "bg-ink text-foam" : "text-ink hover:bg-dust-soft"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
