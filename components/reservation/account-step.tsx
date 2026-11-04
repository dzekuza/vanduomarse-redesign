"use client";

import { useId, useState } from "react";
import { useFormContext } from "react-hook-form";
import { signOutCustomer } from "@/app/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/lib/customer-types";
import { LoginForm } from "./login-form";

export interface AccountValues {
  customerName: string;
}

/**
 * Checkout step: sign in or create an account (`LoginForm`), then the name for the booking. Sits inside
 * the reservation form, so Enter in its fields must not submit that form.
 */
export function AccountStep({ customer, onCustomer }: { customer: Customer | null; onCustomer: (customer: Customer | null) => void }) {
  const { register, setValue, getValues, formState } = useFormContext<AccountValues>();
  const id = useId();
  const [busy, setBusy] = useState(false);

  async function switchAccount() {
    setBusy(true);
    await signOutCustomer().catch(() => null);
    setBusy(false);
    setValue("customerName", "");
    onCustomer(null);
  }

  if (!customer) {
    return (
      <div key="login">
        <LoginForm
          onCustomer={(signedIn) => {
            if (!getValues("customerName") && signedIn.name) setValue("customerName", signedIn.name);
            onCustomer(signedIn);
          }}
        />
      </div>
    );
  }

  return (
    <div key="account" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line p-4">
        <div className="min-w-0 text-sm">
          <p className="text-copy">Prisijungta</p>
          <p className="wrap-anywhere font-bold">{customer.phone ?? customer.email}</p>
          {customer.phone && customer.email ? <p className="wrap-anywhere text-copy">{customer.email}</p> : null}
        </div>
        <Button type="button" variant="outline" size="lg" className="border-ink bg-transparent" disabled={busy} onClick={() => void switchAccount()}>
          Keisti paskyrą
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-name`}>Vardas, pavardė</Label>
        <Input id={`${id}-name`} autoComplete="name" aria-invalid={!!formState.errors.customerName} {...register("customerName")} />
        {formState.errors.customerName?.message ? (
          <p role="alert" className="text-xs text-rust-ink">
            {formState.errors.customerName.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
