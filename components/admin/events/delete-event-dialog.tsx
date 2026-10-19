"use client";

import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import type { ManagedEvent } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Confirms deletion; warns when tickets were already sold. */
export function DeleteEventDialog({ event, onOpenChange }: { event: ManagedEvent | null; onOpenChange: (open: boolean) => void }) {
  const { deleteEvent } = useAdmin();
  return (
    <Dialog open={!!event} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ištrinti renginį?</DialogTitle>
          <DialogDescription>
            „{event?.title}“ bus pašalintas iš sąrašo.
            {event && event.sold > 0 ? ` Jau parduota bilietų: ${event.sold} – su pirkėjais reikės susisiekti.` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Palikti
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!event) return;
              deleteEvent(event.id);
              toast.success("Renginys ištrintas");
              onOpenChange(false);
            }}
          >
            Ištrinti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
