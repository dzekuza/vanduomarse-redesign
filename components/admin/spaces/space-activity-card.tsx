"use client";

import { CalendarPlusIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { AdminSection } from "../admin-section";
import { EventDialog } from "../events/event-dialog";
import { NewSpaceBookingDialog } from "./new-space-booking-dialog";
import { SpaceEventsList } from "./space-events-list";
import { UpcomingHiresList } from "./upcoming-hires-list";
import type { ManagedEvent } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EventEditing = { event?: ManagedEvent; template?: ManagedEvent } | null;

/**
 * What happens in the spaces, as Pirtis has its sessions: events held in a space (skirtukas „Renginiai“, each books
 * its space while it runs, ADR-0136) and private hires (skirtukas „Nuomos“). Both block the space for the other.
 */
export function SpaceActivityCard({ firstSpaceId }: { firstSpaceId?: string }) {
  const [tab, setTab] = useState("renginiai");
  const [eventEditing, setEventEditing] = useState<EventEditing>(null);
  const [hiring, setHiring] = useState(false);

  return (
    <AdminSection framed hideHeading title="Renginiai ir nuomos">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="renginiai" className="min-h-11 px-4">Renginiai</TabsTrigger>
            <TabsTrigger value="nuomos" className="min-h-11 px-4">Nuomos</TabsTrigger>
          </TabsList>
          {tab === "renginiai" ? (
            <Button onClick={() => setEventEditing({})} className="min-h-11">
              <PlusIcon size={18} /> Naujas renginys
            </Button>
          ) : (
            <Button onClick={() => setHiring(true)} className="min-h-11">
              <CalendarPlusIcon size={18} /> Nauja nuoma
            </Button>
          )}
        </div>
        <TabsContent value="renginiai" className="mt-4">
          <SpaceEventsList onEdit={(event) => setEventEditing({ event })} onDuplicate={(template) => setEventEditing({ template })} />
        </TabsContent>
        <TabsContent value="nuomos" className="mt-4">
          <UpcomingHiresList />
        </TabsContent>
      </Tabs>

      {eventEditing ? (
        <EventDialog
          key={eventEditing.event?.id ?? (eventEditing.template ? `copy-${eventEditing.template.id}` : "new")}
          open
          event={eventEditing.event}
          template={eventEditing.template}
          presetSpaceId={firstSpaceId}
          onOpenChange={(o) => !o && setEventEditing(null)}
        />
      ) : null}
      {hiring ? <NewSpaceBookingDialog onOpenChange={(o) => !o && setHiring(false)} /> : null}
    </AdminSection>
  );
}
