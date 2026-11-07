"use client";

import { ScanIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useCardScanner } from "@/hooks/use-card-scanner";
import { cn } from "@/lib/utils";

interface ScanTargetProps {
  enabled: boolean;
  onScan: (cardNumber: string) => void;
  title: string;
  subtitle?: string;
}

/** A tap-to-scan surface: active while mounted + enabled, flashes on each read. Keep only one enabled at a time. */
export function ScanTarget({ enabled, onScan, title, subtitle }: ScanTargetProps) {
  const [flash, setFlash] = useState(false);

  useCardScanner({
    enabled,
    onScan: (cardNumber) => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 300);
      onScan(cardNumber);
    },
  });

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div
        className={cn(
          "flex size-40 items-center justify-center rounded-full transition-colors duration-300",
          enabled ? "bg-primary" : "bg-muted",
          flash && "scale-105",
        )}
      >
        <ScanIcon size={80} className={enabled ? "text-primary-foreground" : "text-muted-foreground"} />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold">{title}</p>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}
