"use client";

import type { ManagedSpace } from "@/lib/space-booking";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SpacePickerProps {
  /** Active spaces (from `public.spaces`), in display order. */
  spaces: readonly ManagedSpace[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  /** Spaces already hired in the chosen window, shown as taken and not selectable. */
  taken: ReadonlySet<string>;
  invalid?: boolean;
}

/** Several spaces can be ticked at once (e.g. the dome and the terrace for one party). */
export function SpacePicker({ spaces, value, onChange, taken, invalid }: SpacePickerProps) {
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));
  return (
    <fieldset aria-invalid={invalid} className="grid gap-2 sm:grid-cols-2">
      <legend className="sr-only">Erdvės</legend>
      {spaces.length === 0 ? <p className="text-sm text-muted-foreground">Erdvių nėra: pridėkite jas skiltyje Erdvės.</p> : null}
      {spaces.map((s) => {
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
