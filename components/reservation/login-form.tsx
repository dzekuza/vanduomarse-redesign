"use client";

import { useEffect, useState, useId } from "react";
import { confirmLoginCode, sendLoginCode, type CodeSent } from "@/app/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { phoneDigits } from "@/lib/phone-countries";
import type { Customer } from "@/lib/customer-types";
import type { LoginTarget } from "@/lib/customer-schema";
import { LoginCodeStep } from "./login-code-step";

type Channel = LoginTarget["channel"];

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "phone", label: "Telefonu" },
  { id: "email", label: "El. paštu" },
];

/** When the resend button unlocks, as a timestamp. */
const secondsFromNow = (s: number) => Date.now() + s * 1000;

/** Seconds left until `at` (ms since epoch), ticking once a second. */
function useSecondsUntil(at: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [at]);
  return Math.max(0, Math.ceil((at - now) / 1000));
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-xs text-rust-ink">
      {message}
    </p>
  ) : null;
}

/**
 * Sign in or create an account with a one-time code sent to a phone or an email (an unknown phone or
 * email gets a new account). Used by the checkout step and the account page, so Enter in its fields
 * must not submit a surrounding form.
 */
export function LoginForm({ onCustomer, showAccountNote = true }: { onCustomer: (customer: Customer) => void; showAccountNote?: boolean }) {
  const id = useId();
  const [channel, setChannel] = useState<Channel>("phone");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<{ to: CodeSent; resendAt: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wait = useSecondsUntil(sent?.resendAt ?? 0);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const result = await sendLoginCode({ channel, value });
      if ("error" in result) return setError(result.error.message);
      setSent({ to: result.data, resendAt: secondsFromNow(result.data.resendIn) });
      setCode("");
    } catch {
      setError("Nepavyko išsiųsti kodo. Patikrinkite ryšį ir bandykite dar kartą.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!sent) return;
    setBusy(true);
    setError(null);
    try {
      const result = await confirmLoginCode({ channel: sent.to.channel, value: sent.to.value, code });
      if ("error" in result) return setError(result.error.message);
      setSent(null);
      onCustomer(result.data);
    } catch {
      setError("Nepavyko patikrinti kodo. Bandykite dar kartą.");
    } finally {
      setBusy(false);
    }
  }

  /** Enter sends or confirms; it must not submit a form around this one. */
  const onEnter = (action: () => void) => (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!busy) action();
  };

  if (sent) {
    return (
      <LoginCodeStep
        key="code"
        target={sent.to}
        code={code}
        busy={busy}
        error={error}
        wait={wait}
        onCode={setCode}
        onConfirm={() => void confirm()}
        onResend={() => void send()}
        onChangeContact={() => { setSent(null); setError(null); }}
      />
    );
  }

  return (
    <div key="start" className="space-y-4">
      <div role="group" aria-label="Prisijungimo būdas" className="grid grid-cols-2 border border-line">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={channel === c.id}
            onClick={() => { setChannel(c.id); setValue(""); setError(null); }}
            className={`min-h-11 text-sm font-bold ${channel === c.id ? "bg-ink text-dust" : "text-ink hover:bg-ink/5"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-contact`}>{channel === "phone" ? "Telefono numeris" : "El. paštas"}</Label>
        {channel === "phone" ? (
          <div onKeyDown={onEnter(() => void send())}>
            <PhoneInput id={`${id}-contact`} value={value} onChange={setValue} invalid={!!error} />
          </div>
        ) : (
          <Input
            id={`${id}-contact`}
            type="email"
            autoComplete="email"
            placeholder="vardas@pastas.lt"
            aria-invalid={!!error}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onEnter(() => void send())}
          />
        )}
        <FieldError message={error ?? undefined} />
      </div>
      <Button type="button" variant="default" size="lg" className="w-full sm:w-auto" disabled={busy || (channel === "phone" ? phoneDigits(value) < 8 : value.trim().length < 5)} onClick={() => void send()}>
        {busy ? "Siunčiama..." : "Siųsti kodą"}
      </Button>
      {showAccountNote ? <p className="text-sm text-copy">Jei paskyros dar nėra, ją sukursime. Slaptažodžio nereikia.</p> : null}
    </div>
  );
}
