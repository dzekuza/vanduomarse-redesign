"use client";

import { useEffect, useRef } from "react";
import { CardScanner, type CardScannerOptions, type ScanMeta } from "@/lib/card-scanner";

export interface UseCardScannerOptions extends Omit<CardScannerOptions, "onScan" | "onCommand"> {
  /** Listen only while true. Default true. */
  enabled?: boolean;
  onScan: (cardNumber: string, meta: ScanMeta) => void;
  onCommand?: (raw: string) => void;
}

/** React hook over CardScanner: one document keydown listener, active while `enabled`. */
export function useCardScanner({ enabled = true, onScan, onCommand, idleTimeoutMs, minDigits, mode, stripPercentPrefix, target }: UseCardScannerOptions): void {
  const onScanRef = useRef(onScan);
  const onCommandRef = useRef(onCommand);

  useEffect(() => {
    onScanRef.current = onScan;
    onCommandRef.current = onCommand;
  });

  useEffect(() => {
    if (!enabled) return;

    const scanner = new CardScanner({
      idleTimeoutMs,
      minDigits,
      mode,
      stripPercentPrefix,
      target,
      onScan: (cardNumber, meta) => onScanRef.current(cardNumber, meta),
      onCommand: (raw) => onCommandRef.current?.(raw),
    });

    scanner.start();
    return () => scanner.destroy();
  }, [enabled, idleTimeoutMs, minDigits, mode, stripPercentPrefix, target]);
}
