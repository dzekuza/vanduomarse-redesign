"use client";

import { useEffect, useState } from "react";
import { resendCouponEmail } from "@/app/actions/coupons";
import { Button } from "@/components/ui/button";

/** Copy the code, open the printable voucher, and send the email again (once every couple of minutes). */
export function CouponCodeActions({ code, sessionId }: { code: string; sessionId: string }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setMessage({ text: "Nepavyko nukopijuoti. Pažymėkite kodą ir kopijuokite ranka.", ok: false });
    }
  }

  async function resend() {
    setBusy(true);
    setMessage(null);
    const result = await resendCouponEmail(sessionId);
    setBusy(false);
    setMessage("error" in result ? { text: result.error.message, ok: false } : { text: "Laišką išsiuntėme į jūsų el. paštą. Patikrinkite ir šiukšliadėžę.", ok: true });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="min-h-11 border-ink bg-transparent" onClick={() => void copy()}>
          {copied ? "Nukopijuota" : "Kopijuoti kodą"}
        </Button>
        <Button asChild variant="outline" className="min-h-11 border-ink bg-transparent">
          <a href={`/kuponai/kuponas?sid=${encodeURIComponent(sessionId)}`} target="_blank" rel="noreferrer">
            Atsisiųsti PDF
          </a>
        </Button>
      </div>
      <div>
        <button type="button" disabled={busy} onClick={() => void resend()} className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold disabled:opacity-50">
          {busy ? "Siunčiama..." : "Negavote laiško? Siųsti dar kartą"}
        </button>
        {message ? (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-copy" : "text-sm text-rust-ink"}>
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
