"use client";

import type { EventPreset } from "@/lib/event-pricing";

interface PresetPickerProps {
  presets: readonly EventPreset[];
  selected: string | null;
  onSelect: (id: string) => void;
}

/** Event types (editable in /admin/kainos); picking one pre-fills a typical setup. */
export function PresetPicker({ presets, selected, onSelect }: PresetPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => {
        const active = p.id === selected;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(p.id)}
            className={`min-h-11 border px-4 text-xs font-bold transition-[color,background-color,border-color,scale] duration-150 ease-out-strong motion-safe:active:scale-97 ${
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
