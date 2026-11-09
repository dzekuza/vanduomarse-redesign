"use client";

import { ArrowLeftIcon, TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { CustomerRoleTab } from "./customer-role-tab";
import { useAdmin } from "../admin-store";
import { RiderCommentsTab, RiderDocumentsTab, RiderProfileTab } from "../rider-profile-tabs";
import { PlanBadge } from "../apyrankes/plan-badge";
import { RiderAvatar } from "../apyrankes/rider-avatar";
import { COUPON_STATUS_LABEL } from "@/lib/coupons";
import { bookingTypeLabel, bookingWhen, formatDateTime, formatEur, quadRentalLabel } from "@/lib/admin/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BACK_HREF = "/admin/klientai";

type ActivityRow = { id: string; at: string; label: string; detail: string; amount: number | null };

/** `/admin/klientai/[id]`: one customer — profile, a unified activity timeline, documents, comments. ADR-0042 */
export function CustomerPage({ id }: { id: string }) {
  const { riders, me } = useAdmin();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const rider = riders.find((r) => r.id === id);

  const back = (
    <Button variant="outline" asChild>
      <Link href={BACK_HREF}>
        <ArrowLeftIcon size={18} /> Visi klientai
      </Link>
    </Button>
  );

  if (!rider) {
    return (
      <AdminPage title="Klientas nerastas" description="Jis galėjo būti pašalintas." actions={back}>
        {null}
      </AdminPage>
    );
  }

  return (
    <AdminPage title={`${rider.name} ${rider.surname}`} actions={back}>
      <div className="flex items-center gap-3">
        <RiderAvatar name={rider.name} surname={rider.surname} avatarPath={rider.avatarPath} className="size-10" />
        <PlanBadge planId={rider.planId} />
      </div>

      <Tabs defaultValue="profilis">
        <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden">
          <TabsTrigger value="profilis" className="min-h-11 shrink-0">
            Profilis
          </TabsTrigger>
          <TabsTrigger value="veikla" className="min-h-11 shrink-0">
            Veikla
          </TabsTrigger>
          <TabsTrigger value="dokumentai" className="min-h-11 shrink-0">
            Dokumentai
          </TabsTrigger>
          <TabsTrigger value="komentarai" className="min-h-11 shrink-0">
            Komentarai
          </TabsTrigger>
          {me.isOwner ? (
            <TabsTrigger value="role" className="min-h-11 shrink-0">
              Rolė
            </TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="profilis" className="mt-4">
          <RiderProfileTab rider={rider} />
        </TabsContent>
        <TabsContent value="veikla" className="mt-4">
          <ActivityTab riderId={rider.id} />
        </TabsContent>
        <TabsContent value="dokumentai" className="mt-4">
          <RiderDocumentsTab riderId={rider.id} />
        </TabsContent>
        <TabsContent value="komentarai" className="mt-4">
          <RiderCommentsTab riderId={rider.id} />
        </TabsContent>
        {me.isOwner ? (
          <TabsContent value="role" className="mt-4">
            <CustomerRoleTab rider={rider} />
          </TabsContent>
        ) : null}
      </Tabs>

      <div className="border-t pt-4">
        <Button variant="destructive" className="min-h-11 w-full sm:w-auto" onClick={() => setDeleting(true)}>
          <TrashIcon size={18} /> Pašalinti klientą
        </Button>
      </div>

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Pašalinti {rider.name} {rider.surname}?
            </DialogTitle>
            <DialogDescription>Jų apyrankė, dokumentai, pardavimų istorija ir komentarai bus negrąžinamai ištrinti.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Palikti
            </Button>
            <DeleteCustomerButton riderId={rider.id} onDone={() => router.push(BACK_HREF)} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function DeleteCustomerButton({ riderId, onDone }: { riderId: string; onDone: () => void }) {
  const { deleteRider } = useAdmin();
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        const result = await deleteRider(riderId);
        if ("data" in result) {
          toast.success("Klientas pašalintas");
          onDone();
        }
      }}
    >
      Pašalinti
    </Button>
  );
}

/** One timeline merging purchases, bookings, quad rentals, event tickets and coupons for this customer. */
function ActivityTab({ riderId }: { riderId: string }) {
  const { purchases, bookings, quadRentals, eventTickets, coupons, quadTypes } = useAdmin();

  const rows = useMemo<ActivityRow[]>(() => {
    const out: ActivityRow[] = [];
    for (const p of purchases.filter((p) => p.riderId === riderId)) {
      out.push({ id: `pirkimas-${p.id}`, at: p.soldAt, label: p.planName, detail: p.planCategory, amount: p.price });
    }
    for (const b of bookings.filter((b) => b.riderId === riderId)) {
      out.push({ id: `rezervacija-${b.id}`, at: b.createdAt, label: bookingTypeLabel(b), detail: `${bookingWhen(b)} · ${b.reference}`, amount: b.total });
    }
    for (const q of quadRentals.filter((q) => q.riderId === riderId)) {
      out.push({ id: `nuoma-${q.id}`, at: q.createdAt, label: quadRentalLabel(q, quadTypes), detail: q.reference, amount: q.total });
    }
    for (const t of eventTickets.filter((t) => t.riderId === riderId)) {
      out.push({ id: `bilietas-${t.id}`, at: t.createdAt, label: t.eventTitle, detail: `${t.people} asm. · ${t.reference}`, amount: t.total });
    }
    for (const c of coupons.filter((c) => c.riderId === riderId)) {
      out.push({ id: `kuponas-${c.id}`, at: c.createdAt, label: c.productName, detail: COUPON_STATUS_LABEL[c.status], amount: c.faceValue });
    }
    return out.toSorted((a, b) => b.at.localeCompare(a.at));
  }, [purchases, bookings, quadRentals, eventTickets, coupons, quadTypes, riderId]);

  if (rows.length === 0) return <p className="py-3 text-sm text-muted-foreground">Veiklos dar nėra.</p>;

  return (
    <ul className="divide-y">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{r.label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {r.detail} · {formatDateTime(r.at)}
            </p>
          </div>
          {r.amount !== null ? <p className="shrink-0 font-display text-sm font-bold tabular-nums">{formatEur(r.amount)}</p> : null}
        </li>
      ))}
    </ul>
  );
}
