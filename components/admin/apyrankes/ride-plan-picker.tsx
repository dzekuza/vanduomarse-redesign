"use client";

import { useMemo } from "react";
import { useAdmin } from "../admin-store";
import { PlanGroupTabs } from "./plan-group-tabs";
import { formatPlanPrice, RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import type { RidePlan, RidePlanCategory } from "@/lib/admin/types";

interface RidePlanPickerProps {
  /** How many cart lines (sold or pending) reference each plan id — shown as a small count badge. */
  counts: Record<string, number>;
  /** Clicking a card always adds a new cart line, even for a plan already in the cart — the same plan can be sold to several customers in one session. */
  onAdd: (planId: string) => void;
}

/** Active plans as a 4-column grid of cards, grouped by tabs (Plaukimas with Bilietai / Abonementai, Įranga) — the till's own layout. */
export function RidePlanPicker({ counts: cartCounts, onAdd }: RidePlanPickerProps) {
  const { ridePlans } = useAdmin();

  const byCategory = useMemo(() => {
    const map = new Map<RidePlanCategory, RidePlan[]>();
    for (const category of RIDE_PLAN_CATEGORIES) map.set(category, []);
    for (const plan of ridePlans) if (plan.active) map.get(plan.category)?.push(plan);
    return map;
  }, [ridePlans]);

  const counts = useMemo(() => new Map([...byCategory].map(([category, plans]) => [category, plans.length])), [byCategory]);

  if ([...counts.values()].every((n) => n === 0)) return <p className="text-sm text-muted-foreground">Aktyvių planų nėra.</p>;

  return (
    <PlanGroupTabs counts={counts} hideEmpty flat>
      {(category) => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {byCategory.get(category)!.map((p) => {
            const count = cartCounts[p.id] ?? 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onAdd(p.id)}
                className="relative flex min-h-20 flex-col justify-between gap-2 rounded-lg border border-border p-3 text-start transition-colors hover:border-primary hover:bg-muted"
              >
                {count > 0 ? (
                  <span className="absolute top-2 right-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {count}
                  </span>
                ) : null}
                <span className="pr-5 text-sm font-bold">{p.name}</span>
                <span className="text-sm font-normal text-muted-foreground">{formatPlanPrice(p.price)}</span>
              </button>
            );
          })}
        </div>
      )}
    </PlanGroupTabs>
  );
}
