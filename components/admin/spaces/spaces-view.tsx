"use client";

import { CalendarPlusIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAdmin } from "../admin-store";
import { AdminPage } from "../admin-page";
import { NewSpaceBookingDialog } from "./new-space-booking-dialog";
import { SpaceDialog } from "./space-dialog";
import { SpacesCard } from "./spaces-card";
import { UpcomingHiresCard } from "./upcoming-hires-card";
import type { ManagedSpace } from "@/lib/space-booking";
import { Button } from "@/components/ui/button";

/** Erdvės: the event spaces staff hire out, their rent, and a shortcut to a new hire (ADR-0129). */
export function SpacesView() {
  const { spaces } = useAdmin();
  const [editing, setEditing] = useState<ManagedSpace | "new" | null>(null);
  const [hiring, setHiring] = useState(false);

  return (
    <AdminPage
      title="Erdvės"
      description="Renginių erdvės, jų talpa ir nuomos kainos. Nauja nuoma atsiranda kalendoriuje ir pardavimuose."
      actions={
        <>
          <Button variant="outline" onClick={() => setEditing("new")} className="min-h-11">
            <PlusIcon size={18} /> Nauja erdvė
          </Button>
          <Button onClick={() => setHiring(true)} className="min-h-11">
            <CalendarPlusIcon size={18} /> Nauja nuoma
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SpacesCard onEdit={setEditing} />
        <UpcomingHiresCard />
      </div>
      {editing ? (
        <SpaceDialog
          key={editing === "new" ? "new" : editing.id}
          space={editing === "new" ? null : editing}
          nextOrder={Math.max(-1, ...spaces.map((s) => s.sortOrder)) + 1}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      ) : null}
      {hiring ? <NewSpaceBookingDialog onOpenChange={(o) => !o && setHiring(false)} /> : null}
    </AdminPage>
  );
}
