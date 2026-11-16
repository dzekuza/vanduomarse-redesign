"use client";

import {
  SALE_CATEGORIES,
  SALE_ORIGIN_LABEL,
  type SaleCategory,
  type SaleFilters,
  type SaleOrigin,
} from "@/lib/admin/sales";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesFiltersProps {
  value: SaleFilters;
  onChange: (next: SaleFilters) => void;
}

const ORIGINS: { id: SaleOrigin | "visi"; label: string }[] = [
  { id: "visi", label: "Visi" },
  { id: "internetu", label: SALE_ORIGIN_LABEL.internetu },
  { id: "admin", label: SALE_ORIGIN_LABEL.admin },
];

/** Category tabs and an origin switch (site vs entered by staff) for the sales section; the dates are always all of them. */
export function SalesFilters({ value, onChange }: SalesFiltersProps) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Tabs
        value={value.category}
        onValueChange={(v) =>
          onChange({ ...value, category: v as SaleCategory | "visos" })
        }
      >
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="visos" className="min-h-11 px-4">
            Visi
          </TabsTrigger>
          {SALE_CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="min-h-11 px-4">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Tabs
        className="w-full sm:w-auto"
        value={value.origin}
        onValueChange={(v) =>
          onChange({ ...value, origin: v as SaleOrigin | "visi" })
        }
      >
        <TabsList
          aria-label="Kas įvedė pardavimą"
          className="grid h-auto w-full grid-cols-3 sm:inline-flex sm:w-auto"
        >
          {ORIGINS.map((o) => (
            <TabsTrigger key={o.id} value={o.id} className="min-h-11 px-4">
              {o.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
