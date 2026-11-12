"use client";

import { useEffect, useState } from "react";
import { confirmStaffCode, sendStaffCode } from "@/app/admin/actions";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { LOGIN_CODE_LENGTH } from "@/lib/customer-schema";

const RESEND_SECONDS = 60;

/** E-mail code sign-in: ask for the address, then for the 8-digit code. A good code redirects to /admin on the server. */
export function CodeLoginForm() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const length = LOGIN_CODE_LENGTH.email;

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function send() {
    const address = (sentTo ?? email).trim();
    if (!address) return setError("Įveskite el. paštą.");
    setBusy(true);
    setError(null);
    const result = await sendStaffCode(address);
    setBusy(false);
    if ("error" in result) return setError(result.error.message);
    setSentTo(address.toLowerCase());
    setCode("");
    setWait(RESEND_SECONDS);
  }

  async function confirm() {
    if (!sentTo || code.length < length) return;
    setBusy(true);
    setError(null);
    const result = await confirmStaffCode(sentTo, code);
    setBusy(false);
    if (result && "error" in result) setError(result.error.message);
  }

  if (!sentTo) {
    return (
      <form
        className="grid gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <FormField id="code-email" label="El. paštas" error={error ?? undefined}>
          <Input id="code-email" type="email" autoComplete="email" className="min-h-11" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <Button type="submit" size="lg" className="min-h-11" disabled={busy}>
          {busy ? "Siunčiama…" : "Gauti kodą"}
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <p id="code-hint" className="text-sm text-copy">
        Jei šis el. paštas turi prieigą, išsiuntėme {length} skaitmenų kodą adresu <span className="wrap-anywhere font-bold text-ink">{sentTo}</span>.
      </p>
      <div className="space-y-2">
        <Label htmlFor="staff-code">Kodas iš laiško</Label>
        <OtpInput
          id="staff-code"
          length={length}
          autoFocus
          invalid={!!error}
          describedBy={`code-hint${error ? " code-error" : ""}`}
          value={code}
          onChange={setCode}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            void confirm();
          }}
        />
        {error ? <p id="code-error" role="alert" className="text-xs text-rust-ink">{error}</p> : null}
      </div>
      <Button type="button" size="lg" className="min-h-11" disabled={busy || code.length < length} onClick={() => void confirm()}>
        {busy ? "Tikrinama…" : "Prisijungti"}
      </Button>
      <Button type="button" variant="ghost" className="min-h-11" disabled={busy} onClick={() => { setSentTo(null); setCode(""); setError(null); }}>
        Naudoti kitą el. paštą
      </Button>
      <Button type="button" variant="link" className="min-h-11 text-xs text-copy" disabled={busy || wait > 0} onClick={() => void send()}>
        {wait > 0 ? `Siųsti kodą dar kartą po ${wait} s` : "Siųsti kodą dar kartą"}
      </Button>
    </div>
  );
}
