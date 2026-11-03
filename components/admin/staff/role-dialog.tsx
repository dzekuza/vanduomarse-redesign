"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { PERMISSION_IDS, PERMISSIONS, type PermissionId } from "@/lib/admin/permissions";
import type { StaffRole } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const schema = z.object({
  name: z.string().trim().min(2, "Įveskite pavadinimą.").max(40, "Daugiausia 40 simbolių."),
  description: z.string().trim().max(120, "Daugiausia 120 simbolių."),
  permissions: z.array(z.enum(PERMISSION_IDS)),
});
type Values = z.infer<typeof schema>;

interface RoleDialogProps {
  role?: StaffRole;
  onOpenChange: (open: boolean) => void;
}

/** Create or edit a role: a name and the admin pages it opens. Remounted per role (key). */
export function RoleDialog({ role, onOpenChange }: RoleDialogProps) {
  const { saveRole } = useAdmin();
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: role?.name ?? "", description: role?.description ?? "", permissions: role?.permissions ?? [] },
  });
  const err = formState.errors;

  const submit = handleSubmit((v) => {
    saveRole({ id: role?.id ?? crypto.randomUUID(), name: v.name, description: v.description, isOwner: false, permissions: v.permissions });
    toast.success(role ? "Rolė atnaujinta" : "Rolė sukurta");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{role ? "Redaguoti rolę" : "Nauja rolė"}</DialogTitle>
          <DialogDescription>Pažymėkite skyrius, kuriuos šios rolės žmonės galės atidaryti. Kiti skyriai jiems nebus rodomi, o duomenys apsaugoti ir duomenų bazėje.</DialogDescription>
        </DialogHeader>
        <form id="role-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Pavadinimas</Label>
            <Input id="role-name" placeholder="Pvz., Pirties administratorius" aria-invalid={!!err.name} className="min-h-11" {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Aprašymas (nebūtina)</Label>
            <Input id="role-desc" aria-invalid={!!err.description} className="min-h-11" {...register("description")} />
            {err.description ? <p className="text-xs text-destructive">{err.description.message}</p> : null}
          </div>
          <Controller
            control={control}
            name="permissions"
            render={({ field }) => {
              const toggle = (id: PermissionId, on: boolean) => field.onChange(on ? [...field.value, id] : field.value.filter((p) => p !== id));
              return (
                <fieldset className="space-y-1">
                  <legend className="mb-2 text-sm font-normal">Skyriai</legend>
                  {PERMISSIONS.map((p) => (
                    <label key={p.id} className="flex min-h-11 cursor-pointer items-start gap-3 border-b py-2.5 last:border-b-0">
                      <Switch className="mt-0.5" checked={field.value.includes(p.id)} onCheckedChange={(on) => toggle(p.id, on)} aria-label={p.label} />
                      <span>
                        <span className="block text-sm font-normal">{p.label}</span>
                        <span className="block text-xs text-muted-foreground">{p.hint}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              );
            }}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="role-form">
            {role ? "Išsaugoti" : "Sukurti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
