"use client";

import { SPACES, type SpaceId } from "@/lib/event-pricing";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SpacePickerProps {
  value: readonly SpaceId[];
  onChange: (next: SpaceId[]) => void;
  /** Spaces already hired in the chosen window, shown as taken and not selectable. */
  taken: ReadonlySet<SpaceId>;
  invalid?: boolean;
}

/** Several spaces can be ticked at once (e.g. the dome and the terrace for one party). */
export function SpacePicker({ value, onChange, taken, invalid }: SpacePickerProps) {
  const toggle = (id: SpaceId, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));
  return (
    <fieldset aria-invalid={invalid} className="grid gap-2 sm:grid-cols-2">
      <legend className="sr-only">Erdvės</legend>
      {SPACES.map((s) => {
        const busy = taken.has(s.id);
        const checked = value.includes(s.id);
        return (
          <label
            key={s.id}
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary",
              checked && "border-primary bg-muted",
              busy && "pointer-events-none opacity-50",
            )}
          >
            <Checkbox className="mt-0.5" checked={checked} disabled={busy} onCheckedChange={(c) => toggle(s.id, c === true)} />
            <span className="min-w-0">
              <span className="block text-sm font-bold">{s.label}</span>
              <span className="block text-xs text-muted-foreground">{busy ? "Šiuo laiku užimta" : `Iki ${s.maxGuests} asm.`}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
