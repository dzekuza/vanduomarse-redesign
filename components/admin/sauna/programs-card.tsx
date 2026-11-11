"use client";

import { PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../admin-store";
import { AdminSection } from "../admin-section";
import { EventDialog } from "../events/event-dialog";
import { ProgramDialog } from "./program-dialog";
import { ProgramTile } from "./program-tile";
import { SaunaSessionsList } from "./sauna-sessions-list";
import type { ManagedEvent } from "@/lib/admin/types";
import type { SaunaProgram } from "@/lib/sauna-programs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Editing = { program?: SaunaProgram } | null;

/** Pirties programos (skirtukas „Programos“) ir jų seansai (skirtukas „Seansai“). */
export function ProgramsCard() {
  const { programs, events, saveProgram, deleteProgram } = useAdmin();
  const [tab, setTab] = useState("seansai");
  const [editing, setEditing] = useState<Editing>(null);
  const [sessionEditing, setSessionEditing] = useState<{ event?: ManagedEvent } | null>(null);
  const [deleting, setDeleting] = useState<SaunaProgram | null>(null);
  const sessions = (id: string) => events.filter((e) => e.programId === id).length;

  return (
    <AdminSection
      framed
      hideHeading
      title="Programos"
    >
      <div>
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="seansai" className="min-h-11 px-4">Seansai</TabsTrigger>
              <TabsTrigger value="programos" className="min-h-11 px-4">Programos</TabsTrigger>
            </TabsList>
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
          </div>
          <TabsContent value="programos" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {programs.length === 0 ? <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">Programų nėra.</p> : null}
              {programs.map((p) => (
                <ProgramTile
                  key={p.id}
                  program={p}
                  sessions={sessions(p.id)}
                  onToggle={(v) => {
                    saveProgram({ ...p, active: v });
                    toast.success(v ? `${p.name}: rodoma` : `${p.name}: paslėpta`);
                  }}
                  onEdit={() => setEditing({ program: p })}
                  onDelete={() => setDeleting(p)}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="seansai" className="mt-4">
            <SaunaSessionsList onEdit={(event) => setSessionEditing({ event })} />
          </TabsContent>
        </Tabs>
      </div>

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
    </AdminSection>
  );
}
