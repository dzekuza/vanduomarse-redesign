"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { NotificationRecipient } from "@/lib/admin/types";
import { notificationRecipientInput, type NotificationRecipientInput } from "@/lib/notification-recipient-schema";
import { NOTIFICATION_TOPICS, type NotificationTopic } from "@/lib/notification-topics";

interface RecipientDialogProps {
  recipient?: NotificationRecipient;
  onOpenChange: (open: boolean) => void;
}

/** Add or edit a number and its topics. "Visi pranešimai" covers every other topic, so picking it clears them. Remounted per recipient (key). */
export function RecipientDialog({ recipient, onOpenChange }: RecipientDialogProps) {
  const { saveNotificationRecipient } = useAdmin();
  const { register, control, handleSubmit, formState, setError } = useForm<NotificationRecipientInput>({
    resolver: zodResolver(notificationRecipientInput),
    defaultValues: {
      id: recipient?.id ?? null,
      name: recipient?.name ?? "",
      phone: recipient?.phone ?? "",
      topics: recipient?.topics ?? ["visi"],
      active: recipient?.active ?? true,
    },
  });
  const err = formState.errors;

  const submit = handleSubmit(async (v) => {
    const result = await saveNotificationRecipient(v);
    if ("error" in result) {
      // The number is the only field the database can refuse on its own (a duplicate).
      if (result.error.code === "duplicate" || result.error.code === "invalid") setError("phone", { message: result.error.message });
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
          <DialogDescription>Šiam numeriui bus siunčiami SMS apie pažymėtus įvykius.</DialogDescription>
        </DialogHeader>
        <form id="recipient-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recipient-name">Vardas</Label>
            <Input id="recipient-name" placeholder="Pvz., Pirties administratorė" aria-invalid={!!err.name} className="min-h-11" {...register("name")} />
            {err.name ? <p className="text-xs text-destructive">{err.name.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recipient-phone">Telefono numeris</Label>
            <Input id="recipient-phone" type="tel" inputMode="tel" autoComplete="off" placeholder="+370 612 34567" aria-invalid={!!err.phone} className="min-h-11" {...register("phone")} />
            {err.phone ? <p className="text-xs text-destructive">{err.phone.message}</p> : null}
          </div>
          <Controller
            control={control}
            name="topics"
            render={({ field }) => {
              const toggle = (id: NotificationTopic, on: boolean) => {
                if (id === "visi") return field.onChange(on ? ["visi"] : []);
                const rest = field.value.filter((t) => t !== "visi" && t !== id);
                field.onChange(on ? [...rest, id] : rest);
              };
              return (
                <fieldset className="space-y-1">
                  <legend className="mb-2 text-sm font-medium">Apie ką pranešti</legend>
                  {NOTIFICATION_TOPICS.map((t) => {
                    const everything = field.value.includes("visi");
                    const checked = t.id === "visi" ? everything : everything || field.value.includes(t.id);
                    return (
                      <label key={t.id} className="flex min-h-11 cursor-pointer items-start gap-3 border-b py-2.5 last:border-b-0">
                        <Switch className="mt-0.5" checked={checked} disabled={t.id !== "visi" && everything} onCheckedChange={(on) => toggle(t.id, on)} aria-label={t.label} />
                        <span>
                          <span className="block text-sm font-medium">{t.label}</span>
                          <span className="block text-xs text-muted-foreground">{t.hint}</span>
                        </span>
                      </label>
                    );
                  })}
                  {err.topics ? <p className="pt-1 text-xs text-destructive">{err.topics.message}</p> : null}
                </fieldset>
              );
            }}
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
