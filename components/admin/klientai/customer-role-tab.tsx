"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { CredentialsPanel } from "../staff/credentials-panel";
import { permissionLabel, STAFF_HREF } from "@/lib/admin/permissions";
import type { Rider, StaffRole } from "@/lib/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const OWNER_ACCESS_LABEL = "Pilna prieiga";

/**
 * `/admin/klientai/[id]` → Rolė (owners only): turn a customer into a staff login,
 * or change the role of the login that already uses their email. A rider has no
 * auth link of its own, so the staff row is found by matching email (ADR-0048).
 */
export function CustomerRoleTab({ rider }: { rider: Rider }) {
  const { staff, roles } = useAdmin();
  const email = rider.email?.trim().toLowerCase() ?? "";
  const member = email ? staff.find((m) => m.email.toLowerCase() === email) : undefined;

  if (!email) {
    return <p className="py-3 text-sm text-muted-foreground">Kad klientas galėtų prisijungti prie administravimo, pirmiausia įrašykite jo el. paštą skiltyje Profilis.</p>;
  }
  if (member) return <ExistingLogin memberId={member.userId} roles={roles} />;
  return <GrantAccess rider={rider} email={email} roles={roles} />;
}

/** The customer already has an admin login: change its role or switch it off. */
function ExistingLogin({ memberId, roles }: { memberId: string; roles: StaffRole[] }) {
  const { staff, me, setStaffRole, setStaffActive } = useAdmin();
  const member = staff.find((m) => m.userId === memberId);
  if (!member) return null;

  const self = member.userId === me.userId;
  const role = roles.find((r) => r.id === member.roleId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-item">
          Turi administravimo prieigą {self ? <Badge variant="outline">Jūs</Badge> : null}
        </CardTitle>
        <CardDescription>
          Darbuotojas: {member.name} · {member.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          Susieta tik pagal el. paštą, kuris nepatvirtintas. Prieš keisdami rolę įsitikinkite, kad tai tas pats žmogus.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="customer-role">Rolė</Label>
          <RoleSelect
            id="customer-role"
            roles={roles}
            value={member.roleId}
            disabled={self}
            onChange={(roleId) => {
              setStaffRole(member.userId, roleId);
              toast.success("Rolė pakeista");
            }}
          />
          {self ? <p className="text-xs text-muted-foreground">Savo rolės keisti negalima.</p> : null}
        </div>
        {role ? <RoleAccess role={role} /> : null}
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <Switch
            checked={member.active}
            disabled={self}
            aria-label="Prieiga prie administravimo"
            onCheckedChange={(active) => {
              setStaffActive(member.userId, active);
              toast.success(active ? "Prieiga įjungta" : "Prieiga išjungta");
            }}
          />
          {member.active ? "Aktyvus" : "Išjungtas"}
        </label>
        <OwnerLink />
      </CardContent>
    </Card>
  );
}

/** No login for this email yet: create one with a role and show the temporary password once. */
function GrantAccess({ rider, email, roles }: { rider: Rider; email: string; roles: StaffRole[] }) {
  const { createStaff } = useAdmin();
  const [roleId, setRoleId] = useState(roles.find((r) => !r.isOwner)?.id ?? roles[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const role = roles.find((r) => r.id === roleId);

  if (created) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-item">Paskyra sukurta</CardTitle>
          <CardDescription>Perduokite prisijungimo duomenis klientui. Slaptažodis rodomas tik dabar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CredentialsPanel email={email} password={created} />
          <Button className="min-h-11" onClick={() => setCreated(null)}>
            Baigta
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function grant() {
    setSaving(true);
    const result = await createStaff({ email, displayName: `${rider.name} ${rider.surname}`.trim(), roleId });
    setSaving(false);
    if ("data" in result) setCreated(result.data.tempPassword);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-item">Suteikti prieigą prie administravimo</CardTitle>
        <CardDescription>
          Sukursime prisijungimą su el. paštu {email} ir laikinu slaptažodžiu. Pasirinkite Savininką administratoriaus teisėms arba rolę su pasirinktais skyriais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="customer-role">Rolė</Label>
          <RoleSelect id="customer-role" roles={roles} value={roleId} onChange={setRoleId} />
        </div>
        {role ? <RoleAccess role={role} /> : null}
        <Button className="min-h-11 w-full sm:w-auto" disabled={saving || !roleId} onClick={grant}>
          {saving ? "Kuriama..." : "Sukurti prisijungimą"}
        </Button>
      </CardContent>
    </Card>
  );
}

function RoleSelect({ id, roles, value, onChange, disabled }: { id: string; roles: StaffRole[]; value: string; onChange: (roleId: string) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="min-h-11 w-full sm:w-64">
        <SelectValue placeholder="Pasirinkite rolę" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.isOwner ? `${r.name} (administratorius)` : r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** What a role opens: every page for the owner, otherwise its page list. */
function RoleAccess({ role }: { role: StaffRole }) {
  return (
    <div className="space-y-1.5">
      {role.description ? <p className="text-sm text-muted-foreground">{role.description}</p> : null}
      <ul className="flex flex-wrap gap-1.5">
        {role.isOwner ? (
          <li>
            <Badge>{OWNER_ACCESS_LABEL}</Badge>
          </li>
        ) : role.permissions.length === 0 ? (
          <li className="text-sm text-muted-foreground">Ši rolė dar neturi skyrių.</li>
        ) : (
          role.permissions.map((p) => (
            <li key={p}>
              <Badge variant="secondary">{permissionLabel(p)}</Badge>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function OwnerLink() {
  return (
    <p className="text-xs text-muted-foreground">
      Slaptažodį atstatyti, rolių skyrius keisti ar paskyrą pašalinti galite skiltyje{" "}
      <Link href={STAFF_HREF} className="underline underline-offset-4">
        Darbuotojai
      </Link>
      .
    </p>
  );
}
