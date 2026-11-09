"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { PlanDialog } from "./plan-dialog";
import { formatPlanPrice, RIDE_PLAN_CATEGORIES } from "@/lib/ride-plans";
import type { RidePlan, RidePlanCategory } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planai</CardTitle>
        <CardDescription>Katalogas, iš kurio pasirenkama skiltyje „Pardavimas“. Išjungtas planas dingsta iš sąrašo, bet esamiems naudotojams lieka.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={RIDE_PLAN_CATEGORIES[0]}>
          <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
            {RIDE_PLAN_CATEGORIES.map((category) => (
              <TabsTrigger key={category} value={category} className="min-h-11 shrink-0">
                {category}
                {byCategory.get(category)?.length ? ` (${byCategory.get(category)!.length})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
          {RIDE_PLAN_CATEGORIES.map((category) => {
            const plans = byCategory.get(category) ?? [];
            return (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="mb-3 flex justify-end">
                  <Button size="sm" className="min-h-9" onClick={() => setEditing({ category })}>
                    <PlusIcon size={18} /> Naujas planas
                  </Button>
                </div>
                <div className="divide-y">
                  {plans.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Šioje kategorijoje planų nėra.</p> : null}
                  {plans.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0">
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${p.active ? "" : "text-muted-foreground line-through"}`}>{p.name}</p>
                        {p.description ? <p className="truncate text-xs text-muted-foreground">{p.description}</p> : null}
                      </div>
                      <p className="shrink-0 font-display text-sm font-bold tabular-nums">{formatPlanPrice(p.price)}</p>
                      <Switch
                        checked={p.active}
                        aria-label={`Rodyti „${p.name}“`}
                        onCheckedChange={(v) => {
                          saveRidePlan({ ...p, active: v });
                          toast.success(v ? `${p.name}: rodomas` : `${p.name}: paslėptas`);
                        }}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${p.name}`}>
                            <DotsThreeIcon size={20} weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing({ plan: p, category })}>Redaguoti</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(p)}>
                            Ištrinti
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
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
