"use client";

import { useAdmin } from "../admin-store";
import { formatPlanPrice } from "@/lib/ride-plans";
import { cn } from "@/lib/utils";

/** A rider's plan by id, live — renames reflect immediately. */
export function PlanBadge({ planId, className }: { planId: string | null; className?: string }) {
  const { ridePlans } = useAdmin();
  const plan = ridePlans.find((p) => p.id === planId);

  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground", className)}>
      {plan?.name ?? "Nėra plano"}
      {plan ? <span className="font-normal text-muted-foreground">· {formatPlanPrice(plan.price)}</span> : null}
    </span>
  );
}
