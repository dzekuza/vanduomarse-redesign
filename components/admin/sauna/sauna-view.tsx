"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { AdminPage } from "../admin-page";
import { SaunaRatesForm } from "./sauna-rates-form";
import { UpsellsCard } from "./upsells-card";

/** Private sauna hire: hourly rates, booking rules and extras. */
export function SaunaView() {
  return (
    <AdminPage title="Pirtis" description="Privačios pirties kainos, rezervacijos taisyklės ir papildomos paslaugos.">
      <div className="flex gap-3 border border-ink/20 bg-muted p-4 text-sm">
        <InfoIcon size={20} className="mt-0.5 shrink-0 text-rust" />
        <p>
          Pradinės reikšmės – tos pačios, kurias dabar naudoja svetainė. Kol duomenų bazė neprijungta, pakeitimai galioja tik šioje
          sesijoje; prijungus, rezervacijos puslapis jas skaitys iš čia.
        </p>
      </div>
      <SaunaRatesForm />
      <UpsellsCard />
    </AdminPage>
  );
}
