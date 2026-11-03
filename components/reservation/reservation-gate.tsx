"use client";

import type { ReactNode } from "react";
import { PhoneGate } from "@/components/booking/phone-gate";
import { usePhoneVerification } from "@/hooks/use-phone-verification";

/** Phone gate: the page title and a narrow card until the number is verified, then the full-width reservation layout. */
export function ReservationGate({ header, children }: { header: ReactNode; children: ReactNode }) {
  const verification = usePhoneVerification();
  if (verification) return <>{children}</>;
  return (
    <div className="space-y-10 px-gutter pt-10 pb-16 md:pt-14 md:pb-24">
      {header}
      <div className="max-w-xl">
        <PhoneGate>{children}</PhoneGate>
      </div>
    </div>
  );
}
