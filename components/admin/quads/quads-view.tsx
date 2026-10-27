"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { NewRentalDialog } from "./new-rental-dialog";
import { QuadSettingsCard } from "./quad-settings-card";
import { QuadTypesCard } from "./quad-types-card";
import { RentalsTab } from "./rentals-tab";
import { ToursTab } from "./tours-tab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Keturračiai: hourly rental requests, tour registrations, and the fleet and rules behind /keturraciai. */
export function QuadsView() {
  const { quadRentals, tourTickets } = useAdmin();
  const [creating, setCreating] = useState(false);
  const pendingRentals = quadRentals.filter((r) => r.status === "laukia").length;
  const pendingTours = tourTickets.filter((t) => t.status === "laukia").length;

  return (
    <AdminPage
      title="Keturračiai"
      description="Nuomos užklausos iš /keturraciai, registracijos į žygius ir parko nustatymai."
      actions={
        <Button onClick={() => setCreating(true)} className="min-h-11">
          <PlusIcon size={18} /> Nauja nuoma
        </Button>
      }
    >
      <Tabs defaultValue="nuoma">
        <TabsList>
          <TabsTrigger value="nuoma" className="min-h-11">
            Nuoma{pendingRentals ? ` (${pendingRentals})` : ""}
          </TabsTrigger>
          <TabsTrigger value="zygiai" className="min-h-11">
            Žygiai{pendingTours ? ` (${pendingTours})` : ""}
          </TabsTrigger>
          <TabsTrigger value="parkas" className="min-h-11">
            Parkas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="nuoma" className="mt-6">
          <RentalsTab />
        </TabsContent>
        <TabsContent value="zygiai" className="mt-6">
          <ToursTab />
        </TabsContent>
        <TabsContent value="parkas" className="mt-6 space-y-6">
          <QuadTypesCard />
          <QuadSettingsCard />
        </TabsContent>
      </Tabs>
      {creating ? <NewRentalDialog onOpenChange={(o) => !o && setCreating(false)} /> : null}
    </AdminPage>
  );
}
