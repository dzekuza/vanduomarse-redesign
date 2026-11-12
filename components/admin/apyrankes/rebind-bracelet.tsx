"use client";

import { useAdmin } from "../admin-store";
import { ScanTarget } from "./scan-target";
import type { Rider } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";

interface RebindBraceletProps {
  rider: Rider;
  /** Called when the scan is done or cancelled; `notice` says when the bracelet was moved from someone else. */
  onDone: (notice: string | null) => void;
}

/** Scan a bracelet and bind it to one customer, replacing any earlier one. Shared by Klientai and Apyrankės > Klientai. */
export function RebindBracelet({ rider, onDone }: RebindBraceletProps) {
  const { bindRiderCard } = useAdmin();

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <p className="text-center text-sm text-muted-foreground">
        Priglauskite apyrankę, kurią priskirti{" "}
        <span className="font-medium text-foreground">
          {rider.name} {rider.surname}
        </span>
        .
      </p>
      <ScanTarget
        enabled
        title="Priglauskite apyrankę"
        subtitle="Tai pakeis bet kurią ankstesnę šio naudotojo apyrankę"
        onScan={async (cardNumber) => {
          const result = await bindRiderCard(cardNumber, rider.id);
          onDone(
            "data" in result && result.data.replaced
              ? `Apyrankė ${cardNumber} perkelta nuo ${result.data.replaced.name} ${result.data.replaced.surname}.`
              : null,
          );
        }}
      />
      <Button variant="outline" onClick={() => onDone(null)}>
        Atšaukti
      </Button>
    </div>
  );
}
