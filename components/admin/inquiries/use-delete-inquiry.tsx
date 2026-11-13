"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface DeleteInquiryTarget {
  id: string;
  title: string;
}

/**
 * Removing an inquiry from the board (the server refuses one that still holds cabins or saunas). Asks first.
 * Render `dialog` once next to the screen; `onRemoved` runs after it is gone (e.g. close the panel).
 */
export function useDeleteInquiry(onRemoved?: (id: string) => void): { remove: (target: DeleteInquiryTarget) => void; dialog: ReactNode } {
  const { deleteInquiry } = useAdmin();
  const [target, setTarget] = useState<DeleteInquiryTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const result = await deleteInquiry(target.id);
      if ("data" in result) {
        toast.success(`${target.title}: pašalinta`);
        onRemoved?.(target.id);
      }
    } finally {
      setBusy(false);
      setTarget(null);
    }
  };

  const dialog = target ? (
    <Dialog open onOpenChange={(next) => !next && !busy && setTarget(null)}>
      <DialogContent className="sm:max-w-sm" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Pašalinti užklausą „{target.title}“?</DialogTitle>
          <DialogDescription>Užklausa ir jos pastabos bus ištrintos. Šio veiksmo atšaukti negalima.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => setTarget(null)}>
            Palikti
          </Button>
          <Button variant="destructive" className="min-h-11" disabled={busy} onClick={() => void confirm()}>
            Pašalinti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return { remove: setTarget, dialog };
}
