"use client";

import { useId } from "react";
import type { CodeSent } from "@/app/actions/customer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { LOGIN_CODE_LENGTH } from "@/lib/customer-schema";

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
  const length = LOGIN_CODE_LENGTH[target.channel];
  const disabled = busy || code.length < length;

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-6">
      <header className="space-y-2">
        <h3 id={`${id}-title`} className="text-heading font-bold">Patvirtinimo kodas</h3>
        <p id={`${id}-hint`} className="text-sm leading-relaxed text-copy">
          Įvesk kodą, kurį išsiuntėme {target.channel === "phone" ? "SMS numeriu" : "el. paštu"}{" "}
          <span className="wrap-anywhere font-bold text-ink">{target.value}</span>.
        </p>
      </header>
      <div className="space-y-2">
        <Label htmlFor={`${id}-code`}>Patvirtinimo kodas</Label>
        <OtpInput
          id={`${id}-code`}
          length={length}
          autoFocus
          invalid={!!error}
          describedBy={`${id}-hint${error ? ` ${id}-error` : ""}`}
          value={code}
          onChange={onCode}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (!disabled) onConfirm();
          }}
        />
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
