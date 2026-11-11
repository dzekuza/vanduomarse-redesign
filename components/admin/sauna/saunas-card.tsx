"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { AdminSection } from "../admin-section";
import { SaunaRow } from "./sauna-row";
import type { Sauna } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** The saunas in display order: cover, price, on/off, order, edit and delete. */
export function SaunasCard() {
  const { saunas, deleteSauna } = useAdmin();
  const [deleting, setDeleting] = useState<Sauna | null>(null);

  return (
    <AdminSection framed title="Pirtys" description="Svetainėje lankytojas pirmiausia renkasi pirtį. Tvarka čia = tvarka svetainėje.">
      <div className="divide-y">
        {saunas.length === 0 ? <p className="text-sm text-muted-foreground">Pirčių dar nėra.</p> : null}
        {saunas.map((s) => (
          <SaunaRow
            key={s.id}
            sauna={s}
            onDelete={() => setDeleting(s)}
          />
        ))}
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Kartu ištrinamos nuotraukos ir uždarytos valandos. Pirties su rezervacijomis ištrinti negalima – ją galima paslėpti.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleting) return;
                const result = await deleteSauna(deleting.id);
                if ("data" in result) toast.success("Pirtis ištrinta");
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
