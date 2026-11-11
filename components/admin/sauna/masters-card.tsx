"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { AdminSection } from "../admin-section";
import { MasterDialog } from "./master-dialog";
import { MasterRow } from "./master-row";
import type { SaunaMaster } from "@/lib/sauna-masters";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Editing = { master?: SaunaMaster } | null;

/** Pirtininkai a customer can add to private sauna bookings and programs: name, price, shortest session. */
export function MastersCard() {
  const { saunaMasters, deleteSaunaMaster } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<SaunaMaster | null>(null);
  const nextOrder = Math.max(-1, ...saunaMasters.map((m) => m.sortOrder)) + 1;

  return (
    <AdminSection
      framed
      title="Pirtininkai"
      description="Rezervacijoje po pirties pasirinkimo klientas gali pridėti pirtininką: jo kaina pridedama prie užsakymo."
      action={
        <Button variant="outline" onClick={() => setEditing({})}>
          <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas pirtininkas</span>
          <span className="sr-only sm:hidden">Naujas pirtininkas</span>
        </Button>
      }
    >
      <div className="divide-y">
        {saunaMasters.length === 0 ? <p className="text-sm text-muted-foreground">Pirtininkų nėra.</p> : null}
        {saunaMasters.map((m) => (
          <MasterRow key={m.id} master={m} onEdit={() => setEditing({ master: m })} onDelete={() => setDeleting(m)} />
        ))}
      </div>

      {editing ? (
        <MasterDialog key={editing.master?.id ?? "new"} master={editing.master} nextOrder={nextOrder} onOpenChange={(o) => !o && setEditing(null)} />
      ) : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Esamos rezervacijos išlieka. Jei norite tik laikinai nerodyti, verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteSaunaMaster(deleting.id);
                toast.success("Pirtininkas ištrintas");
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
