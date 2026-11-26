"use client";

import { CopyIcon, EyeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import type { RoomExportLink } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The other direction (ADR-0130): each Sirvoy room's calendar of our own confirmed cabin bookings, to paste into Sirvoy
 * so Booking.com stops selling a cabin sold here. The addresses are secret, so they load only on request.
 */
export function SirvoyExportCard() {
  const { roomExportLinks, stayTypes } = useAdmin();
  const [links, setLinks] = useState<RoomExportLink[] | null>(null);
  const [loading, setLoading] = useState(false);

  const show = async () => {
    setLoading(true);
    const result = await roomExportLinks();
    setLoading(false);
    if ("data" in result) setLinks(result.data);
  };

  const copy = async (link: RoomExportLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success(`Kambarys ${link.label}: adresas nukopijuotas`);
    } catch {
      toast.error("Nepavyko nukopijuoti. Pažymėkite adresą ir nukopijuokite ranka.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Svetainės rezervacijos į „Sirvoy“</CardTitle>
        <CardDescription>
          Kad „Booking.com“ nebeparduotų namelio, užsakyto svetainėje ar per administraciją: „Sirvoy“ → Settings → Channels → iCal → prie to paties kambario
          „Enter iCal URL here“ įklijuokite jo adresą ir pasirinkite kambario tipą. Patvirtintos rezervacijos priskiriamos laisvam kambariui; „Sirvoy“ jas
          nuskaito maždaug kas valandą. Adresai slapti: neskelbkite jų.
        </CardDescription>
        <CardAction>
          <Button variant="outline" onClick={show} disabled={loading} className="min-h-11">
            <EyeIcon size={18} /> {loading ? "Kraunama…" : links ? "Atnaujinti" : "Rodyti adresus"}
          </Button>
        </CardAction>
      </CardHeader>
      {links ? (
        <CardContent className="divide-y">
          {links.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Kambarių nėra.</p> : null}
          {links.map((link) => (
            <div key={link.calendarId} className="flex items-center gap-3 py-3 first:pt-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  Kambarys {link.label} <span className="font-normal text-muted-foreground">· {stayTypes.find((t) => t.id === link.stayTypeId)?.label ?? link.stayTypeId}</span>
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">{link.url}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-11" aria-label={`Kopijuoti kambario ${link.label} adresą`} onClick={() => copy(link)}>
                <CopyIcon size={18} />
              </Button>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
