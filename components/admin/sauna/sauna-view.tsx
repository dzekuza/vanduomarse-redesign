"use client";

import { AdminPage } from "../admin-page";
import { MastersCard } from "./masters-card";
import { ProgramsCard } from "./programs-card";
import { SaunasCard } from "./saunas-card";
import { UpsellsCard } from "./upsells-card";

/** Private sauna hire: the saunas (each with its rates, photos and extras), the pirtininkai and the shared extras catalogue. */
export function SaunaView() {
  return (
    <AdminPage title="Pirtys" description="Pirčių aprašymai, nuotraukos, kainos ir priedai. Pakeitimai iš karto rodomi rezervacijos puslapyje.">
      <div className="grid gap-6 lg:grid-cols-10 lg:items-start">
        <div className="lg:col-span-7">
          <ProgramsCard />
        </div>
        <div className="space-y-6 lg:col-span-3">
          <SaunasCard />
          <MastersCard />
          <UpsellsCard />
        </div>
      </div>
    </AdminPage>
  );
}
