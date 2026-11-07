"use client";

import { useAdmin } from "../admin-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RiderSelectProps {
  value: string | null;
  onChange: (riderId: string) => void;
  label?: string;
}

/** Picks an existing rider by name — used where a plan or bracelet targets someone already registered. */
export function RiderSelect({ value, onChange, label = "Naudotojas" }: RiderSelectProps) {
  const { riders } = useAdmin();
  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={riders.length === 0}>
      <SelectTrigger aria-label={label} className="min-h-11 w-full">
        <SelectValue placeholder="Pasirinkite naudotoją" />
      </SelectTrigger>
      <SelectContent>
        {riders.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.name} {r.surname}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
