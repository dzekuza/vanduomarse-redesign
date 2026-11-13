"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAdmin } from "./admin-store";
import type { CancelKind } from "./use-cancel-request";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface DeleteTarget {
  id: string;
  reference: string;
}

/**
 * Removing a CANCELLED request from the lists (the server refuses anything else, and a paid one whose refund is not recorded).
 * Asks first. Render `dialog` next to the button that calls `remove`; `onRemoved` runs after it is gone (e.g. close a panel).
 */
export function useDeleteRequest(kind: CancelKind, onRemoved?: () => void): { remove: (target: DeleteTarget) => void; dialog: ReactNode } {
  const { deleteRequest } = useAdmin();
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      const result = await deleteRequest(kind, target.id);
      if ("data" in result) {
        toast.success(`${target.reference}: pašalinta`);
        onRemoved?.();
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
          <DialogTitle>Pašalinti {target.reference}?</DialogTitle>
          <DialogDescription>Atšaukta užklausa bus ištrinta iš sąrašų. Mokėjimo ir grąžinimo įrašai lieka. Šio veiksmo atšaukti negalima.</DialogDescription>
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
