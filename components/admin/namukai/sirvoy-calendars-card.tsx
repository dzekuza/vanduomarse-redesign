"use client";

import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { SirvoyFeedRow } from "./sirvoy-feed-row";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The 14 Sirvoy rooms, each with its iCal export address. A reservation Sirvoy holds for a room (Booking.com or the
 * front desk) takes one cabin of that room's type on those nights, here and on /rezervacija. One way only.
 */
export function SirvoyCalendarsCard() {
  const { externalCalendars, stayTypes, syncExternalNow } = useAdmin();
  const [syncing, setSyncing] = useState(false);
  const connected = externalCalendars.filter((c) => c.active).length;

  const sync = async () => {
    setSyncing(true);
    const result = await syncExternalNow();
    setSyncing(false);
    if ("error" in result) return;
    const { synced, failed } = result.data;
    if (failed > 0) toast.error(`Nuskaityta ${synced}, nepavyko ${failed}. Klaidos matomos prie kambarių.`);
    else toast.success(synced === 0 ? "Nėra prijungtų kambarių." : `Nuskaityta kambarių: ${synced}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking.com rezervacijos („Sirvoy“)</CardTitle>
        <CardDescription>
          „Sirvoy“ → Settings → Channels → iCal → kambario „Availability (Export)“ adresas. Užimti kambariai atsiranda kalendoriuje ir užblokuoja tas naktis
          rezervacijos puslapyje. Duomenys atnaujinami kas 15 min.; į „Sirvoy“ nieko nesiunčiama. Prijungta: {connected} iš {externalCalendars.length}.
        </CardDescription>
        <CardAction>
          <Button variant="outline" onClick={sync} disabled={syncing || connected === 0} className="min-h-11">
            <ArrowsClockwiseIcon size={18} /> {syncing ? "Skaitoma…" : "Sinchronizuoti dabar"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y">
        {externalCalendars.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Kambarių dar nėra.</p> : null}
        {externalCalendars.map((calendar) => (
          <SirvoyFeedRow key={calendar.id} calendar={calendar} stayLabel={stayTypes.find((t) => t.id === calendar.stayTypeId)?.label ?? calendar.stayTypeId} />
        ))}
      </CardContent>
    </Card>
  );
}
