"use client";

import { useSearchParams } from "next/navigation";
import { AdminPage } from "../admin-page";
import { PlansTab } from "./plans-tab";
import { RidersTab } from "./riders-tab";
import { SalesTab } from "./sales-tab";
import { ScanTab } from "./scan-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_IDS = ["skenavimas", "pardavimas", "nariai", "planai"] as const;

/** Apyrankės: USB IC/RFID bracelet scanning, plan sales, riders and the plan catalogue. */
export function ApyrankesView() {
  const requested = useSearchParams().get("tab");
  const initialTab = (TAB_IDS as readonly string[]).includes(requested ?? "") ? requested! : "skenavimas";

  return (
    <AdminPage title="Apyrankės" description="Apyrankių skenavimas, planų pardavimas ir naudotojų sąrašas.">
      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="skenavimas" className="min-h-11">
            Skenavimas
          </TabsTrigger>
          <TabsTrigger value="pardavimas" className="min-h-11">
            Pardavimas
          </TabsTrigger>
          <TabsTrigger value="nariai" className="min-h-11">
            Naudotojai
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
        <TabsContent value="nariai" className="mt-6">
          <RidersTab />
        </TabsContent>
        <TabsContent value="planai" className="mt-6">
          <PlansTab />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}
