"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAdmin } from "./admin-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(12, "Bent 12 simbolių.").max(72, "Daugiausia 72 simboliai."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Slaptažodžiai nesutampa.", path: ["confirm"] });
type Values = z.infer<typeof schema>;

/** Any staff member sets their own password (owners hand out temporary ones). */
export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { changeOwnPassword } = useAdmin();
  const { register, handleSubmit, reset, formState } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await changeOwnPassword(v.password);
    if ("error" in result) return;
    toast.success("Slaptažodis pakeistas");
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Keisti slaptažodį</DialogTitle>
          <DialogDescription>Naujas slaptažodis galios kitą kartą prisijungus.</DialogDescription>
        </DialogHeader>
        <form id="change-password-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-new">Naujas slaptažodis</Label>
            <Input id="cp-new" type="password" autoComplete="new-password" aria-invalid={!!err.password} className="min-h-11" {...register("password")} />
            {err.password ? <p className="text-xs text-destructive">{err.password.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-confirm">Pakartokite</Label>
            <Input id="cp-confirm" type="password" autoComplete="new-password" aria-invalid={!!err.confirm} className="min-h-11" {...register("confirm")} />
            {err.confirm ? <p className="text-xs text-destructive">{err.confirm.message}</p> : null}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="change-password-form" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Keičiama..." : "Pakeisti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
