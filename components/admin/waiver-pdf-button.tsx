"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { useTransition } from "react";
import { useAdmin } from "./admin-store";
import { downloadBase64 } from "@/lib/download";
import { Button } from "@/components/ui/button";

/** Builds the customer's signed rules (the rules text with the signature below) as a PDF and saves it. */
export function WaiverPdfButton({ riderId, className }: { riderId: string; className?: string }) {
  const { riderWaiverPdf } = useAdmin();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await riderWaiverPdf(riderId);
          if ("data" in result) downloadBase64(result.data.base64, result.data.fileName, "application/pdf");
        })
      }
    >
      <DownloadSimpleIcon size={16} /> {pending ? "Ruošiama..." : "Atsisiųsti PDF"}
    </Button>
  );
}
