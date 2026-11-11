"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPage } from "../admin-page";
import { useAdmin } from "../admin-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

/** Owner-only: site-wide switches. For now one: the public "coming soon" page. */
export function SiteSettingsView() {
  const { siteSettings, setComingSoon } = useAdmin();
  const [saving, setSaving] = useState(false);

  async function onChange(enabled: boolean) {
    setSaving(true);
    const result = await setComingSoon(enabled);
    setSaving(false);
    if ("data" in result) toast.success(enabled ? "Svetainė uždaryta: rodomas „Netrukus“ puslapis" : "Svetainė atidaryta lankytojams");
  }

  return (
    <AdminPage title="Svetainė" description="Visos svetainės nustatymai. Pakeitimas pasiekia lankytojus per kelias sekundes, nieko perkelti į serverį nereikia.">
      {siteSettings ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-item">
              Puslapis „Netrukus“
              <Badge variant={siteSettings.comingSoon ? "secondary" : "default"}>{siteSettings.comingSoon ? "Įjungtas" : "Išjungtas"}</Badge>
            </CardTitle>
            <CardDescription>
              Įjungus, lankytojai vietoj svetainės mato puslapį „Netrukus atsidarom“ (paieškos sistemos jo neindeksuoja). Administravimo skydelis veikia kaip įprasta. Išjungus, svetainė atsidaro visiems.
            </CardDescription>
            <CardAction>
              <Switch checked={siteSettings.comingSoon} disabled={saving} aria-label="Rodyti puslapį „Netrukus“" onCheckedChange={onChange} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Peržiūros kodą (SITE_GATE_CODE), kuriuo komanda gali matyti svetainę, kol ji uždaryta, keičia serverio nustatymai.
            </p>
          </CardContent>
        </Card>
      ) : (
        <p className="max-w-2xl border border-dashed p-6 text-sm text-muted-foreground">Nustatymų nepavyko įkelti. Patikrinkite, ar pritaikyta duomenų bazės migracija „site_settings“.</p>
      )}
    </AdminPage>
  );
}
