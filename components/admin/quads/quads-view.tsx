"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { QuadSettingsCard } from "./quad-settings-card";
import { QuadTypesCard } from "./quad-types-card";
import { TourAccessoriesCard } from "./tour-accessories-card";
import { TourRoutesCard } from "./tour-routes-card";
import { ToursTab } from "./tours-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_IDS = ["turai", "inventorius"] as const;

/** Keturračiai: tour products and registrations (Turai) and the fleet and rules behind /keturraciai (Inventorius). `?tab=inventorius` opens the settings tab directly. */
export function QuadsView() {
  const { tourTickets, quadRentals } = useAdmin();
  const pendingTours = tourTickets.filter((t) => t.status === "laukia").length + quadRentals.filter((r) => r.tourRouteId && r.status === "laukia").length;
  const requested = useSearchParams().get("tab");
  const initialTab = (TAB_IDS as readonly string[]).includes(requested ?? "") ? requested! : "turai";

  return (
    <AdminPage
      title="Keturračiai"
      description="Turų tipai, rezervacijos ir parko nustatymai. Turus galima rezervuoti bet kuriuo laiku, kol yra laisvų keturračių."
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
    </AdminPage>
  );
}
