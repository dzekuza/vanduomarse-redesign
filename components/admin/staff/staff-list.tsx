"use client";

import { DotsThreeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { StaffAvatar } from "../staff-avatar";
import { CredentialsPanel } from "./credentials-panel";
import type { StaffMember } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/** Everyone with an admin login: change role, switch off, reset password, remove. */
export function StaffList() {
  const { staff, roles, me, setStaffRole, setStaffActive, resetStaffPassword, removeStaff } = useAdmin();
  const [removing, setRemoving] = useState<StaffMember | null>(null);
  const [reset, setReset] = useState<{ email: string; password: string } | null>(null);

  async function resetPassword(m: StaffMember) {
    const result = await resetStaffPassword(m.userId);
    if ("data" in result) setReset({ email: m.email, password: result.data.tempPassword });
  }

  return (
    <div className="space-y-3">
      {staff.map((m) => {
        const self = m.userId === me.userId;
        return (
          <Card key={m.userId}>
            <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <StaffAvatar name={m.name} className="size-10" />
              <div className="min-w-0 flex-1 basis-48">
                <p className={`truncate text-sm font-bold ${m.active ? "" : "text-muted-foreground line-through"}`}>
                  {m.name} {self ? <Badge variant="outline">Jūs</Badge> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              <Select
                value={m.roleId}
                disabled={self}
                onValueChange={(roleId) => {
                  setStaffRole(m.userId, roleId);
                  toast.success(`${m.name}: rolė pakeista`);
                }}
              >
                <SelectTrigger aria-label={`Rolė: ${m.name}`} className="min-h-11 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <Switch
                  checked={m.active}
                  disabled={self}
                  aria-label={`Prieiga: ${m.name}`}
                  onCheckedChange={(v) => {
                    setStaffActive(m.userId, v);
                    toast.success(v ? `${m.name}: prieiga įjungta` : `${m.name}: prieiga išjungta`);
                  }}
                />
                {m.active ? "Aktyvus" : "Išjungtas"}
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${m.name}`}>
                    <DotsThreeIcon size={20} weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => resetPassword(m)}>Atstatyti slaptažodį</DropdownMenuItem>
                  {self ? null : (
                    <DropdownMenuItem className="text-destructive" onSelect={() => setRemoving(m)}>
                      Pašalinti
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        );
      })}
      {staff.length === 0 ? <p className="text-sm text-muted-foreground">Darbuotojų dar nėra.</p> : null}

      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pašalinti {removing?.name}?</DialogTitle>
            <DialogDescription>Prisijungimas bus ištrintas. Jei tik norite sustabdyti prieigą, verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!removing) return;
                removeStaff(removing.userId);
                setRemoving(null);
              }}
            >
              Pašalinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reset} onOpenChange={(o) => !o && setReset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Naujas laikinas slaptažodis</DialogTitle>
            <DialogDescription>Senasis slaptažodis nebegalioja.</DialogDescription>
          </DialogHeader>
          {reset ? <CredentialsPanel email={reset.email} password={reset.password} /> : null}
          <DialogFooter>
            <Button onClick={() => setReset(null)}>Baigta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
