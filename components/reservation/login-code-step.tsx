"use client";

import { KeyIcon } from "@phosphor-icons/react";
import { useId } from "react";
import type { CodeSent } from "@/app/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginCodeStepProps {
  target: CodeSent;
  code: string;
  busy: boolean;
  error: string | null;
  wait: number;
  onCode: (code: string) => void;
  onConfirm: () => void;
  onResend: () => void;
  onChangeContact: () => void;
}

/** The code view shares one accessible field for typing, pasting and SMS autofill. */
export function LoginCodeStep({ target, code, busy, error, wait, onCode, onConfirm, onResend, onChangeContact }: LoginCodeStepProps) {
  const id = useId();
  const disabled = busy || code.length < 4;

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-6">
      <header className="space-y-2 text-center">
        <h3 id={`${id}-title`} className="text-heading font-bold">Patvirtinimo kodas</h3>
        <p id={`${id}-hint`} className="text-sm leading-relaxed text-copy">
          Įvesk kodą, kurį išsiuntėme {target.channel === "phone" ? "SMS numeriu" : "el. paštu"}{" "}
          <span className="wrap-anywhere font-bold text-ink">{target.value}</span>.
        </p>
      </header>
      <div className="space-y-2">
        <Label htmlFor={`${id}-code`}>Patvirtinimo kodas</Label>
        <div className="relative">
          <KeyIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-copy" />
          <Input
            id={`${id}-code`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="000000"
            autoFocus
            aria-invalid={!!error}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            value={code}
            onChange={(event) => onCode(event.target.value.replace(/\D/g, ""))}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (!disabled) onConfirm();
            }}
            className="h-14 rounded-none bg-transparent px-12 text-center text-figure! tracking-widest"
          />
        </div>
        {error ? <p id={`${id}-error`} role="alert" className="text-xs text-rust-ink">{error}</p> : null}
      </div>
      <div className="space-y-2">
        <Button type="button" size="lg" className="w-full rounded-none" disabled={disabled} onClick={onConfirm}>
          {busy ? "Tikrinama..." : "Patvirtinti kodą"}
        </Button>
        <Button type="button" variant="ghost" className="h-auto min-h-11 w-full whitespace-normal rounded-none py-2 text-center text-xs" disabled={busy} onClick={onChangeContact}>
          {target.channel === "phone" ? "Naudoti kitą telefono numerį" : "Naudoti kitą el. paštą"}
        </Button>
        <div className="text-center">
          <Button type="button" variant="link" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-center text-xs text-copy" disabled={busy || wait > 0} onClick={onResend}>
            {wait > 0 ? `Siųsti kodą dar kartą po ${wait} s` : "Siųsti kodą dar kartą"}
          </Button>
        </div>
      </div>
    </section>
  );
}
