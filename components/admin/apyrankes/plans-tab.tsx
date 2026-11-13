"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useAdmin } from "../admin-store";
import { PlanCard } from "./plan-card";
import { PlanDialog } from "./plan-dialog";
import { PlanGroupTabs } from "./plan-group-tabs";
import { RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import type { RidePlan, RidePlanCategory } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Editing = { plan?: RidePlan; category: RidePlanCategory } | null;

/** The plan catalogue sold in /admin/apyrankes, grouped by the till's category tabs. */
export function PlansTab() {
  const { ridePlans, saveRidePlan, deleteRidePlan } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<RidePlan | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<RidePlanCategory, RidePlan[]>();
    for (const category of RIDE_PLAN_CATEGORIES) map.set(category, []);
    for (const plan of ridePlans) map.get(plan.category)?.push(plan);
    return map;
  }, [ridePlans]);
  const counts = useMemo(() => new Map([...byCategory].map(([category, plans]) => [category, plans.length])), [byCategory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planai</CardTitle>
        <CardDescription>Katalogas, iš kurio pasirenkama skiltyje „Pardavimas“. Išjungtas planas dingsta iš sąrašo, bet esamiems naudotojams lieka.</CardDescription>
      </CardHeader>
      <CardContent>
        <PlanGroupTabs counts={counts}>
          {(category) => {
            const plans = byCategory.get(category) ?? [];
            return (
              <>
              <div className="mb-3 flex justify-end">
                <Button size="sm" className="min-h-9" onClick={() => setEditing({ category })}>
                  <PlusIcon size={18} /> Naujas planas
                </Button>
              </div>
              {plans.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Šioje kategorijoje planų nėra.</p> : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {plans.map((p) => (
                  <PlanCard key={p.id} plan={p} onSave={saveRidePlan} onEdit={() => setEditing({ plan: p, category })} onDelete={() => setDeleting(p)} />
                ))}
              </div>
              </>
            );
          }}
        </PlanGroupTabs>
      </CardContent>

      {editing ? <PlanDialog key={editing.plan?.id ?? `new-${editing.category}`} plan={editing.plan} defaultCategory={editing.category} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Jei šiuo planu dar naudojasi naudotojai, ištrinti nepavyks; tokį verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleting) return;
                const result = await deleteRidePlan(deleting.id);
                if ("data" in result) setDeleting(null);
              }}
            >
              Ištrinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
