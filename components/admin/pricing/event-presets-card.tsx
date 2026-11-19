"use client";

import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { EventPresetDialog } from "./event-preset-dialog";
import type { ManagedEventPreset } from "@/lib/admin/types";
import { formatMoney } from "@/lib/event-pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** The calculator's "Renginio tipas" choices: add, edit, hide or remove. */
export function EventPresetsCard() {
  const { eventPresets, deleteEventPreset } = useAdmin();
  const [editing, setEditing] = useState<ManagedEventPreset | "new" | null>(null);

  const remove = async (p: ManagedEventPreset) => {
    if (!window.confirm(`Pašalinti renginio tipą „${p.label}“?`)) return;
    const result = await deleteEventPreset(p.id);
    if ("data" in result) toast.success("Renginio tipas pašalintas");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Renginio tipai</CardTitle>
        <Button size="sm" className="min-h-11" onClick={() => setEditing("new")}>
          <PlusIcon /> Pridėti
        </Button>
      </CardHeader>
      <CardContent className="divide-y">
        <p className="pb-3 text-xs text-muted-foreground">Rodomi skaičiuoklėje „Renginio tipas“. Tipas tik pasiūlo įprastą svečių skaičių ir parodo įprastą kainą vienam svečiui.</p>
        {eventPresets.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Renginio tipų nėra.</p> : null}
        {eventPresets.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {p.label}
                {p.active ? null : <Badge variant="outline">Paslėptas</Badge>}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.adults + p.kids} asm. · {formatMoney(p.perGuest)} / asm.
              </p>
            </div>
            <div className="flex shrink-0">
              <Button variant="ghost" size="icon" className="size-11" aria-label={`Redaguoti: ${p.label}`} onClick={() => setEditing(p)}>
                <PencilSimpleIcon size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="size-11 text-destructive" aria-label={`Pašalinti: ${p.label}`} onClick={() => remove(p)}>
                <TrashIcon size={18} />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
      {editing ? <EventPresetDialog key={editing === "new" ? "new" : editing.id} preset={editing === "new" ? null : editing} nextOrder={Math.max(0, ...eventPresets.map((p) => p.sortOrder)) + 10} onOpenChange={(o) => !o && setEditing(null)} /> : null}
    </Card>
  );
}
