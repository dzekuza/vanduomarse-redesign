"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveCustomerName, signOutCustomer } from "@/app/actions/customer";
import { AddPhone } from "./add-phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/lib/customer-types";

/** The signed-in customer: how they sign in, the name used on bookings, and sign out. */
export function ProfileCard({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [name, setName] = useState(customer.name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await saveCustomerName(name).catch(() => null);
    setBusy(false);
    if (!result || "error" in result) return setMessage({ text: result?.error.message ?? "Nepavyko išsaugoti. Bandykite dar kartą.", ok: false });
    setMessage({ text: "Išsaugota", ok: true });
    router.refresh();
  }

  async function signOut() {
    setBusy(true);
    await signOutCustomer().catch(() => null);
    router.refresh();
  }

  return (
    <section aria-labelledby="profile-title" className="space-y-5 border border-line p-5 sm:p-6">
      <h2 id="profile-title" className="font-display text-item font-bold uppercase">
        Paskyra
      </h2>
      <dl className="space-y-3 text-sm">
        {customer.phone ? (
          <div>
            <dt className="text-copy">Telefonas</dt>
            <dd className="font-bold">{customer.phone}</dd>
          </div>
        ) : null}
        {customer.email ? (
          <div>
            <dt className="text-copy">El. paštas</dt>
            <dd className="wrap-anywhere font-bold">{customer.email}</dd>
          </div>
        ) : null}
      </dl>
      {customer.phone ? null : (
        <div className="space-y-2">
          <p className="text-sm text-copy">Telefonas</p>
          <AddPhone />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Vardas, pavardė</Label>
        <Input id="profile-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        {message ? (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-xs text-copy" : "text-xs text-rust-ink"}>
            {message.text}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" size="lg" disabled={busy || name.trim().length < 2 || name.trim() === customer.name} onClick={() => void save()}>
          Išsaugoti
        </Button>
        <Button type="button" variant="outline" size="lg" className="border-ink bg-transparent" disabled={busy} onClick={() => void signOut()}>
          Atsijungti
        </Button>
      </div>
    </section>
  );
}
