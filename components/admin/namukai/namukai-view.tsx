"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { AdminPage } from "../admin-page";
import { StayTypeDialog } from "./stay-type-dialog";
import { StayTypesCard } from "./stay-types-card";
import type { StayKind } from "@/lib/cabin";
import { Button } from "@/components/ui/button";

/** Namukai: the cabin sizes and camper pitches guests can book on /rezervacija, with their price, guest limit and stock. */
export function NamukaiView() {
  const [creating, setCreating] = useState<StayKind | null>(null);

  return (
    <AdminPage
      title="Namukai"
      description="Namelių ir kemperių aikštelių tipai, kainos ir kiekiai. Pakeitimai iškart matomi rezervacijos puslapyje."
      actions={
        <Button onClick={() => setCreating("namelis")} className="min-h-11">
          <PlusIcon size={18} /> Naujas tipas
        </Button>
      }
    >
      <StayTypesCard
        kind="namelis"
        title="Nameliai"
        description="Kiekvienas tipas turi savo kainą ir namelių skaičių. Išjungtas tipas dingsta iš svetainės, bet senos rezervacijos lieka."
        onCreate={() => setCreating("namelis")}
      />
      <StayTypesCard
        kind="kemperis"
        title="Kemperių aikštelės"
        description="Palikite kiekį tuščią, jei vietų skaičius neribojamas."
        onCreate={() => setCreating("kemperis")}
      />
      {creating ? <StayTypeDialog key={creating} kind={creating} onOpenChange={(open) => !open && setCreating(null)} /> : null}
    </AdminPage>
  );
}
