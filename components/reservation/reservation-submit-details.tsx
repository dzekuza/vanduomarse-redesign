"use client";

import { useFormContext } from "react-hook-form";
import type { AccountValues } from "./account-step";

/** Submission details and live server errors beside the final account controls. */
export function ReservationSubmitDetails({ payments, payOnSite, preview }: { payments: boolean; payOnSite: boolean; preview: boolean }) {
  const { formState } = useFormContext<AccountValues>();
  return (
    <div className="space-y-3 text-sm text-copy">
      <p>{preview
        ? "Keturračių turas kol kas yra dizaino peržiūra. Baigus peržiūrą rezervacija nepateikiama ir mokėti nereikia."
        : payOnSite
          ? "Atsiskaitysi vietoje grynais. Mokėti internetu nereikia. Užklausą patvirtinsime telefonu arba el. paštu."
        : payments
          ? "Apmokėjimas saugus, per Stripe. Kortelės duomenų mes nematome. Vietas laikome 30 min., kol mokate. Apmokėjus užklausas patvirtinsime telefonu arba el. paštu."
          : "Užklausą patvirtinsime telefonu arba el. paštu. Mokėti dabar nereikia. Kiekviena veikla gauna savo užklausos numerį."}</p>
      {formState.errors.root ? <p role="alert" className="text-rust-ink">{formState.errors.root.message}</p> : null}
    </div>
  );
}
