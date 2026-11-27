"use client";

import type { ManagedSpace } from "@/lib/space-booking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventSpaceSelectProps {
  id: string;
  /** Space id, or "" for none. */
  value: string;
  /** Active spaces plus the event's own one if it has since been switched off. */
  spaces: readonly ManagedSpace[];
  invalid?: boolean;
  onChange: (spaceId: string, space: ManagedSpace | undefined) => void;
}

/** Picks the event space (erdvė) an event books for its duration, or "Be erdvės" (ADR-0136). */
export function EventSpaceSelect({ id, value, spaces, invalid, onChange }: EventSpaceSelectProps) {
  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => {
        const next = v === "none" ? "" : v;
        onChange(next, spaces.find((s) => s.id === next));
      }}
    >
      <SelectTrigger id={id} className="min-h-11 w-full" aria-invalid={invalid}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Be erdvės</SelectItem>
        {spaces.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.active ? s.label : `${s.label} (išjungta)`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
