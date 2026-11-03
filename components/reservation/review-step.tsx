"use client";

import { useFormContext } from "react-hook-form";
import type { ContactInput } from "@/lib/request-schema";
import type { PlanLine } from "@/lib/reservation";

/** Step 4: everything in one place before it is sent; shows what the server said if it refuses. */
export function ReviewStep({ lines, when, total }: { lines: PlanLine[]; when: string; total: number }) {
  const { getValues, formState } = useFormContext<ContactInput>();
  const c = getValues();
  return (
    <div className="space-y-6">
      <dl className="divide-y divide-line border-y border-line text-sm">
        <Row label="Kada" value={when} />
        {lines.map((l) => (
          <Row key={l.id} label={l.title} hint={l.detail} value={`${l.price} €`} />
        ))}
        <Row label="Iš viso" value={`${total} €`} strong />
        <Row label="Vardas" value={c.customerName} />
        <Row label="Telefonas" value={c.customerPhone || "-"} />
        <Row label="El. paštas" value={c.customerEmail || "-"} />
      </dl>
      <p className="text-sm text-ink/70">
        Statusas: laukia patvirtinimo. Mokėti dabar nereikia, užklausą patvirtinsime telefonu ar el. paštu. Kiekviena veikla gauna savo užklausos numerį.
      </p>
      {formState.errors.root ? <p role="alert" className="text-sm text-rust-ink">{formState.errors.root.message}</p> : null}
    </div>
  );
}

function Row({ label, hint, value, strong }: { label: string; hint?: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="min-w-0">
        <span className={`block ${strong ? "font-bold" : "text-ink/70"}`}>{label}</span>
        {hint ? <span className="block text-ink/60">{hint}</span> : null}
      </dt>
      <dd className="shrink-0 font-bold">{value}</dd>
    </div>
  );
}
