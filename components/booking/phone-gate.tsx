"use client";

import { useState } from "react";
import { usePhoneVerification } from "@/hooks/use-phone-verification";
import { PhoneCodeStep, PhoneNumberStep } from "./phone-verify-steps";

/**
 * Nothing books until the visitor proves their phone: number → SMS code →
 * the wrapped flow. The verification is shared by the whole tab (and every gate
 * on the page), and ContactFields fills in and locks the verified number.
 */
export function PhoneGate({ children }: { children: React.ReactNode }) {
  const verification = usePhoneVerification();
  const [sent, setSent] = useState<{ phone: string; resendAt: number } | null>(null);

  if (verification) return <>{children}</>;
  if (sent) {
    return (
      <PhoneCodeStep
        phone={sent.phone}
        resendAt={sent.resendAt}
        // A resend can finish after "Keisti numerį": only update the step it was sent from.
        onResent={(resendAt) => setSent((s) => (s?.phone === sent.phone ? { ...s, resendAt } : s))}
        onChangeNumber={() => setSent(null)}
      />
    );
  }
  return <PhoneNumberStep onSent={(phone, resendAt) => setSent({ phone, resendAt })} />;
}
