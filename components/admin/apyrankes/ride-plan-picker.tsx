"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { formatPlanPrice, RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import type { RidePlan, RidePlanCategory } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RidePlanPickerProps {
  value: string;
  onChange: (planId: string) => void;
}

/** Active plans as a 4-column grid of cards, grouped by category tabs — the till's own layout. */
export function RidePlanPicker({ value, onChange }: RidePlanPickerProps) {
  const { ridePlans } = useAdmin();

  const byCategory = useMemo(() => {
    const map = new Map<RidePlanCategory, RidePlan[]>();
    for (const category of RIDE_PLAN_CATEGORIES) map.set(category, []);
    for (const plan of ridePlans) if (plan.active) map.get(plan.category)?.push(plan);
    return map;
  }, [ridePlans]);

  const categories = RIDE_PLAN_CATEGORIES.filter((c) => (byCategory.get(c)?.length ?? 0) > 0);
  const selectedPlan = ridePlans.find((p) => p.id === value);
  const [tab, setTab] = useState(selectedPlan?.category ?? categories[0] ?? RIDE_PLAN_CATEGORIES[0]);

  if (categories.length === 0) return <p className="text-sm text-muted-foreground">Aktyvių planų nėra.</p>;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as RidePlanCategory)}>
      <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category} className="min-h-10 shrink-0">
            {category} ({byCategory.get(category)!.length})
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category) => (
        <TabsContent key={category} value={category} className="mt-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {byCategory.get(category)!.map((p) => {
              const selected = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange(p.id)}
                  aria-pressed={selected}
                  className={cn(
                    "relative flex min-h-20 flex-col justify-between gap-2 rounded-lg border p-3 text-start transition-colors",
                    selected ? "border-primary bg-accent" : "border-border hover:bg-muted",
                  )}
                >
                  {selected ? <CheckIcon size={16} className="absolute top-2.5 right-2.5 text-primary" /> : null}
                  <span className="pr-5 text-sm font-bold">{p.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">{formatPlanPrice(p.price)}</span>
                </button>
              );
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
