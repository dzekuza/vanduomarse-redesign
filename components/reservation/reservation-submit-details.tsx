"use client";

import { useFormContext } from "react-hook-form";
import type { AccountValues } from "./account-step";

/** Submission details and live server errors beside the final account controls. */
export function ReservationSubmitDetails({ payments, payOnSite }: { payments: boolean; payOnSite: boolean }) {
  const { formState } = useFormContext<AccountValues>();
  const error = formState.errors.root;
  const note = payOnSite
    ? "Atsiskaitysi vietoje grynais. Mokėti internetu nereikia. Užklausą patvirtinsime telefonu arba el. paštu."
    : payments
      ? "Apmokėjimas saugus, per Stripe. Kortelės duomenų mes nematome. Vietas laikome 30 min., kol mokate. Apmokėjus užklausas patvirtinsime telefonu arba el. paštu."
      : null;

  if (!note && !error) return null;

  return (
    <div className="space-y-3 text-sm text-copy">
      {note ? <p>{note}</p> : null}
      {error ? <p role="alert" className="text-rust-ink">{error.message}</p> : null}
    </div>
  );
}
