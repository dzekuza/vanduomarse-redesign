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
      {/* Side by side only from xl: with the admin sidebar open, an lg side column is ~230 px and squeezes the rows. Below xl the side cards sit under the sessions, two per row from md. */}
      <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
        <div className="min-w-0 xl:col-span-2">
          <ProgramsCard />
        </div>
        <div className="grid min-w-0 gap-6 md:grid-cols-2 md:items-start xl:grid-cols-1">
          <SaunasCard />
          <MastersCard />
          <UpsellsCard />
        </div>
      </div>
    </AdminPage>
  );
}
