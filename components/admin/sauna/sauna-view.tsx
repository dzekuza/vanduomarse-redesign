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
          Pakeitimai išsaugomi iš karto ir rodomi pirties rezervacijos puslapyje. Renginių skaičiuoklė kol kas naudoja kainoraščio
          kainas.
        </p>
      </div>
      <SaunaRatesForm />
      <UpsellsCard />
    </AdminPage>
  );
}
