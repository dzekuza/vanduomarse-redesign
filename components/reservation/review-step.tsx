"use client";

import { useFormContext } from "react-hook-form";
import type { Customer } from "@/lib/customer-types";
import type { PlanLine } from "@/lib/reservation";

/** Step 4: everything in one place before it is sent or paid; shows what the server said if it refuses. */
export function ReviewStep({ lines, when, total, payments, customer }: { lines: PlanLine[]; when: string; total: number; payments: boolean; customer: Customer | null }) {
  const { getValues, formState } = useFormContext<{ customerName: string }>();
  const name = getValues("customerName");
  return (
    <div className="space-y-6">
      <dl className="divide-y divide-line border-y border-line text-sm">
        <Row label="Kada" value={when} />
        {lines.map((l) => (
          <Row key={l.id} label={l.title} hint={l.detail} value={`${l.price} €`} />
        ))}
        <Row label="Iš viso" value={`${total} €`} strong />
        <Row label="Vardas" value={name} />
        <Row label="Telefonas" value={customer?.phone ?? "-"} />
        <Row label="El. paštas" value={customer?.email ?? "-"} />
      </dl>
      <p className="text-sm text-copy">
        {payments
          ? "Apmokėjimas saugus, per Stripe; kortelės duomenų mes nematome. Vietas laikome 30 min., kol mokate. Apmokėjus užklausas patvirtinsime telefonu ar el. paštu; kiekviena veikla gauna savo užklausos numerį."
          : "Statusas: laukia patvirtinimo. Mokėti dabar nereikia, užklausą patvirtinsime telefonu ar el. paštu. Kiekviena veikla gauna savo užklausos numerį."}
      </p>
      {formState.errors.root ? <p role="alert" className="text-sm text-rust-ink">{formState.errors.root.message}</p> : null}
    </div>
  );
}

function Row({ label, hint, value, strong }: { label: string; hint?: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="min-w-0">
        <span className={`block ${strong ? "font-bold" : "text-copy"}`}>{label}</span>
        {hint ? <span className="block text-copy">{hint}</span> : null}
      </dt>
      <dd className="shrink-0 font-bold">{value}</dd>
    </div>
  );
}
