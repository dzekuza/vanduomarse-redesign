"use client";

import { ArrowLeftIcon, TrashIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { RiderCommentsTab, RiderDocumentsTab, RiderProfileTab } from "../rider-profile-tabs";
import { PlanBadge } from "./plan-badge";
import { RiderAvatar } from "./rider-avatar";
import { formatDateTime } from "@/lib/admin/format";
import type { Purchase } from "@/lib/admin/types";
import { formatPlanPrice } from "@/lib/ride-plans";
import { todayKey } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BACK_HREF = "/admin/apyrankes?tab=nariai";

/** `/admin/apyrankes/[id]`: rider details — profile, sales history, active services, subscriptions, documents, comments. */
export function RiderPage({ id }: { id: string }) {
  const { riders } = useAdmin();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const rider = riders.find((r) => r.id === id);

  const back = (
    <Button variant="outline" asChild>
      <Link href={BACK_HREF}>
        <ArrowLeftIcon size={18} /> Visi naudotojai
      </Link>
    </Button>
  );

  if (!rider) {
    return (
      <AdminPage title="Naudotojas nerastas" description="Jis galėjo būti pašalintas." actions={back}>
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
          <TabsTrigger value="pardavimai" className="min-h-11 shrink-0">
            Pardavimai
          </TabsTrigger>
          <TabsTrigger value="aktyvios" className="min-h-11 shrink-0">
            Aktyvios paslaugos
          </TabsTrigger>
          <TabsTrigger value="abonementai" className="min-h-11 shrink-0">
            Abonementai
          </TabsTrigger>
          <TabsTrigger value="dokumentai" className="min-h-11 shrink-0">
            Dokumentai
          </TabsTrigger>
          <TabsTrigger value="komentarai" className="min-h-11 shrink-0">
            Komentarai
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profilis" className="mt-4">
          <RiderProfileTab rider={rider} />
        </TabsContent>
        <TabsContent value="pardavimai" className="mt-4">
          <SalesList riderId={rider.id} filter="all" empty="Pardavimų dar nėra." />
        </TabsContent>
        <TabsContent value="aktyvios" className="mt-4">
          <SalesList riderId={rider.id} filter="active" empty="Šiandien paslaugų neparduota." />
        </TabsContent>
        <TabsContent value="abonementai" className="mt-4">
          <SalesList riderId={rider.id} filter="subscriptions" empty="Abonementų nėra." />
        </TabsContent>
        <TabsContent value="dokumentai" className="mt-4">
          <RiderDocumentsTab riderId={rider.id} />
        </TabsContent>
        <TabsContent value="komentarai" className="mt-4">
          <RiderCommentsTab riderId={rider.id} />
        </TabsContent>
      </Tabs>

      <div className="border-t pt-4">
        <Button variant="destructive" className="min-h-11 w-full sm:w-auto" onClick={() => setDeleting(true)}>
          <TrashIcon size={18} /> Pašalinti naudotoją
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
            <DeleteRiderButton riderId={rider.id} onDone={() => router.push(BACK_HREF)} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function DeleteRiderButton({ riderId, onDone }: { riderId: string; onDone: () => void }) {
  const { deleteRider } = useAdmin();
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        const result = await deleteRider(riderId);
        if ("data" in result) {
          toast.success("Naudotojas pašalintas");
          onDone();
        }
      }}
    >
      Pašalinti
    </Button>
  );
}

type SalesFilter = "all" | "active" | "subscriptions";

function filterPurchases(purchases: Purchase[], riderId: string, filter: SalesFilter): Purchase[] {
  const own = purchases.filter((p) => p.riderId === riderId);
  if (filter === "all") return own;
  if (filter === "subscriptions") return own.filter((p) => p.planCategory === "Abonementai");
  const today = todayKey();
  return own.filter((p) => p.planCategory !== "Abonementai" && p.soldAt.slice(0, 10) === today);
}

function SalesList({ riderId, filter, empty }: { riderId: string; filter: SalesFilter; empty: string }) {
  const { purchases } = useAdmin();
  const rows = filterPurchases(purchases, riderId, filter);

  if (rows.length === 0) return <p className="py-3 text-sm text-muted-foreground">{empty}</p>;

  return (
    <ul className="divide-y">
      {rows.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-normal">{p.planName}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(p.soldAt)}</p>
          </div>
          <p className="shrink-0 font-display text-sm font-bold tabular-nums">{formatPlanPrice(p.price)}</p>
        </li>
      ))}
    </ul>
  );
}
