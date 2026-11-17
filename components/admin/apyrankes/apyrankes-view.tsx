"use client";

import { useSearchParams } from "next/navigation";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { CustomersTab } from "./customers-tab";
import { PassesTab } from "./passes-tab";
import { PlansTab } from "./plans-tab";
import { SalesTab } from "./sales-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_IDS = ["pardavimas", "kodai", "klientai", "planai"] as const;

/** Apyrankės: plan sales (with bracelet scanning), customers and the plan catalogue; check-in scanning lives at Apyrankių skenavimas (`/admin/instruktorius`). Riders live in Klientai (ADR-0042). */
export function ApyrankesView() {
  const { planPasses } = useAdmin();
  const waiting = planPasses.filter((p) => p.status === "apmoketa").length;
  const requested = useSearchParams().get("tab");
  const initialTab = (TAB_IDS as readonly string[]).includes(requested ?? "") ? requested! : "pardavimas";

  return (
    <AdminPage title="Apyrankės" description="Planų pardavimas, abonementų kodai, klientai ir planų katalogas.">
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="pardavimas" className="min-h-11">
            Pardavimas
          </TabsTrigger>
          <TabsTrigger value="kodai" className="min-h-11">
            {waiting > 0 ? `Kodai (${waiting})` : "Kodai"}
          </TabsTrigger>
          <TabsTrigger value="klientai" className="min-h-11">
            Klientai
          </TabsTrigger>
          <TabsTrigger value="planai" className="min-h-11">
            Planai
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pardavimas" className="mt-6">
          <SalesTab />
        </TabsContent>
        <TabsContent value="kodai" className="mt-6">
          <PassesTab />
        </TabsContent>
        <TabsContent value="klientai" className="mt-6">
          <CustomersTab />
        </TabsContent>
        <TabsContent value="planai" className="mt-6">
          <PlansTab />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
