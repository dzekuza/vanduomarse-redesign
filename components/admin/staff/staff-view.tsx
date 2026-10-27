"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { AdminPage } from "../admin-page";
import { AddStaffDialog } from "./add-staff-dialog";
import { RolesTab } from "./roles-tab";
import { StaffList } from "./staff-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Owner-only: who can sign in to the admin and which pages each role opens. */
export function StaffView() {
  const [adding, setAdding] = useState(false);
  return (
    <AdminPage
      title="Darbuotojai"
      description="Sukurkite prisijungimus ir nustatykite, kuriuos skyrius kiekvienas mato. Teisės galioja ir duomenų bazėje, ne tik meniu."
      actions={
        <Button onClick={() => setAdding(true)} className="min-h-11">
          <PlusIcon size={18} /> Pridėti darbuotoją
        </Button>
      }
    >
      <Tabs defaultValue="darbuotojai">
        <TabsList>
          <TabsTrigger value="darbuotojai" className="min-h-11">
            Darbuotojai
          </TabsTrigger>
          <TabsTrigger value="roles" className="min-h-11">
            Rolės
          </TabsTrigger>
        </TabsList>
        <TabsContent value="darbuotojai" className="mt-6">
          <StaffList />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <RolesTab />
        </TabsContent>
      </Tabs>
      {adding ? <AddStaffDialog onOpenChange={(o) => !o && setAdding(false)} /> : null}
    </AdminPage>
  );
}
