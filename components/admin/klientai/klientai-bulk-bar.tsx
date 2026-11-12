"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAdmin } from "../admin-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface KlientaiBulkBarProps {
  ids: string[];
  onClear: () => void;
}

const noun = (n: number) => (n === 1 ? "klientą" : "klientus");

/** Shown while customers are ticked: how many, clear, and a confirmed bulk removal. */
export function KlientaiBulkBar({ ids, onClear }: KlientaiBulkBarProps) {
  const { deleteRiders } = useAdmin();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const result = await deleteRiders(ids);
    setBusy(false);
    if ("data" in result) {
      setConfirming(false);
      onClear();
    }
  }

  return (
    <>
      <div role="region" aria-label="Pažymėti klientai" className="flex flex-wrap items-center justify-between gap-3 border bg-secondary px-4 py-2">
        <p className="text-sm font-bold">Pažymėta: {ids.length}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" onClick={onClear}>
            Atžymėti
          </Button>
          <Button variant="destructive" className="min-h-11" onClick={() => setConfirming(true)}>
            <TrashIcon size={18} /> Pašalinti ({ids.length})
          </Button>
        </div>
      </div>

      <Dialog open={confirming} onOpenChange={(open) => (busy ? undefined : setConfirming(open))}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Pašalinti {ids.length} {noun(ids.length)}?
            </DialogTitle>
            <DialogDescription>Jų apyrankės, dokumentai, pardavimų istorija ir komentarai bus negrąžinamai ištrinti. Šio veiksmo atšaukti negalima.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => setConfirming(false)}>
              Palikti
            </Button>
            <Button variant="destructive" className="min-h-11" disabled={busy} onClick={() => void remove()}>
              {busy ? "Šalinama..." : `Pašalinti ${ids.length}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
