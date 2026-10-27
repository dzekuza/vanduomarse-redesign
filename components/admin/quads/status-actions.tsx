"use client";

import { useTransition } from "react";
import type { BookingStatus } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";

interface StatusActionsProps {
  status: BookingStatus;
  onSet: (status: BookingStatus) => Promise<unknown>;
}

/** The next steps for a request: confirm or reject, mark done, or bring a cancelled one back. */
export function StatusActions({ status, onSet }: StatusActionsProps) {
  const [pending, startTransition] = useTransition();
  const set = (next: BookingStatus) => startTransition(async () => void (await onSet(next)));

  if (status === "laukia") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => set("patvirtinta")} disabled={pending} className="min-h-11 flex-1">
          Patvirtinti
        </Button>
        <Button variant="outline" onClick={() => set("atsaukta")} disabled={pending} className="min-h-11 flex-1">
          Atmesti
        </Button>
      </div>
    );
  }
  if (status === "patvirtinta") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => set("ivykdyta")} disabled={pending} className="min-h-11 flex-1">
          Pažymėti įvykdyta
        </Button>
        <Button variant="outline" onClick={() => set("atsaukta")} disabled={pending} className="min-h-11 flex-1">
          Atšaukti
        </Button>
      </div>
    );
  }
  if (status === "atsaukta") {
    return (
      <Button variant="outline" onClick={() => set("laukia")} disabled={pending} className="min-h-11 w-full">
        Grąžinti į laukiančius
      </Button>
    );
  }
  return null;
}
