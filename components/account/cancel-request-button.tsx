"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cancelMyRequest } from "@/app/actions/cancel-request";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MAIN_CONTACT, telHref } from "@/lib/contacts";
import { CANCEL_REFUND_HOURS } from "@/lib/request-cancel";
import type { MyRequest } from "@/lib/account";

const KIND = { pirtis: "booking", nakvyne: "booking", keturraciai: "rental", renginys: "ticket" } as const;

const euro = (amount: number) => `${Number.isInteger(amount) ? amount : amount.toFixed(2).replace(".", ",")} €`;

/** "Atšaukti rezervaciją" for one request: asks first, says what is refunded, then cancels. Paid and under 24 h to go: asks to call. */
export function CancelRequestButton({ request }: { request: MyRequest }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (request.cancel === "no") return null;
  if (request.cancel === "late") {
    return (
      <p className="max-w-xs text-sm text-copy">
        Atšaukti internetu galima likus bent {CANCEL_REFUND_HOURS} val. iki pradžios. Skambinkite{" "}
        <a href={telHref(MAIN_CONTACT.phone)} className="font-bold underline">
          {MAIN_CONTACT.phone}
        </a>
        .
      </p>
    );
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    const result = await cancelMyRequest({ kind: KIND[request.kind], id: request.id });
    setBusy(false);
    if ("error" in result) return setError(result.error.message);
    setOpen(false);
    toast.success(
      result.data.refundFailed
        ? `${request.reference} atšaukta. Pinigus grąžinsime ranka, susisieksime.`
        : result.data.refunded > 0
          ? `${request.reference} atšaukta. Grąžiname ${euro(result.data.refunded)} į jūsų kortelę.`
          : `${request.reference} atšaukta.`,
    );
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" className="min-h-11" onClick={() => setOpen(true)}>
        Atšaukti rezervaciją
      </Button>
      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Atšaukti {request.reference}?</DialogTitle>
            <DialogDescription>
              {request.title}, {request.date}. {request.refund > 0 ? `Grąžinsime ${euro(request.refund)} į kortelę, kuria mokėjote (kelios darbo dienos).` : "Šio veiksmo atšaukti negalėsite."}
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Palikti
            </Button>
            <Button variant="destructive" disabled={busy} onClick={() => void confirm()}>
              Taip, atšaukti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
