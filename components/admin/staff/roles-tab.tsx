"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { RoleDialog } from "./role-dialog";
import { permissionLabel } from "@/lib/admin/permissions";
import type { StaffRole } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Editing = { role?: StaffRole } | null;

/** Roles and the pages each opens. The Owner role is fixed. */
export function RolesTab() {
  const { roles, staff, deleteRole } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<StaffRole | null>(null);
  const members = (id: string) => staff.filter((m) => m.roleId === id).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({})} className="min-h-11">
          <PlusIcon size={18} /> Nauja rolė
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-item">
                {r.name}
                {r.isOwner ? <Badge variant="outline">Pilna prieiga</Badge> : null}
              </CardTitle>
              <CardDescription>{r.description || (r.isOwner ? "" : "Be aprašymo")}</CardDescription>
              {r.isOwner ? null : (
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${r.name}`}>
                        <DotsThreeIcon size={20} weight="bold" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing({ role: r })}>Redaguoti</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(r)}>
                        Ištrinti
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="flex flex-wrap gap-1.5">
                {r.isOwner ? (
                  <li className="text-sm">Visi skyriai ir darbuotojų valdymas</li>
                ) : r.permissions.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Nei vieno skyriaus</li>
                ) : (
                  r.permissions.map((p) => (
                    <li key={p}>
                      <Badge variant="secondary">{permissionLabel(p)}</Badge>
                    </li>
                  ))
                )}
              </ul>
              <p className="text-xs text-muted-foreground">Darbuotojų: {members(r.id)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing ? <RoleDialog key={editing.role?.id ?? "new"} role={editing.role} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti rolę „{deleting?.name}“?</DialogTitle>
            <DialogDescription>
              {deleting && members(deleting.id) > 0
                ? `Šiai rolei priskirta darbuotojų: ${members(deleting.id)}. Pirmiausia pakeiskite jų rolę, kitaip ištrinti nepavyks.`
                : "Rolė bus pašalinta."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteRole(deleting.id);
                toast.success("Rolė ištrinta");
                setDeleting(null);
              }}
            >
              Ištrinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
