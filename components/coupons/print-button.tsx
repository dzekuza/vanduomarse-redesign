"use client";

import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog; "Save as PDF" there produces the voucher PDF. */
export function PrintButton() {
  return (
    <Button type="button" size="lg" className="min-h-11" onClick={() => window.print()}>
      Atsisiųsti PDF
    </Button>
  );
}
