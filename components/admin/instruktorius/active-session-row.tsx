"use client";

import { RiderAvatar } from "../apyrankes/rider-avatar";
import { PlanBadge } from "../apyrankes/plan-badge";
import { useElapsed } from "@/hooks/use-elapsed";
import type { Rider, RiderSession } from "@/lib/admin/types";

/** One rider currently out on the water: avatar, contact, plan and a live-ticking session timer. */
export function ActiveSessionRow({ rider, session }: { rider: Rider; session: RiderSession }) {
  const elapsed = useElapsed(session.startedAt, session.endedAt);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
      <RiderAvatar name={rider.name} surname={rider.surname} avatarPath={rider.avatarPath} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {rider.name} {rider.surname}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <PlanBadge planId={rider.planId} />
          {rider.phone ? <span className="text-xs text-muted-foreground">{rider.phone}</span> : null}
        </div>
      </div>
      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-primary">{elapsed}</span>
    </div>
  );
}
