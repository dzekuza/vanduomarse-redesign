"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ACCEPT_ALL, type ConsentChoice } from "@/lib/consent";
import { CONSENT_CATEGORIES } from "./consent-categories";

interface ConsentSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The saved choice, or null when the visitor has not chosen yet (everything starts off). */
  choice: ConsentChoice | null;
  onSave: (choice: ConsentChoice) => void;
}

function ConsentRow({ id, title, description, checked, disabled, onChange }: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-bold">{title}</Label>
        <p className="text-xs leading-relaxed text-copy">{description}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

function ConsentForm({ choice, onSave, onClose }: Pick<ConsentSettingsProps, "choice" | "onSave"> & { onClose: () => void }) {
  const [draft, setDraft] = useState<ConsentChoice>(choice ?? { analytics: false, marketing: false });
  return (
    <>
      <div>
        <ConsentRow id="consent-necessary" title="Būtini" description="Prisijungimas prie paskyros ir svetainės veikimas. Visada įjungti." checked disabled />
        {CONSENT_CATEGORIES.map(({ key, title, description }) => (
          <ConsentRow key={key} id={`consent-${key}`} title={title} description={description} checked={draft[key]} onChange={(checked) => setDraft((current) => ({ ...current, [key]: checked }))} />
        ))}
      </div>
      <DialogFooter className="gap-2">
        <Button type="button" onClick={() => { onSave(draft); onClose(); }}>Išsaugoti pasirinkimą</Button>
        <Button type="button" onClick={() => { onSave(ACCEPT_ALL); onClose(); }}>Priimti visus</Button>
      </DialogFooter>
    </>
  );
}

export function ConsentSettings({ open, onOpenChange, choice, onSave }: ConsentSettingsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Slapukų nustatymai</DialogTitle>
          <DialogDescription>Pasirink, kuriuos neprivalomus slapukus leidi. Pakeitimą gali padaryti bet kada.</DialogDescription>
        </DialogHeader>
        <ConsentForm choice={choice} onSave={onSave} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
