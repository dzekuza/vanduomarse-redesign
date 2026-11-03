"use client";

import { UPSELL_UNIT_SHORT, upsellMax, upsellTotal, type Upsell } from "@/lib/sauna-upsells";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface BookingExtrasFieldsProps {
  upsells: Upsell[];
  quantities: Record<string, number>;
  onChange: (id: string, qty: number) => void;
  partySize: number;
  hours: number;
}

/** Active sauna extras for a manual booking: switches, or −/+ for counted items. */
export function BookingExtrasFields({ upsells, quantities, onChange, partySize, hours }: BookingExtrasFieldsProps) {
  const active = upsells.filter((u) => u.active);
  if (!active.length) return null;
  return (
    <fieldset className="space-y-1 sm:col-span-2">
      <legend className="mb-1 text-sm font-normal">Papildomai</legend>
      {active.map((u) => {
        const qty = quantities[u.id] ?? 0;
        const max = upsellMax(u, partySize);
        return (
          <div key={u.id} className="flex min-h-11 items-center justify-between gap-3 border-b py-1 last:border-0">
            <div className="min-w-0">
              <p className="truncate text-sm">{u.name}</p>
              <p className="text-xs text-muted-foreground">
                {u.price} {UPSELL_UNIT_SHORT[u.unit]}
                {qty > 0 && u.unit !== "rezervacijai" ? ` · ${upsellTotal(u, qty, { partySize, hours })} €` : ""}
              </p>
            </div>
            {u.unit === "vienetui" ? (
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="outline" size="icon-sm" aria-label={`Mažiau: ${u.name}`} disabled={qty <= 0} onClick={() => onChange(u.id, qty - 1)}>
                  −
                </Button>
                <span className="w-8 text-center tabular-nums">{qty}</span>
                <Button type="button" variant="outline" size="icon-sm" aria-label={`Daugiau: ${u.name}`} disabled={qty >= max} onClick={() => onChange(u.id, qty + 1)}>
                  +
                </Button>
              </div>
            ) : (
              <Switch checked={qty > 0} aria-label={u.name} onCheckedChange={(on) => onChange(u.id, on ? 1 : 0)} />
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
