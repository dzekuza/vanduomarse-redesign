"use client";

import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { Button } from "@/components/ui/button";
import type { ManagedEvent } from "@/lib/admin/types";

/**
 * Places staff keep for themselves on a limited event (family, friends) without a booking: the site shows them as taken,
 * and the checkout cannot sell them. Only for events with a place limit; quad tour departures count quads instead.
 */
export function HeldSpots({ event }: { event: ManagedEvent }) {
  const { setEventHeld } = useAdmin();
  const [busy, setBusy] = useState(false);
  if (event.capacity === null || event.tourRouteId) return null;

  const free = Math.max(0, event.capacity - event.sold - event.held);

  async function change(next: number) {
    setBusy(true);
    try {
      const result = await setEventHeld(event.id, next);
      if ("data" in result) toast.success(next === 0 ? "Rankiniu būdu užimtų vietų nebėra" : `Rankiniu būdu užimta vietų: ${next}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2 border p-3" aria-labelledby="held-spots-title">
      <h3 id="held-spots-title" className="text-sm font-medium">
        Užimta rankiniu būdu
      </h3>
      <p className="text-xs text-muted-foreground">Šeimai, draugams ar kitiems, kam nereikia rezervacijos. Svetainėje šios vietos rodomos kaip užimtos.</p>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="size-11" aria-label="Mažiau užimtų vietų" disabled={busy || event.held === 0} onClick={() => void change(event.held - 1)}>
          <MinusIcon size={18} />
        </Button>
        <span className="min-w-8 text-center text-lg font-bold tabular-nums" aria-live="polite">
          {event.held}
        </span>
        <Button variant="outline" size="icon" className="size-11" aria-label="Daugiau užimtų vietų" disabled={busy || free === 0} onClick={() => void change(event.held + 1)}>
          <PlusIcon size={18} />
        </Button>
        <p className="ml-auto text-right text-xs text-muted-foreground tabular-nums">
          Laisva svetainėje: {free} iš {event.capacity}
        </p>
      </div>
    </section>
  );
}
