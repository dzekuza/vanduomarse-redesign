"use client";

import { Cta, TextCtaArrow, textCtaClass } from "@/components/cta";
import type { ReactNode } from "react";
import type { ServiceId } from "./content";
import { useLanding } from "./landing-provider";

/** Button CTA that opens an activity's dialog. */
export function ServiceCta({ service, tone, small, className, children }: { service: ServiceId; tone: "coral" | "cream" | "dark"; small?: boolean; className?: string; children: ReactNode }) {
  const { openService } = useLanding();
  return (
    <Cta tone={tone} small={small} className={className} onClick={() => openService(service)}>
      {children}
    </Cta>
  );
}

/** Underlined text button that opens an activity's dialog. */
export function ServiceTextCta({ service, className, children }: { service: ServiceId; className?: string; children: ReactNode }) {
  const { openService } = useLanding();
  return (
    <button type="button" onClick={() => openService(service)} className={textCtaClass(className)}>
      {children}
      <TextCtaArrow />
    </button>
  );
}
