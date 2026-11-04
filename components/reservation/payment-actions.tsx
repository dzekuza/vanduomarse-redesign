"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resumeCheckout } from "@/app/actions/payments";

/** The webhook can land a moment after Stripe sends the visitor back: re-read the status a few times. */
export function PaymentPoller({ every = 2500, max = 12 }: { every?: number; max?: number }) {
  const router = useRouter();
  useEffect(() => {
    let runs = 0;
    const id = setInterval(() => {
      runs += 1;
      router.refresh();
      if (runs >= max) clearInterval(id);
    }, every);
    return () => clearInterval(id);
  }, [router, every, max]);
  return null;
}

/** Back to Stripe for a payment that is still open. */
export function PayAgain({ paymentId }: { paymentId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const result = await resumeCheckout({ paymentId });
    if ("error" in result) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    window.location.assign(result.data.url);
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => void go()} disabled={busy} className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold disabled:opacity-50">
        {busy ? "Nukreipiame..." : "Mokėti dar kartą"}
      </button>
      {error ? <p role="alert" className="text-sm text-rust-ink">{error}</p> : null}
    </div>
  );
}
