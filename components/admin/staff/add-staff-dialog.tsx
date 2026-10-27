"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useAdmin } from "../admin-store";
import { CredentialsPanel } from "./credentials-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  displayName: z.string().trim().min(2, "Įveskite vardą.").max(80),
  email: z.email("Neteisingas el. paštas.").max(120),
  roleId: z.string().min(1, "Pasirinkite rolę."),
});
type Values = z.infer<typeof schema>;

/** Creates the login with a temporary password, then shows it once. */
export function AddStaffDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const { roles, createStaff } = useAdmin();
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", email: "", roleId: roles.find((r) => !r.isOwner)?.id ?? "" },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await createStaff(v);
    if ("data" in result) setCreated({ email: v.email.toLowerCase(), password: result.data.tempPassword });
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{created ? "Paskyra sukurta" : "Naujas darbuotojas"}</DialogTitle>
          <DialogDescription>
            {created ? "Perduokite prisijungimo duomenis žmogui." : "Sukursime prisijungimą su laikinu slaptažodžiu. Rolė nustato, kuriuos skyrius jis mato."}
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <CredentialsPanel email={created.email} password={created.password} />
        ) : (
          <form id="add-staff-form" onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="as-name">Vardas, pavardė</Label>
              <Input id="as-name" autoComplete="off" aria-invalid={!!err.displayName} className="min-h-11" {...register("displayName")} />
              {err.displayName ? <p className="text-xs text-destructive">{err.displayName.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="as-email">El. paštas (prisijungimui)</Label>
              <Input id="as-email" type="email" autoComplete="off" aria-invalid={!!err.email} className="min-h-11" {...register("email")} />
              {err.email ? <p className="text-xs text-destructive">{err.email.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="as-role">Rolė</Label>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="as-role" className="w-full">
                      <SelectValue placeholder="Pasirinkite rolę" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {err.roleId ? <p className="text-xs text-destructive">{err.roleId.message}</p> : null}
            </div>
          </form>
        )}
        <DialogFooter>
          {created ? (
            <Button onClick={() => onOpenChange(false)}>Baigta</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Atšaukti
              </Button>
              <Button type="submit" form="add-staff-form" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "Kuriama..." : "Sukurti paskyrą"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
