"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { formatEur } from "@/lib/admin/format";
import type { ManagedSpace } from "@/lib/space-booking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const price = (n: number | null) => (n === null ? "nenuomojama" : formatEur(n));

/** Every event space with its capacity and rent, an "offered" switch and edit. Spaces are switched off, never deleted. */
export function SpacesCard({ onEdit }: { onEdit: (space: ManagedSpace) => void }) {
  const { spaces, saveSpace } = useAdmin();

  const toggle = async (s: ManagedSpace, active: boolean) => {
    const { id, label, blurb, maxGuests, priceWeekday, priceWeekend, wholePark, sortOrder } = s;
    const result = await saveSpace({ id, label, blurb, maxGuests, priceWeekday, priceWeekend, wholePark, active, sortOrder });
    if ("data" in result) toast.success(active ? `${label}: nuomojama` : `${label}: išjungta`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erdvės ir kainos</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        <p className="pb-3 text-xs text-muted-foreground">
          Kainos su PVM, už nuomą. Pirma kaina – I–IV dieną (pradžia iki 17:00), antra – vakare ir V–VII. Išjungta erdvė nerodoma naujoje rezervacijoje, senos nuomos lieka.
        </p>
        {spaces.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Erdvių dar nėra.</p> : null}
        {spaces.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className={`flex flex-wrap items-center gap-2 text-sm font-medium ${s.active ? "" : "text-muted-foreground line-through"}`}>
                {s.label}
                {s.wholePark ? <Badge variant="outline">Visas parkas</Badge> : null}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                Iki {s.maxGuests} asm. · {price(s.priceWeekday)} / {price(s.priceWeekend)}
              </p>
            </div>
            <Switch checked={s.active} aria-label={`Nuomojama: ${s.label}`} onCheckedChange={(active) => toggle(s, active)} />
            <Button variant="ghost" size="icon" className="size-11" aria-label={`Redaguoti: ${s.label}`} onClick={() => onEdit(s)}>
              <PencilSimpleIcon size={18} />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
