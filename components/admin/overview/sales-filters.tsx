"use client";

import { SALE_CATEGORIES, type SaleCategory, type SaleFilters } from "@/lib/admin/sales";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesFiltersProps {
  value: SaleFilters;
  onChange: (next: SaleFilters) => void;
}

/** Category tabs for the sales section; the dates are always all of them. */
export function SalesFilters({ value, onChange }: SalesFiltersProps) {
  return (
    <Tabs value={value.category} onValueChange={(v) => onChange({ ...value, category: v as SaleCategory | "visos" })}>
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
  );
}
