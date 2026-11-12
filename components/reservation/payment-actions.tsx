"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cancelUnpaidPayment, resumeCheckout } from "@/app/actions/payments";

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
export function PayAgain({ paymentId, label = "Mokėti dar kartą" }: { paymentId: string; label?: string }) {
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
        {busy ? "Nukreipiame..." : label}
      </button>
      {error ? <p role="alert" className="text-sm text-rust-ink">{error}</p> : null}
    </div>
  );
}

/** On /paskyra, an unpaid reservation: pay it, or give it up (frees the held time). Cancelling asks a second time. */
export function PendingPaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    const result = await cancelUnpaidPayment({ paymentId });
    if ("error" in result) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-6">
        <PayAgain paymentId={paymentId} label="Mokėti" />
        {confirming ? (
          <span className="flex flex-wrap items-center gap-x-4">
            <button type="button" onClick={() => void cancel()} disabled={busy} className="inline-flex min-h-11 items-center border-b border-current text-sm font-bold text-rust-ink disabled:opacity-50">
              {busy ? "Atšaukiame..." : "Taip, atšaukti"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="inline-flex min-h-11 items-center text-sm text-copy">
              Ne
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex min-h-11 items-center text-sm text-copy underline underline-offset-4">
            Atšaukti rezervaciją
          </button>
        )}
      </div>
      {error ? <p role="alert" className="text-sm text-rust-ink">{error}</p> : null}
    </div>
  );
}
