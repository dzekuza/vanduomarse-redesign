"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmPhoneChange, sendPhoneChangeCode } from "@/app/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { phoneDigits } from "@/lib/phone-countries";

/** Adds a phone to the account: number first, then the SMS code; the number counts once the code is confirmed. */
export function AddPhone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    const result = await sendPhoneChangeCode(phone).catch(() => null);
    setBusy(false);
    if (!result || "error" in result) return setError(result?.error.message ?? "Nepavyko išsiųsti kodo. Bandykite dar kartą.");
    setSentTo(result.data.value);
  }

  async function confirm() {
    if (!sentTo) return;
    setBusy(true);
    setError(null);
    const result = await confirmPhoneChange({ phone: sentTo, code }).catch(() => null);
    setBusy(false);
    if (!result || "error" in result) return setError(result?.error.message ?? "Nepavyko patvirtinti. Bandykite dar kartą.");
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="lg" className="border-ink bg-transparent" onClick={() => setOpen(true)}>
        Pridėti telefoną
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {sentTo ? (
        <>
          <Label htmlFor="add-phone-code">Kodas, išsiųstas į {sentTo}</Label>
          <Input id="add-phone-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} />
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" disabled={busy || code.trim().length < 4} onClick={() => void confirm()}>
              Patvirtinti
            </Button>
            <Button type="button" variant="outline" size="lg" className="border-ink bg-transparent" disabled={busy} onClick={() => { setSentTo(null); setCode(""); }}>
              Kitas numeris
            </Button>
          </div>
        </>
      ) : (
        <>
          <Label htmlFor="add-phone">Telefono numeris</Label>
          <PhoneInput id="add-phone" value={phone} onChange={setPhone} />
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" disabled={busy || phoneDigits(phone) < 8} onClick={() => void send()}>
              Siųsti kodą
            </Button>
            <Button type="button" variant="outline" size="lg" className="border-ink bg-transparent" disabled={busy} onClick={() => setOpen(false)}>
              Atšaukti
            </Button>
          </div>
        </>
      )}
      {error ? (
        <p role="alert" className="text-xs text-rust-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
