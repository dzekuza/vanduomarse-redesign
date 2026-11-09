"use client";

import { ArrowDownIcon, ArrowUpIcon, DotsThreeIcon, FireIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { fromRate, type Sauna } from "@/lib/sauna";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

/** The saunas in display order: cover, price, on/off, order, edit and delete. */
export function SaunasCard() {
  const { saunas, setSaunaActive, reorderSaunas, deleteSauna } = useAdmin();
  const [deleting, setDeleting] = useState<Sauna | null>(null);

  const move = (from: number, to: number) => {
    const ids = saunas.map((s) => s.id);
    ids.splice(to, 0, ...ids.splice(from, 1));
    reorderSaunas(ids);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pirtys</CardTitle>
        <CardDescription>Svetainėje lankytojas pirmiausia renkasi pirtį. Tvarka čia = tvarka svetainėje.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {saunas.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Pirčių dar nėra.</p> : null}
        {saunas.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 py-3 first:pt-0">
            <Link href={`/admin/pirtis/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground">
                {s.photos[0] ? <Image src={s.photos[0].url} alt="" fill sizes="56px" className="object-cover" /> : <FireIcon size={22} />}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-sm font-medium ${s.active ? "" : "text-muted-foreground"}`}>
                  {s.name}
                  {s.active ? null : " (paslėpta)"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  nuo {fromRate(s.rates)} €/val. · iki {s.rates.maxParty} žm. · {s.photos.length} nuotr.
                </span>
              </span>
            </Link>
            <Switch
              checked={s.active}
              aria-label={`Rodyti „${s.name}“ svetainėje`}
              onCheckedChange={(v) => {
                setSaunaActive(s.id, v);
                toast.success(v ? `${s.name}: rodoma` : `${s.name}: paslėpta`);
              }}
            />
            <div className="hidden sm:flex">
              <Button variant="ghost" size="icon" aria-label={`Aukštyn: ${s.name}`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                <ArrowUpIcon size={18} />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Žemyn: ${s.name}`} disabled={i === saunas.length - 1} onClick={() => move(i, i + 1)}>
                <ArrowDownIcon size={18} />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Veiksmai: ${s.name}`}>
                  <DotsThreeIcon size={20} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/pirtis/${s.id}`}>Redaguoti</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="sm:hidden" disabled={i === 0} onSelect={() => move(i, i - 1)}>
                  Perkelti aukštyn
                </DropdownMenuItem>
                <DropdownMenuItem className="sm:hidden" disabled={i === saunas.length - 1} onSelect={() => move(i, i + 1)}>
                  Perkelti žemyn
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(s)}>
                  Ištrinti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </CardContent>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Kartu ištrinamos nuotraukos ir uždarytos valandos. Pirties su rezervacijomis ištrinti negalima – ją galima paslėpti.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleting) return;
                const result = await deleteSauna(deleting.id);
                if ("data" in result) toast.success("Pirtis ištrinta");
                setDeleting(null);
              }}
            >
              Ištrinti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
