"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { AdminSection } from "../admin-section";
import { UpsellDialog } from "./upsell-dialog";
import { UpsellRow } from "./upsell-row";
import type { Upsell } from "@/lib/sauna-upsells";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Editing = { upsell?: Upsell } | null;

/** Extras offered in the sauna booking: price, unit, on/off, edit and delete. */
export function UpsellsCard() {
  const { upsells, saunas, deleteUpsell } = useAdmin();
  const offeredBy = (id: string) => saunas.filter((s) => s.upsellIds.includes(id)).map((s) => s.name);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Upsell | null>(null);

  return (
    <AdminSection
      framed
      title="Priedai"
      description="Bendras priedų sąrašas: pirtininkas, vantos ir kt. Kuri pirtis ką siūlo, nustatoma pirties nustatymuose."
      action={
        <Button variant="outline" onClick={() => setEditing({})}>
          <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas priedas</span>
          <span className="sr-only sm:hidden">Naujas priedas</span>
        </Button>
      }
    >
      <div className="divide-y">
        {upsells.length === 0 ? <p className="text-sm text-muted-foreground">Priedų nėra.</p> : null}
        {upsells.map((u) => (
          <UpsellRow
            key={u.id}
            upsell={u}
            offeredBy={offeredBy(u.id)}
            onEdit={() => setEditing({ upsell: u })}
            onDelete={() => setDeleting(u)}
          />
        ))}
      </div>

      {editing ? <UpsellDialog key={editing.upsell?.id ?? "new"} upsell={editing.upsell} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Jei norite tik laikinai nerodyti, verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteUpsell(deleting.id);
                toast.success("Priedas ištrintas");
                setDeleting(null);
              }}
            >
              Ištrinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSection>
  );
}
