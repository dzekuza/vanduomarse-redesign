"use client";

import { CopyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CredentialsPanelProps {
  email: string;
  password: string;
}

/** A new or reset login, shown once: the temporary password is not stored anywhere readable. */
export function CredentialsPanel({ email, password }: CredentialsPanelProps) {
  const copy = (value: string, what: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${what} nukopijuotas`);
  };
  const row = (label: string, value: string, what: string) => (
    <div className="flex items-center justify-between gap-3 border bg-muted px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <Button variant="outline" size="icon-sm" aria-label={`Kopijuoti: ${what}`} onClick={() => copy(value, what)}>
        <CopyIcon size={18} />
      </Button>
    </div>
  );
  return (
    <div className="space-y-3">
      {row("Prisijungimas: el. paštas", email, "El. paštas")}
      {row("Laikinas slaptažodis", password, "Slaptažodis")}
      <p className="text-sm text-muted-foreground">
        Slaptažodis parodomas tik dabar. Perduokite jį žmogui saugiu būdu; prisijungęs jis gali jį pasikeisti (raktelio ikona šoninėje juostoje).
        Prisijungimo adresas: /admin/prisijungti.
      </p>
    </div>
  );
}
