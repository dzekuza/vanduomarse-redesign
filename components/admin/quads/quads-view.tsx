"use client";

import { PlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { CategoryEventsList } from "../events/category-events-list";
import { QuadSettingsCard } from "./quad-settings-card";
import { QuadTypesCard } from "./quad-types-card";
import { TourAccessoriesCard } from "./tour-accessories-card";
import { TourDepartureDialog } from "./tour-departure-dialog";
import { TourRoutesCard } from "./tour-routes-card";
import { ToursTab } from "./tours-tab";
import type { ManagedEvent } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_IDS = ["turai", "inventorius"] as const;

/** Keturračiai: tour registrations (Turai) and the fleet and rules behind /keturraciai (Inventorius). `?tab=inventorius` opens the settings tab directly. */
export function QuadsView() {
  const { tourTickets, quadRentals, quadTourRoutes } = useAdmin();
  const [editing, setEditing] = useState<{ event?: ManagedEvent } | null>(null);
  const pendingTours = tourTickets.filter((t) => t.status === "laukia").length + quadRentals.filter((r) => r.tourRouteId && r.status === "laukia").length;
  const requested = useSearchParams().get("tab");
  const initialTab = (TAB_IDS as readonly string[]).includes(requested ?? "") ? requested! : "turai";

  return (
    <AdminPage
      title="Keturračiai"
      description="Turų tipai, jų datos ir rezervacijos bei parko nustatymai."
      actions={
        <Button onClick={() => setEditing({})} className="min-h-11">
          <PlusIcon size={18} /> Pridėti turą
        </Button>
      }
    >
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="turai" className="min-h-11">
            Turai{pendingTours ? ` (${pendingTours})` : ""}
          </TabsTrigger>
          <TabsTrigger value="inventorius" className="min-h-11">
            Inventorius
          </TabsTrigger>
        </TabsList>
        <TabsContent value="turai" className="mt-6 space-y-8">
          <TourRoutesCard />
          <Card>
            <CardHeader>
              <CardTitle>Turų datos</CardTitle>
              <CardDescription>Svetainėje turą galima rezervuoti tik čia paskelbtomis datomis. Kiekvienas turas priklauso vienam tipui.</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryEventsList
                category="keturratis"
                emptyText="Būsimų turų nėra. Spauskite „Pridėti turą“."
                extra={(e) => quadTourRoutes.find((r) => r.id === e.tourRouteId)?.name}
                onEdit={(event) => setEditing({ event })}
              />
            </CardContent>
          </Card>
          <ToursTab />
        </TabsContent>
        <TabsContent value="inventorius" className="mt-6 space-y-6">
          <QuadTypesCard />
          <TourAccessoriesCard />
          <QuadSettingsCard />
          <Link href="/admin/klientai?activity=keturraciai" className="text-sm underline underline-offset-4 hover:text-rust">
            Žr. klientus →
          </Link>
        </TabsContent>
      </Tabs>
      {editing ? <TourDepartureDialog key={editing.event?.id ?? "new"} event={editing.event} onOpenChange={(o) => !o && setEditing(null)} /> : null}
    </AdminPage>
  );
}
