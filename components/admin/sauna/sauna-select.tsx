"use client";

import { useAdmin } from "../admin-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SaunaSelectProps {
  id?: string;
  value: string;
  onChange: (saunaId: string) => void;
  className?: string;
  invalid?: boolean;
}

/** Picks one of the saunas (hidden ones too, marked), for staff-side screens. */
export function SaunaSelect({ id, value, onChange, className = "w-full", invalid }: SaunaSelectProps) {
  const { saunas } = useAdmin();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={className} aria-invalid={invalid} aria-label={id ? undefined : "Pirtis"}>
        <SelectValue placeholder="Pasirinkite pirtį" />
      </SelectTrigger>
      <SelectContent>
        {saunas.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
            {s.active ? null : <span className="text-muted-foreground">{s.comingSoon ? " (netrukus)" : " (paslėpta)"}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
