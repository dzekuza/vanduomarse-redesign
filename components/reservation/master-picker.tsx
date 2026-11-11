"use client";

import { OptionGroupLabel } from "./option-card";
import { masterOptionLabel, type SaunaMaster } from "@/lib/sauna-masters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NONE = "none";

interface MasterPickerProps {
  masters: readonly SaunaMaster[];
  /** Chosen pirtininkas id, or null for none. */
  value: string | null;
  onChange: (id: string | null) => void;
  /** Shown under the box, e.g. "Su pirtininku – mažiausiai 3 val." */
  note?: string;
}

/** "Be pirtininko" or one of the pirtininkai, each with his price; renders nothing when none are on offer. */
export function MasterPicker({ masters, value, onChange, note }: MasterPickerProps) {
  if (masters.length === 0) return null;
  return (
    <div>
      <OptionGroupLabel>Pirtininkas</OptionGroupLabel>
      <Select value={value ?? NONE} onValueChange={(next) => onChange(next === NONE ? null : next)}>
        <SelectTrigger aria-label="Pirtininkas" className="w-full rounded-none border-line bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={NONE} className="min-h-11">
            Be pirtininko
          </SelectItem>
          {masters.map((m) => (
            <SelectItem key={m.id} value={m.id} className="min-h-11">
              {masterOptionLabel(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {note ? <p className="mt-2 text-sm text-copy">{note}</p> : null}
    </div>
  );
}
