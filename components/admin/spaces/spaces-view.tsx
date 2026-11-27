"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useAdmin } from "../admin-store";
import { AdminPage } from "../admin-page";
import { SpaceActivityCard } from "./space-activity-card";
import { SpaceDialog } from "./space-dialog";
import { SpacesCard } from "./spaces-card";
import type { ManagedSpace } from "@/lib/space-booking";
import { Button } from "@/components/ui/button";

/**
 * Erdvės, built like Pirtis: the events held in the spaces and their hires on the left, the spaces themselves (an erdvė
 * is what a pirtis is there) with capacity and rent on the right (ADR-0133, ADR-0136).
 */
export function SpacesView() {
  const { spaces } = useAdmin();
  const [editing, setEditing] = useState<ManagedSpace | "new" | null>(null);

  return (
    <AdminPage
      title="Erdvės"
      description="Renginių erdvės, jose vykstantys renginiai ir nuomos. Renginys ar nuoma erdvę užima – tuo metu jos kitiems rezervuoti negalima."
      actions={
        <Button variant="outline" onClick={() => setEditing("new")} className="min-h-11">
          <PlusIcon size={18} /> Nauja erdvė
        </Button>
      }
    >
      {/* Side by side only from xl, as on Pirtis: with the sidebar open an lg side column is too narrow for the rows. */}
      <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
        <div className="min-w-0 xl:col-span-2">
          <SpaceActivityCard firstSpaceId={spaces.find((s) => s.active)?.id} />
        </div>
        <div className="min-w-0">
          <SpacesCard onEdit={setEditing} />
        </div>
      </div>
      {editing ? (
        <SpaceDialog
          key={editing === "new" ? "new" : editing.id}
          space={editing === "new" ? null : editing}
          nextOrder={Math.max(-1, ...spaces.map((s) => s.sortOrder)) + 1}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      ) : null}
    </AdminPage>
  );
}
