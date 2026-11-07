"use client";

import { useSearchParams } from "next/navigation";
import { AdminPage } from "../admin-page";
import { PlansTab } from "./plans-tab";
import { SalesTab } from "./sales-tab";
import { ScanTab } from "./scan-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_IDS = ["skenavimas", "pardavimas", "planai"] as const;

/** Apyrankės: USB IC/RFID bracelet scanning, plan sales and the plan catalogue. Riders live in Klientai (ADR-0042). */
export function ApyrankesView() {
  const requested = useSearchParams().get("tab");
  const initialTab = (TAB_IDS as readonly string[]).includes(requested ?? "") ? requested! : "skenavimas";

  return (
    <AdminPage title="Apyrankės" description="Apyrankių skenavimas ir planų pardavimas.">
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="skenavimas" className="min-h-11">
            Skenavimas
          </TabsTrigger>
          <TabsTrigger value="pardavimas" className="min-h-11">
            Pardavimas
          </TabsTrigger>
          <TabsTrigger value="planai" className="min-h-11">
            Planai
          </TabsTrigger>
        </TabsList>
        <TabsContent value="skenavimas" className="mt-6">
          <ScanTab />
        </TabsContent>
        <TabsContent value="pardavimas" className="mt-6">
          <SalesTab />
        </TabsContent>
        <TabsContent value="planai" className="mt-6">
          <PlansTab />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
