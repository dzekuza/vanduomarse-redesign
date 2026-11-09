"use client";

import { PlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { AdminPage } from "../admin-page";
import { ProgramsCard } from "./programs-card";
import { SaunasCard } from "./saunas-card";
import { UpsellsCard } from "./upsells-card";
import { Button } from "@/components/ui/button";

/** Private sauna hire: the saunas (each with its rates, photos and extras) and the shared extras catalogue. */
export function SaunaView() {
  return (
    <AdminPage
      title="Pirtys"
      description="Pirčių aprašymai, nuotraukos, kainos ir papildomos paslaugos. Pakeitimai iš karto rodomi rezervacijos puslapyje."
      actions={
        <Button asChild>
          <Link href="/admin/pirtis/nauja">
            <PlusIcon size={18} /> Nauja pirtis
          </Link>
        </Button>
      }
    >
      <SaunasCard />
      <ProgramsCard />
      <UpsellsCard />
      <Link href="/admin/klientai" className="text-sm underline underline-offset-4 hover:text-rust">
        Žr. klientus →
      </Link>
    </AdminPage>
  );
}
