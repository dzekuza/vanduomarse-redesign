"use client";

import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { EventDialog } from "../events/event-dialog";
import { ProgramDialog } from "./program-dialog";
import { SaunaSessionsList } from "./sauna-sessions-list";
import type { ManagedEvent } from "@/lib/admin/types";
import { PROGRAM_KIND_LABEL, programPriceLine, type SaunaProgram } from "@/lib/sauna-programs";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Editing = { program?: SaunaProgram } | null;

/** Pirties programos (skirtukas „Programos“) ir jų seansai (skirtukas „Seansai“). */
export function ProgramsCard() {
  const { programs, events, saveProgram, deleteProgram } = useAdmin();
  const [tab, setTab] = useState("programos");
  const [editing, setEditing] = useState<Editing>(null);
  const [sessionEditing, setSessionEditing] = useState<{ event?: ManagedEvent } | null>(null);
  const [deleting, setDeleting] = useState<SaunaProgram | null>(null);
  const sessions = (id: string) => events.filter((e) => e.programId === id).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Programos</CardTitle>
        <CardDescription>Bendra, moterų, vyrų, šeimos ir privačios pirties programos su kainomis. Seansus kuriate skirtuke „Seansai“.</CardDescription>
        <CardAction>
          {tab === "programos" ? (
            <Button onClick={() => setEditing({})}>
              <PlusIcon size={18} /> <span className="hidden sm:inline">Nauja programa</span>
              <span className="sr-only sm:hidden">Nauja programa</span>
            </Button>
          ) : (
            <Button onClick={() => setSessionEditing({})}>
              <PlusIcon size={18} /> <span className="hidden sm:inline">Naujas seansas</span>
              <span className="sr-only sm:hidden">Naujas seansas</span>
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="programos" className="min-h-11 px-4">Programos</TabsTrigger>
            <TabsTrigger value="seansai" className="min-h-11 px-4">Seansai</TabsTrigger>
          </TabsList>
          <TabsContent value="programos" className="mt-4">
            <div className="divide-y">
            {programs.length === 0 ? <p className="py-3 text-sm text-muted-foreground">Programų nėra.</p> : null}
            {programs.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${p.active ? "" : "text-muted-foreground line-through"}`}>{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{programPriceLine(p)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {PROGRAM_KIND_LABEL[p.kind]}
                    {p.kind === "session" ? ` · seansų: ${sessions(p.id)}` : ""}
                  </p>
                </div>
                <Switch
                  checked={p.active}
                  aria-label={`Rodyti „${p.name}“ rezervacijoje`}
                  onCheckedChange={(v) => {
                    saveProgram({ ...p, active: v });
                    toast.success(v ? `${p.name}: rodoma` : `${p.name}: paslėpta`);
                  }}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Veiksmai: ${p.name}`}>
                      <DotsThreeIcon size={20} weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing({ program: p })}>Redaguoti</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(p)}>
                      Ištrinti
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            </div>
          </TabsContent>
          <TabsContent value="seansai" className="mt-4">
            <SaunaSessionsList onEdit={(event) => setSessionEditing({ event })} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {sessionEditing ? (
        <EventDialog key={sessionEditing.event?.id ?? "new"} open event={sessionEditing.event} presetCategory="pirtis" onOpenChange={(o) => !o && setSessionEditing(null)} />
      ) : null}
      {editing ? <ProgramDialog key={editing.program?.id ?? "new"} program={editing.program} onOpenChange={(o) => !o && setEditing(null)} /> : null}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ištrinti „{deleting?.name}“?</DialogTitle>
            <DialogDescription>Esami seansai liks be programos. Jei norite tik laikinai nerodyti, verčiau išjunkite.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Palikti
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteProgram(deleting.id);
                toast.success("Programa ištrinta");
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
