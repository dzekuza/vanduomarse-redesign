"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { RecipientCard } from "./recipient-card";
import { RecipientDialog } from "./recipient-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { NotificationRecipient } from "@/lib/admin/types";

type Editing = { recipient?: NotificationRecipient } | null;

/** Owner-only: which phone numbers get staff SMS and which e-mail addresses get staff e-mail (new bookings, enquiries, payments), and for which topics. */
export function NotificationsView() {
  const { notificationRecipients, setNotificationRecipientActive, deleteNotificationRecipient } = useAdmin();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<NotificationRecipient | null>(null);

  return (
    <AdminPage
      title="Pranešimai"
      description="Telefono numeriai ir el. pašto adresai, kuriuos pasiekia SMS ir laiškai apie naujas rezervacijas, užklausas ir mokėjimus. Kiekvienam gavėjui pasirinkite, apie ką pranešti: apie viską, apie mokėjimus ar tik apie pirtį, keturračius, nakvynę."
      actions={
        <Button onClick={() => setEditing({})} className="min-h-11">
          <PlusIcon size={18} /> Naujas gavėjas
        </Button>
      }
    >
      {notificationRecipients.length === 0 ? (
        <p className="max-w-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Gavėjų dar nėra. Kol sąraše nėra telefono numerio, visus personalo SMS gauna numeris, nurodytas serverio nustatymuose (STAFF_NOTIFY_PHONE). Kol sąraše nėra el. pašto, laiškai
          siunčiami į paslaugų dėžutes (pirtis ir keturračiai: renginiai@, nakvynė: miegas@) ir marketingas@. Pridėjus bent vieną numerį ar el. paštą, to tipo pranešimai siunčiami tik pagal šį sąrašą.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notificationRecipients.map((r) => (
            <RecipientCard
              key={r.id}
              recipient={r}
              onActive={(active) => setNotificationRecipientActive(r.id, active)}
              onEdit={() => setEditing({ recipient: r })}
              onDelete={() => setDeleting(r)}
            />
          ))}
        </div>
      )}

      {editing ? <RecipientDialog key={editing.recipient?.id ?? "new"} recipient={editing.recipient} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pašalinti gavėją „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Šis gavėjas nebegaus personalo SMS ir laiškų. Vėliau galėsite pridėti iš naujo.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleting) return;
                const result = await deleteNotificationRecipient(deleting.id);
                if ("data" in result) toast.success("Gavėjas pašalintas");
                setDeleting(null);
              }}
            >
              Pašalinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
