"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import type { ServiceSlug } from "@/components/services/service-content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** Turns one service page on or off for visitors (ADR-0137). Not optimistic: the switch moves once the database has it. */
export function PageVisibilityCard({ slug, label }: { slug: ServiceSlug; label: string }) {
  const { hiddenPages, setPageHidden } = useAdmin();
  const [saving, setSaving] = useState(false);
  const visible = !hiddenPages.includes(slug);

  const toggle = async (on: boolean) => {
    setSaving(true);
    const result = await setPageHidden(slug, !on);
    setSaving(false);
    if ("data" in result) toast.success(on ? `„${label}“ vėl rodomas svetainėje` : `„${label}“ paslėptas`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-item">Rodomas svetainėje</CardTitle>
        <CardDescription>
          {visible
            ? "Puslapis matomas lankytojams: meniu, pagrindiniame puslapyje, poraštėje ir paieškoje."
            : "Puslapis paslėptas: jo nėra meniu, pagrindiniame puslapyje, poraštėje, kainose ir svetainės žemėlapyje, o nuoroda rodo „Puslapis nerastas“. Tekstai išlieka, juos galite toliau keisti."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Label htmlFor={`page-visible-${slug}`}>{visible ? "Įjungtas" : "Išjungtas"}</Label>
          <Switch id={`page-visible-${slug}`} checked={visible} disabled={saving} onCheckedChange={(on) => void toggle(on)} />
        </div>
      </CardContent>
    </Card>
  );
}
