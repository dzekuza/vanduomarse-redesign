"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NotificationRecipient } from "@/lib/admin/types";
import { notificationRecipientInput, type NotificationRecipientInput } from "@/lib/notification-recipient-schema";
import { FormPhoneInput } from "@/components/ui/phone-input";
import { TopicFields } from "./topic-fields";

interface RecipientDialogProps {
  recipient?: NotificationRecipient;
  onOpenChange: (open: boolean) => void;
}

/** Add or edit a recipient (phone and/or e-mail) and its topics. "Visi pranešimai" covers every other topic, so picking it clears them. Remounted per recipient (key). */
export function RecipientDialog({ recipient, onOpenChange }: RecipientDialogProps) {
  const { saveNotificationRecipient } = useAdmin();
  const { register, control, handleSubmit, formState, setError } = useForm<NotificationRecipientInput>({
    resolver: zodResolver(notificationRecipientInput),
    defaultValues: {
      id: recipient?.id ?? null,
      name: recipient?.name ?? "",
      phone: recipient?.phone ?? "",
      email: recipient?.email ?? "",
      topics: recipient?.topics ?? ["visi"],
      active: recipient?.active ?? true,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await saveNotificationRecipient(v);
    if ("error" in result) {
      // The number and the address are the only fields the database can refuse on its own (a duplicate).
      if (result.error.code === "duplicate-email") setError("email", { message: result.error.message });
      else if (result.error.code === "duplicate" || result.error.code === "invalid") setError("phone", { message: result.error.message });
      return;
    }
    toast.success(recipient ? "Gavėjas atnaujintas" : "Gavėjas pridėtas");
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{recipient ? "Redaguoti gavėją" : "Naujas gavėjas"}</DialogTitle>
          <DialogDescription>Telefono numeriu siunčiami SMS, el. paštu: laiškai apie pažymėtus įvykius. Užpildykite bent vieną.</DialogDescription>
        </DialogHeader>
        <form id="recipient-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recipient-name">Vardas</Label>
            <Input id="recipient-name" placeholder="Pvz., Pirties administratorė" aria-invalid={!!err.name} className="min-h-11" {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recipient-phone">Telefono numeris (SMS)</Label>
            <FormPhoneInput<NotificationRecipientInput> name="phone" control={control} id="recipient-phone" invalid={!!err.phone} />
            {err.phone ? <p className="text-xs text-destructive">{err.phone.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recipient-email">El. paštas</Label>
            <Input id="recipient-email" type="email" inputMode="email" autoComplete="off" placeholder="vardas@vanduomarse.lt" aria-invalid={!!err.email} className="min-h-11" {...register("email")} />
            {err.email ? <p className="text-xs text-destructive">{err.email.message}</p> : null}
          </div>
          <Controller
            control={control}
            name="topics"
            render={({ field }) => <TopicFields value={field.value} onChange={field.onChange} error={err.topics?.message} />}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button type="submit" form="recipient-form" disabled={formState.isSubmitting}>
            {recipient ? "Išsaugoti" : "Pridėti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
