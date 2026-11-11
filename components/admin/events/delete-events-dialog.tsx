"use client";

import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import type { ManagedEvent } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Confirms deleting several events at once; warns when any have sold tickets. */
export function DeleteEventsDialog({
  events,
  onOpenChange,
  onDeleted,
}: {
  events: ManagedEvent[];
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { deleteEvent } = useAdmin();
  const sold = events.reduce((sum, e) => sum + e.sold, 0);
  return (
    <Dialog open={events.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ištrinti pasirinktus renginius?</DialogTitle>
          <DialogDescription>
            Bus pašalinta renginių: {events.length}.
            {sold > 0 ? ` Jau parduota bilietų: ${sold} – su pirkėjais reikės susisiekti.` : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Palikti
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await Promise.all(events.map((e) => deleteEvent(e.id)));
              toast.success(`Ištrinta renginių: ${events.length}`);
              onDeleted();
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
