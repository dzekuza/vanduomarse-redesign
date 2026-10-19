"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { BOOKING_STATUS } from "@/lib/admin/labels";
import type { BookingStatus } from "@/lib/admin/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type KindFilter = "visos" | "pirtis" | "nakvyne";
export type WhenFilter = "busimos" | "praejusios" | "visos";

export interface BookingFilterState {
  kind: KindFilter;
  status: BookingStatus | "visos";
  when: WhenFilter;
  query: string;
}

interface BookingFiltersProps {
  value: BookingFilterState;
  onChange: (next: BookingFilterState) => void;
}

/** Type tabs, status and period selects, and a name/reference search. */
export function BookingFilters({ value, onChange }: BookingFiltersProps) {
  const set = <K extends keyof BookingFilterState>(k: K, v: BookingFilterState[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <Tabs value={value.kind} onValueChange={(v) => set("kind", v as KindFilter)}>
        <TabsList>
          <TabsTrigger value="visos" className="px-4">Visos</TabsTrigger>
          <TabsTrigger value="pirtis" className="px-4">Pirtis</TabsTrigger>
          <TabsTrigger value="nakvyne" className="px-4">Nakvynė</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select value={value.when} onValueChange={(v) => set("when", v as WhenFilter)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Laikotarpis">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="busimos">Būsimos</SelectItem>
            <SelectItem value="praejusios">Praėjusios</SelectItem>
            <SelectItem value="visos">Visos datos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={value.status} onValueChange={(v) => set("status", v as BookingFilterState["status"])}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Būsena">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visos">Visos būsenos</SelectItem>
            {(Object.keys(BOOKING_STATUS) as BookingStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {BOOKING_STATUS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative col-span-2 sm:w-64">
          <MagnifyingGlassIcon size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.query}
            onChange={(e) => set("query", e.target.value)}
            placeholder="Vardas, el. paštas ar nr."
            aria-label="Paieška"
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}
